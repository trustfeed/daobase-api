import { controller, httpGet, httpPost, httpPut, queryParam, request, requestBody, response } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { TypedError } from '../utils';
import { UserService } from '../services/user';
import { HostedCampaignService } from '../services/hostedCampaign';
import { Web3Service } from '../services/web3';
import TYPES from '../constant/types';
import { authMiddleware } from '../middleware/auth';
import { HostedCampaign, submitForReview, reviewAccepted, cancelReview, makeDeployment, updateOnChainData, updateOffChainData } from '../models/hostedCampaign';
import * as viewCampaigns from '../views/campaign';
import * as onChain from '../models/onChainData';
import * as offChain from '../models/offChainData';
import { isKYCVerified } from '../models/user';
import { S3Service } from '../services/s3';
import config from '../config';
import CoinPayments from 'coinpayments';
import { Request, Response, NextFunction } from 'express';

const cpMiddleware = CoinPayments.ipn({
  'merchantId': config.coinPaymentsMerchantID,
  'merchantSecret': config.coinPaymentsIPNSecret
});
const IPN_RESPONSE_STATUS_COMPLETE = 100;

@controller(
  '/coin-payments',
  (req, res, next) => cpMiddleware(req, { end: () => { return; } }, next)
)
export class CoinPaymentsController {
  @httpPost('/')
  public async post(
    req: Request,
    res: Response,
    next
  ): Promise<void> {
    try {
      if (req.body.status >= IPN_RESPONSE_STATUS_COMPLETE) {
        // complete
        console.log('done');
      } else if (req.body.status < 0) {
        // fail
        console.log('failed');
      } else {
        // pending
        console.log('pending');
      }

      res.end('IPN OK');
    } catch (error) {
      console.log(error);
      res.end('IPN Error: ' + error);
    }
  }
}
