import { controller, httpGet, httpPost, httpPut, queryParam, request, requestBody, response } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { TypedError } from '../utils';
import { UserService } from '../services/user';
import TYPES from '../constant/types';
import { authMiddleware } from '../middleware/auth';
import { HostedCampaignService } from '../services/hostedCampaign';
import { HostedCampaign, submitForReview, reviewAccepted, cancelReview } from '../models/hostedCampaign';
import * as viewCampaigns from '../views/campaign';
import * as onChain from '../models/onChainData';
import * as offChain from '../models/offChainData';
import { signUpload } from '../models/s3';
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
    body.keywords
  );
};

@controller('/admin', authMiddleware)
export class AdminController {
  constructor(@inject(TYPES.UserService) private userService: UserService,
	      @inject(TYPES.HostedCampaignService) private hostedCampaignService: HostedCampaignService
	     ) {}

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
    const { campaign } = await this.getUserAndCampaign(req.decoded.id, req.params.id);

    campaign.onChainData = requestToOnChainData(req.body);
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
    const { campaign } = await this.getUserAndCampaign(req.decoded.id, req.params.id);

    campaign.offChainData = requestToOffChainData(req.body);
    await this.hostedCampaignService.update(campaign);
    res.status(201).send({
      message: 'Accepted'
    });
  }

  @httpPost('/hosted-campaigns/:id/cover-image')
  async coverImage(
    @request() req,
    @response() res
  ) {
    const { campaign } = await this.getUserAndCampaign(req.decoded.id, req.params.id);

    const extension = req.body.extension || 'png';
    const contentType = req.body.contentType || 'image/png';

    const url = await signUpload(
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

    const url = await signUpload(
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
    const { campaign } = await this.getUserAndCampaign(req.decoded.id, req.params.id);
    cancelReview(campaign);
    await this.hostedCampaignService.update(campaign);
    res.status(201).send({ message: 'accepted' });
  }

  // @httpPost('/hosted-campaigns/:id/deployment-transaction')
  // async deploymentTransaction(
  //  @request() req,
  //  @response() res
  // ) {
  //  const { campaign } = await this.getUserAndCampaign(req.decoded.id, req.params.id);
  //  // const out = await deploymentTransaction(campaign, hostedCampaignService);
  //  // return out;
  // }

  private async getUser(userId) {
    const user = await this.userService.findById(userId);
    if (user === null || user === undefined) {
      throw new TypedError(404, 'user not found');
    }
    if (user.kycStatus !== 'VERIFIED') {
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

//// Create an empty post for the logged in user
// export const post = async (req, res, next) => {
//  try {
//    if (!req.decoded || !req.decoded.publicAddress) {
//      throw new utils.TypedError(400, 'missing public address');
//    }
//
//    let campaign = await User.addHostedCampaign(req.decoded.publicAddress, req.body);
//    res.status(201).send({
//      campaign_id: campaign.id
//    });
//  } catch (err) {
//    next(err);
//  }
// };
//
//// Get a campaign
// export const get = async (req, res, next) => {
//  try {
//    if (!req.decoded.id) {
//      throw new utils.TypedError(400, 'missing user id');
//    }
//
//    if (!req.params.id) {
//      throw new utils.TypedError(400, 'missing campaign id');
//    }
//
//    const campaignId = utils.stringToId(req.params.id);
//    let campaign = await Campaign.fetchHostedCampaign(req.decoded.id, campaignId);
//    res.status(200).send(views.adminFull(campaign));
//  } catch (err) {
//    next(err);
//  }
// };
//
//// A list of campaigns
// export const getAll = async (req, res, next) => {
//  try {
//    if (!req.decoded.id) {
//      throw new utils.TypedError(400, 'missing user id');
//    }
//
//    let data = await Campaign.findHostedByOwner(req.decoded.id, req.query.offset);
//    // await Promise.all(data.campaigns.map(x => x.addWeiRaised()));
//    data.campaigns = data.campaigns.map(views.adminBrief);
//    res.status(200).send(data);
//  } catch (err) {
//    next(err);
//  }
// };
//
// export const putOnChainData = async (req, res, next) => {
//  try {
//    if (!req.decoded.id) {
//      throw new utils.TypedError(400, 'missing user id');
//    }
//
//    if (!req.params.id) {
//      throw new utils.TypedError(400, 'missing campaign id');
//    }
//
//    const campaignId = utils.stringToId(req.params.id);
//    await Campaign.putOnChainData(req.decoded.id, campaignId, req.body);
//    res.status(201).send({
//      message: 'updated'
//    });
//  } catch (err) {
//    next(err);
//  }
// };
//
// export const putOffChainData = async (req, res, next) => {
//  try {
//    if (!req.decoded.id) {
//      throw new utils.TypedError(400, 'missing user id');
//    }
//
//    if (!req.params.id) {
//      throw new utils.TypedError(400, 'missing campaign id');
//    }
//
//    const campaignId = utils.stringToId(req.params.id);
//    await Campaign.putOffChainData(req.decoded.id, campaignId, req.body);
//    res.status(201).send({
//      message: 'updated'
//    });
//  } catch (err) {
//    next(err);
//  }
// };
//
//// This returns a presigned URL to upload an image
// export const coverImageURL = async (req, res, next) => {
//  try {
//    if (!req.decoded.id) {
//      throw new utils.TypedError(400, 'missing user id');
//    }
//
//    if (!req.params.id) {
//      throw new utils.TypedError(400, 'missing campaign id');
//    }
//
//    const extension = req.body.extension || 'jpg';
//    const contentType = req.body.contentType || 'image/jpeg';
//
//    const campaignId = utils.stringToId(req.params.id);
//    await Campaign.fetchHostedCampaign(req.decoded.id, campaignId);
//    const url = await s3.signUpload(campaignId, 'images', extension, contentType);
//    const uploadURL: any = url;
//    const viewURL = uploadURL.split(/[?#]/)[0];
//    res.status(201).send({
//      uploadURL,
//      viewURL
//    });
//  } catch (err) {
//    next(err);
//  }
// };
//
//// This returns a presigned URL to upload a white paper pdf
// export const pdfURL = async (req, res, next) => {
//  try {
//    if (!req.decoded.id) {
//      throw new utils.TypedError(400, 'missing user id');
//    }
//
//    if (!req.params.id) {
//      throw new utils.TypedError(400, 'missing campaign id');
//    }
//
//    const extension = req.body.extension || 'pdf';
//    const contentType = req.body.contentType || 'application/pdf';
//
//    const campaignId = utils.stringToId(req.params.id);
//    await Campaign.fetchHostedCampaign(req.decoded.id, campaignId);
//    const url = await s3.signUpload(req.params.id, 'white-papers', extension, contentType);
//    const uploadURL: any = url;
//    const viewURL = uploadURL.split(/[?#]/)[0];
//    res.status(201).send({
//      uploadURL,
//      viewURL
//    });
//  } catch (err) {
//    next(err);
//  }
// };
//
// export const submitForReview = async (req, res, next) => {
//  try {
//    if (!req.decoded.id) {
//      throw new utils.TypedError(400, 'missing user id');
//    }
//
//    if (!req.params.id) {
//      throw new utils.TypedError(400, 'missing campaign id');
//    }
//
//    const userId = req.decoded.id;
//    const campaignId = utils.stringToId(req.params.id);
//
//    await Campaign.submitForReview(userId, campaignId);
//    res.status(201).send({
//      message: 'submitted'
//    });
//    setTimeout(() => {
//      Campaign.acceptReview(userId, campaignId);
//    }, 60 * 1000);
//  } catch (err) {
//    next(err);
//  }
// };
//
// export const cancelReview = async (req, res, next) => {
//  try {
//    if (!req.decoded.id) {
//      throw new utils.TypedError(400, 'missing user id');
//    }
//
//    if (!req.params.id) {
//      throw new utils.TypedError(400, 'missing campaign id');
//    }
//
//    const userId = req.decoded.id;
//    const campaignId = utils.stringToId(req.params.id);
//
//    await Campaign.cancelReview(userId, campaignId);
//    res.status(201).send({
//      message: 'cancelled'
//    });
//  } catch (err) {
//    next(err);
//  }
// };
//
// export const acceptReview = async (req, res, next) => {
//  try {
//    if (!req.decoded.id) {
//      throw new utils.TypedError(400, 'missing user id');
//    }
//
//    if (!req.params.id) {
//      throw new utils.TypedError(400, 'missing campaign id');
//    }
//
//    const userId = req.decoded.id;
//    const campaignId = utils.stringToId(req.params.id);
//
//    await Campaign.acceptReview(userId, campaignId);
//    res.status(201).send({
//      message: 'accepted'
//    });
//  } catch (err) {
//    next(err);
//  }
// };
//
// export const deploymentTransaction = async (req, res, next) => {
//  try {
//    if (!req.decoded.id) {
//      throw new utils.TypedError(400, 'missing user id');
//    }
//
//    if (!req.params.id) {
//      throw new utils.TypedError(400, 'missing campaign id');
//    }
//
//    const userId = req.decoded.id;
//    const userAddress = req.decoded.publicAddress;
//    const campaignId = utils.stringToId(req.params.id);
//
//    const out = await Campaign.deploymentTransaction(userId, userAddress, campaignId);
//    res.status(201).send(out);
//  } catch (err) {
//    next(err);
//  }
// };
