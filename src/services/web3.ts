import { inject, injectable } from 'inversify';
import Web3 from 'web3';
import config from '../config';
import { Web3Connection } from '../utils/web3/connection';

@injectable()
export class Web3Service {
  private web3;

  constructor() {
    Web3Connection.getConnection((connection) => {
      this.web3 = connection;
    });
  }

  createContract(abi, address?) {
    return new this.web3.eth.Contract(abi, address);
  }

  getBlockNumber() {
    return this.web3.eth.getBlockNumber();
  }

  getGasPrice() {
    return this.web3.eth.getGasPrice();
  }

  coinPaymentsAccount() {
    console.log(process.env.COIN_PAYMENTS_PRIVATE_KEY);
    console.log(config.coinPaymentsPrivateKey);
    return this.web3.eth.accounts.privateKeyToAccount(config.coinPaymentsPrivateKey);
  }

  sendSignedTransaction(tx) {
    this.web3.eth.sendSignedTransaction(tx.rawTransaction);
  }
}
