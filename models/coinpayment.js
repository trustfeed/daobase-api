import Coinpayments from 'coinpayments';
import config from '../config';

const options = {
  key: config.coinPaymentsKey,
  secret: config.coinPaymentsSecret,
};
let client = new Coinpayments(options);

const supportedCurrencies = ['BTC', 'LTC', 'EOS'];

let coinpayments = {
  prepareTransaction: async (
    etherAmount,
    paymentCurrency,
    userId,
    campaignId,
  ) => {
    const opts = {
      currency1: 'ETH',
      currency2: paymentCurrency,
      amount: etherAmount,
      buyer_name: userId,
      item_name: campaignId,
    };
    // wrap this in a promise
    return new Promise((resolve, reject) => {
      client.createTransaction(
        opts,
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
    });
    // save this in the DB
  },

  supportedCurrency: currency => {
    for (const supported of supportedCurrencies) {
      if (currency === supported) {
        return true;
      }
    }
    return false;
  },
};

export default coinpayments;
