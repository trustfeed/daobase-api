import { inject, injectable } from 'inversify';
import { MongoDBClient } from '../utils/mongodb/client';
import { MongoDBConnection } from '../utils/mongodb/connection';
import { stringToId } from '../utils/mongodb/stringToId';
import TYPES from '../constant/types';
import config from '../config';
import Coinpayments from 'coinpayments';

const collectionName = 'coinPaymentsTransaction';

@injectable()
export class CoinPaymentsService {
  private client;
  constructor(
    @inject(TYPES.MongoDBClient) private mongoClient: MongoDBClient
  ) {
    const options = {
      key: config.coinPaymentsKey,
      secret: config.coinPaymentsSecret
    };
    this.client = new Coinpayments(options);
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

  public async prepareTransaction(etherAmount, paymentCurrency, userId, campaignId) {
    const opts = {
      currency1: 'ETH',
      currency2: paymentCurrency,
      amount: etherAmount,
      buyer_name: userId,
      item_name: campaignId,
      ipn_url: 'https://api-test.daobase.io/coin-payments'
    };
    return new Promise((resolve, reject) => {
      this.client.createTransaction(opts, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    // save this in the DB
  }
}
