import { controller, httpGet, httpPost, httpPut, queryParam, request, requestBody, response } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { TypedError } from '../utils';
import { UserService } from '../services/user';
import { HostedCampaignService } from '../services/hostedCampaign';
import { CoinPaymentsService } from '../services/coinPayments';
import TYPES from '../constant/types';
import { authMiddleware } from '../middleware/auth';
import { HostedCampaign, submitForReview, reviewAccepted, cancelReview, makeDeployment } from '../models/hostedCampaign';
import * as viewCampaigns from '../views/campaign';
import * as onChain from '../models/onChainData';
import * as offChain from '../models/offChainData';
import { CoinPayments } from '../models/coinPayments';
import config from '../config';
import Web3 from 'web3';

@controller('/campaigns', authMiddleware)
export class CampaignsController {
  constructor(@inject(TYPES.HostedCampaignService) private hostedCampaignService: HostedCampaignService,
              @inject(TYPES.CoinPaymentsService) private coinPaymentsService: CoinPaymentsService
             ) {
  }

  @httpGet('/')
  async getAll(
    @queryParam('offset') offset,
    @request() req
  ) {
    const out = await this.hostedCampaignService.findAllPublic(offset);
    out.campaigns = out.campaigns.map(viewCampaigns.hostedPublicBrief);
    return out;
  }

  @httpGet('/:id')
  async get(
    @request() req
  ) {
    const campaign = await this.hostedCampaignService.findById(req.params.id);
    if (!campaign) {
      throw new TypedError(404, 'campaign not found');
    }
    return viewCampaigns.hostedPublicFull(campaign);
  }

  @httpPost('/:id/alternative-payment')
  async alternativePayment(
    @request() req,
    @response() res
  ) {
    const { currency, tokensToPurchase } = req.body;
    if (!currency) {
      throw new TypedError(400, 'currency required');
    }
    if (!tokensToPurchase) {
      throw new TypedError(400, 'tokensToPurchase required');
    }
    if (!this.coinPaymentsService.supportedCurrency(currency)) {
      throw new TypedError(400, 'unsupported currency');
    }
    let tokens;
    try {
      tokens = Web3.utils.toBN(tokensToPurchase);
    } catch (err) {
      throw new TypedError(400, 'cannot convert tokensToPurchase to an integer');
    }
    const campaign = await this.hostedCampaignService.findById(req.params.id);
    if (!campaign) {
      throw new TypedError(404, 'unknown campaign');
    }

    const out = await this.coinPaymentsService.prepareTransaction(
      tokensToPurchase,
      currency,
      req.decoded.id,
      req.decoded.publicAddress,
      campaign
    );
    return out;
  }
}
