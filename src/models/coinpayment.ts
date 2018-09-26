import Coinpayments from 'coinpayments';
import config from '../config';

const options = {
  key: config.coinPaymentsKey,
  secret: config.coinPaymentsSecret
};
let client = new Coinpayments(options);

// client.getCallbackAddress('BTC', (err, data) => { console.log(err, data); });
// client.rates((err,res) => { console.log(res) });

const supportedCurrencies = ['BTC', 'LTC', 'XRP'];

let coinpayments = {
  prepareTransaction: async (etherAmount, paymentCurrency, userId, campaignId) => {
    const opts = {
      currency1: 'ETH',
      currency2: paymentCurrency,
      amount: etherAmount,
      buyer_name: userId,
      item_name: campaignId,
      ipn_url: 'https://api-test.daobase.io/coin-payments'
    };
    // wrap this in a promise
    return new Promise((resolve, reject) => {
      client.createTransaction(opts, (err, data) => {
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
  }
};

export default coinpayments;
