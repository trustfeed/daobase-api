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

const collectionName = 'coinPaymentsTransaction';

@injectable()
export class CoinPaymentsService {
  private client;
  private mongoConn;

  constructor() {
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
        .find({ coinPaymentsId: stringToId(id) })
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
    transaction = model.checkEtherReceived(transaction);
    // TODO: Use web3 to transfer the tokens to the given address
    // TODO: Make an event listener to find transfer
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

  public async prepareTransaction(toPurchase, paymentCurrency, userId, campaign) {
    if (!isDeployed(campaign)); {
      throw new TypedError(500, 'the campaign is not deployed');
    }
    if (!isOngoing(campaign)) {
      throw new TypedError(500, 'the campaign is not ongoing');
    }
    const rate = Web3.utils.toBN(campaign.onChainData.rate);
    const tokenCost = Web3.utils.toBN(toPurchase).div(rate);
    // TODO: compute this
    const transactionFee = Web3.utils.toBN('10000');
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
      ipn_url: 'https://api-test.daobase.io/coin-payments'
    };
    const tx = await this._prepareTransaction(opts);
    const toSave = new model.CoinPayments(
            userId,
            campaign._id.toString(),
            tx.address,
            paymentCurrency,
            toPurchase,
            tx.amount,
            etherAmount,
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
