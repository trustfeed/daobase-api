import express from 'express';
import CoinPayments from 'coinpayments';
import config from '../../config';

const middleware = [
  function (req, res, next) {
    // Handle via middleware
    console.log(req);
    next();
  },
  CoinPayments.ipn({
    'merchantId': config.coinPaymentsMerchantID,
    'merchantSecret': config.coinPaymentsIPNSecret,
  }),
  function (req, res, next) {
    // Handle via middleware
    console.log(req.body);
  },
];

const router = express.Router();
router.use('/', middleware);

export default router;
