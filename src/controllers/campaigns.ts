import { controller, httpGet, httpPost, httpPut, queryParam, request, requestBody, response } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { TypedError } from '../utils';
import { UserService } from '../services/user';
import { HostedCampaignService } from '../services/hostedCampaign';
import { Web3Service } from '../services/web3';
import TYPES from '../constant/types';
import { authMiddleware } from '../middleware/auth';
import { HostedCampaign, submitForReview, reviewAccepted, cancelReview, makeDeployment } from '../models/hostedCampaign';
import * as viewCampaigns from '../views/campaign';
import * as onChain from '../models/onChainData';
import * as offChain from '../models/offChainData';
import { signUpload } from '../models/s3';
import config from '../config';

@controller('/campaigns', authMiddleware)
export class CampaignsController {
  constructor(@inject(TYPES.HostedCampaignService) private hostedCampaignService: HostedCampaignService
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
    } else {
      return viewCampaigns.hostedPublicFull(campaign);
    }
  }

}
