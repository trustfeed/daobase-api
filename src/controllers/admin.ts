import { controller, httpGet, httpPost, httpPut, queryParam, request, requestBody, response } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { TypedError } from '../utils';
import { UserService } from '../services/user';
import { HostedCampaignService } from '../services/hostedCampaign';
import { Web3Service } from '../services/web3';
import TYPES from '../constant/types';
import { authMiddleware } from '../middleware/auth';
import { HostedCampaign, submitForReview, reviewAccepted, cancelReview, makeDeployment, updateOnChainData, updateOffChainData, submitFinalise } from '../models/hostedCampaign';
import * as viewCampaigns from '../views/campaign';
import * as onChain from '../models/onChainData';
import * as offChain from '../models/offChainData';
import { isKYCVerified } from '../models/user';
import { S3Service } from '../services/s3';
import config from '../config';

// TODO: These type conversion are ugly. Also types should be input first
const requestToOnChainData = (body) => {
  return new onChain.OnChainData(
    body.tokenName,
    body.tokenSymbol,
    parseInt(body.numberOfDecimals, 10),
    parseInt(body.startingTime, 10),
    Number(body.duration),
    body.rate,
    body.softCap,
    body.hardCap,
    body.isMinted
  );
};

const requestToOffChainData = (body) => {
  return new offChain.OffChainData(
    body.coverImageURL,
    body.whitePaperURL,
    body.summary,
    body.description,
    body.keywords
  );
};

@controller('/admin', authMiddleware)
export class AdminController {
  constructor(@inject(TYPES.UserService) private userService: UserService,
              @inject(TYPES.HostedCampaignService) private hostedCampaignService: HostedCampaignService,
              @inject(TYPES.Web3Service) private web3Service: Web3Service,
              @inject(TYPES.S3Service) private s3Service: S3Service
             ) {
  }

  @httpPost('/hosted-campaigns')
  async post(
    @request() req,
    @requestBody() body: any,
    @response() res
  ) {
    const user = await this.getUser(req.decoded.id);

    let campaign = new HostedCampaign(
        user._id,
        requestToOnChainData(req.body)
      );
    campaign = await this.hostedCampaignService.insert(campaign);
    res.status(201).send({
      campaignID: campaign._id
    });
  }

  @httpGet('/hosted-campaigns')
  async getAll(
    @queryParam('offset') offset,
    @request() req
  ) {
    const user = await this.getUser(req.decoded.id);
    const out = await this.hostedCampaignService.findByOwner(req.decoded.id, offset);
    out.campaigns = out.campaigns.map(viewCampaigns.hostedAdminBrief);
    return out;
  }

  @httpGet('/hosted-campaigns/:id')
  async get(
    @request() req
  ) {
    const { campaign } = await this.getUserAndCampaign(req.decoded.id, req.params.id);
    return viewCampaigns.hostedAdminFull(campaign);
  }

  @httpPut('/hosted-campaigns/:id/on-chain-data')
  async putOnChainData(
    @request() req,
    @response() res
  ) {
    let { campaign } = await this.getUserAndCampaign(req.decoded.id, req.params.id);
    campaign = updateOnChainData(campaign, requestToOnChainData(req.body));
    await this.hostedCampaignService.update(campaign);
    res.status(201).send({
      message: 'Accepted'
    });
  }

  @httpPut('/hosted-campaigns/:id/off-chain-data')
  async putOffChainData(
    @request() req,
    @response() res
  ) {
    let { campaign } = await this.getUserAndCampaign(req.decoded.id, req.params.id);

    campaign = updateOffChainData(campaign, requestToOffChainData(req.body));
    await this.hostedCampaignService.update(campaign);
    res.status(201).send({
      message: 'Accepted'
    });

    if (config.dev) {
      setTimeout(async () => {
        reviewAccepted(campaign);
        await this.hostedCampaignService.update(campaign);
      }, 10 * 1000);
    }
  }

  @httpPost('/hosted-campaigns/:id/cover-image')
  async coverImage(
    @request() req,
    @response() res
  ) {
    const { campaign } = await this.getUserAndCampaign(req.decoded.id, req.params.id);

    const extension = req.body.extension || 'png';
    const contentType = req.body.contentType || 'image/png';

    const url = await this.s3Service.signUpload(
        campaign._id.toString(),
        'images',
        extension,
        contentType
      );
    const uploadURL = url;
    const viewURL = uploadURL.split(/[?#]/)[0];
    res.status(201).send({
      uploadURL,
      viewURL
    });
  }

  @httpPost('/hosted-campaigns/:id/white-paper')
  async whitePaper(
    @request() req,
    @response() res
  ) {
    const { campaign } = await this.getUserAndCampaign(req.decoded.id, req.params.id);

    const extension = req.body.extension || 'pdf';
    const contentType = req.body.contentType || 'application/pdf';

    const url = await this.s3Service.signUpload(
        campaign._id.toString(),
        'white-papers',
        extension,
        contentType
      );
    const uploadURL = url;
    const viewURL = uploadURL.split(/[?#]/)[0];
    res.status(201).send({
      uploadURL,
      viewURL
    });
  }

  @httpPost('/hosted-campaigns/:id/submit-for-review')
  async submitForReview(
    @request() req,
    @response() res
  ) {
    const { campaign } = await this.getUserAndCampaign(req.decoded.id, req.params.id);
    submitForReview(campaign);
    await this.hostedCampaignService.update(campaign);
    res.status(201).send({ message: 'accepted' });

    if (config.dev) {
      setTimeout(async () => {
        reviewAccepted(campaign);
        await this.hostedCampaignService.update(campaign);
      }, 10 * 1000);
    }
  }

  @httpPost('/hosted-campaigns/:id/cancel-review')
  async cancelReview(
    @request() req,
    @response() res
  ) {
    let { campaign } = await this.getUserAndCampaign(req.decoded.id, req.params.id);
    campaign = cancelReview(campaign);
    await this.hostedCampaignService.update(campaign);
    res.status(201).send({ message: 'accepted' });
  }

  @httpGet('/hosted-campaigns/:id/deployment-transaction')
  async deploymentTransaction(
   @request() req
  ) {
    const { campaign, user } = await this.getUserAndCampaign(req.decoded.id, req.params.id);
    const out = await makeDeployment(campaign, user.publicAddress, this.web3Service);
    await this.hostedCampaignService.update(campaign);
    return out;
  }

  @httpPost('/hosted-campaigns/:id/finalise')
  async finalise(
   @request() req
  ) {
    let { campaign, user } = await this.getUserAndCampaign(req.decoded.id, req.params.id);
    let [campaignDash, byteCode] = submitFinalise(campaign, this.web3Service);
    await this.hostedCampaignService.update(campaignDash);
    req.status(201).message({ transaction: byteCode });
  }

  private async getUser(userId) {
    const user = await this.userService.findById(userId);
    if (user === null || user === undefined) {
      throw new TypedError(404, 'user not found');
    }
    if (!isKYCVerified(user)) {
      throw new TypedError(400, 'KYC verification is required');
    }
    return user;
  }

  private async getUserAndCampaign(userId, campaignId) {
    const user = await this.getUser(userId);
    const campaign = await this.hostedCampaignService.findById(campaignId);
    if (campaign === null || campaign === undefined) {
      throw new TypedError(404, 'campaign not found');
    }
    if (user._id.toString() !== campaign.ownerId.toString()) {
      throw new TypedError(403, 'not permitted');
    }
    return { user, campaign };
  }
}
