import { inject, injectable } from 'inversify';
import { MongoDBConnection } from '../utils/mongodb/connection';
import { stringToId } from '../utils/mongodb/stringToId';
import TYPES from '../constant/types';
import config from '../config';
import Coinpayments from 'coinpayments';
import * as model from '../models/coinPayments';
import Web3 from 'web3';
import { TypedError } from '../utils';
import { isDeployed, isOngoing } from '../models/hostedCampaign';
import { Web3Service } from '../services/web3';
import { HostedCampaignService } from '../services/hostedCampaign';

const collectionName = 'coinPaymentsTransaction';

@injectable()
export class CoinPaymentsService {
  private client;
  private mongoConn;

  constructor(
    @inject(TYPES.Web3Service) private web3Service: Web3Service,
    @inject(TYPES.HostedCampaignService) private hostedCampaignService: HostedCampaignService
  ) {
    const options = {
      key: config.coinPaymentsKey,
      secret: config.coinPaymentsSecret
    };
    this.client = new Coinpayments(options);
    MongoDBConnection.getConnection(conn => {
      this.mongoConn = conn;
    });
  }

  public supportedCurrency(currency: string): boolean {
    const supportedCurrencies = ['BTC', 'LTC', 'XRP'];
    for (const supported of supportedCurrencies) {
      if (currency === supported) {
        return true;
      }
    }
    return false;
  }

  public findByTransactionId(id) {
    return new Promise<any>((resolve, reject) => {
      this.mongoConn.collection(collectionName)
        .find({ coinPaymentsId: id })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray((error, data) => {
          if (error) {
            reject(error);
          }
          data.length > 0 ?
            resolve(data[0]) :
            resolve(undefined);
        });
    });
  }

  public updateTransaction(tx) {
    return new Promise<any>((resolve, reject) => {
      this.mongoConn.collection(collectionName)
        .update(
          { _id: stringToId(tx._id) },
          { $set: tx },
          (error, data) => {
            if (error) {
              reject(error);
            } else {
              resolve(data);
            }
          });
    });
  }

  public async checkEtherReceived(txId) {
    let transaction = await this.findByTransactionId(txId);
    if (!transaction) {
      throw new TypedError(500, 'unknown transaction');
    }
    // TODO: Use web3 to check the ether was recieved
    const campaign = await this.hostedCampaignService.findById(transaction.campaignId);
    if (!campaign) {
      throw new TypedError(404, 'unknown campaign');
    }

    const abi = campaign.onChainData.crowdsaleContract.abi;
    const address = campaign.onChainData.crowdsaleContract.address;
    const contract = this.web3Service.createContract(abi, address);
    const gasCost = Web3.utils.toBN(transaction.transferFee);
    const gasPrice = Web3.utils.toBN(transaction.gasPrice);
    const gas = gasCost.div(gasPrice);
    const value = Web3.utils.toBN(Web3.utils.toWei(transaction.etherAmount)).sub(gasCost);
    const buyTokens = await contract.methods.buyTokens(transaction.userAddress);
    const coinPaymentsAccount = this.web3Service.coinPaymentsAccount();
    let tx = await coinPaymentsAccount.signTransaction({
      data: buyTokens.encodeABI(),
      gas: Web3.utils.toHex(gas),
      gasPrice: Web3.utils.toHex(gasPrice),
      from: config.coinPaymentsAddress,
      value: Web3.utils.toHex(value),
      to: address
    });

    this.web3Service.sendSignedTransaction(tx)
      .on('receipt', async (r) => {
        let tx = await this.findByTransactionId(txId);
        tx = model.checkTokenTransfer(tx);
        await this.updateTransaction(tx);
      })
      .on('error', (err) => {
        console.log(err);
        // TODO: email the admin about error
      });

    transaction = model.checkEtherReceived(transaction);
    await this.updateTransaction(transaction);
  }

  private async _prepareTransaction(opts) {
    return new Promise<any>((resolve, reject) => {
      this.client.createTransaction(opts, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  private async _insertDB(cp) {
    return new Promise<any>((resolve, reject) => {
      this.mongoConn.collection(collectionName)
      .insert(cp, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  public async prepareTransaction(toPurchase, paymentCurrency, userId, userAddress, campaign) {
    if (!isDeployed(campaign)) {
      throw new TypedError(400, 'the campaign is not deployed');
    }
    if (!isOngoing(campaign)) {
      throw new TypedError(400, 'the campaign is not ongoing');
    }
    // Get campaign contracts
    const abi = campaign.onChainData.crowdsaleContract.abi;
    const address = campaign.onChainData.crowdsaleContract.address;
    const contract = this.web3Service.createContract(abi, address);

    // Token cost
    const rate = Web3.utils.toBN(campaign.onChainData.rate);
    const tokenCost = Web3.utils.toBN(toPurchase).div(rate);

    // The gas cost to transfer the tokens once coin payments is complete
    // let transactionFee: any;
    // let gasPrice: string;
    // try {
    //  const gasLimit = await this.web3Service.getGasLimit();
    //  console.log(gasLimit);
    //  const gasEstimate = await contract.methods.buyTokens(config.coinPaymentsAddress)
    //                            .estimateGas({ value: tokenCost, from: config.coinPaymentsAddress, gas: gasLimit });
    //  gasPrice = await this.web3Service.getGasPrice();
    //  transactionFee = Web3.utils.toBN(gasEstimate)
    //                     .mul(Web3.utils.toBN(gasPrice));
    // } catch (err) {
    //  console.log(err);
    //  throw new TypedError(500, 'cannot estimate gas cost');
    // }
    let transactionFee = Web3.utils.toBN('1000000');
    let gasPrice = await this.web3Service.getGasPrice();

    // The total cost
    const etherAmount = Web3.utils.fromWei(tokenCost.add(transactionFee), 'ether');
    if (etherAmount < 0.05) {
      throw new TypedError(400, 'the amount is too small');
    }

    const opts = {
      currency1: 'ETH',
      currency2: paymentCurrency,
      amount: etherAmount,
      buyer_name: userId,
      item_name: campaign._id.toString(),
      ipn_url: `${config.backendHost}/coin-payments`
    };
    const tx = await this._prepareTransaction(opts);
    const toSave = new model.CoinPayments(
      userId,
      campaign._id.toString(),
      campaign.onChainData.tokenContract.address,
      userAddress,
      paymentCurrency,
      toPurchase,
      tx.amount,
      etherAmount,
      transactionFee.toString(),
      gasPrice,
      tx.txn_id
    );
    this._insertDB(toSave);
    return {
      currency: paymentCurrency,
      amount: tx.amount,
      transactionID: tx.txn_id,
      address: tx.address,
      confirmsNeeded: tx.confirms_needed,
      timeout: tx.timeout,
      statusURL: tx.status_url,
      qrCodeURL: tx.qrcode_url,
      tokenTransferFee: transactionFee
    };
  }
}
