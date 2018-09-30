import { controller, httpGet, httpPost, httpPut, queryParam, request, requestBody, response } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { TypedError } from '../utils';
import { UserService } from '../services/user';
import { HostedCampaignService } from '../services/hostedCampaign';
import { InvestmentService } from '../services/investment';
import { Web3Service } from '../services/web3';
import TYPES from '../constant/types';
import { authMiddleware } from '../middleware/auth';
import { HostedCampaign, submitForReview, reviewAccepted, cancelReview, makeDeployment } from '../models/hostedCampaign';
import * as viewCampaigns from '../views/campaign';
import * as onChain from '../models/onChainData';
import * as offChain from '../models/offChainData';
import { S3Service } from '../services/s3';
import config from '../config';
import * as view from '../views/investment';

@controller('/investments', authMiddleware)
export class InvestmentsController {
  constructor(
    @inject(TYPES.InvestmentService) private investmentService: InvestmentService
  ) { }

  @httpGet('/')
  async get(
    @request() req,
    @queryParam('order') order,
    @queryParam('offset') offset
  ) {
    if (!order) {
      order = 'symbol';
    }
    const out = await this.investmentService.findByOwner(req.decoded.id, order, offset);
    return { investments: out.investments.map(view.investment), nextOffset: out.nextOffset };
  }
}
