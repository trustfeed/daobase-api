import { controller, httpGet, httpPost, httpPut, queryParam, request, requestBody, response } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { TypedError } from '../utils';
import { MailService } from '../services/mail';
import { UserService } from '../services/user';
import { HostedCampaignService } from '../services/hostedCampaign';
import { CoinPaymentsService } from '../services/coinPayments';
import { KYCApplicationService } from '../services/kycApplication';
import TYPES from '../constant/types';
import { authMiddleware } from '../middleware/auth';
import { trustfeedAddress } from '../middleware/trustfeedAddress';
import { HostedCampaign, reviewAccepted, reviewFailed } from '../models/hostedCampaign';
import * as campaignView from '../views/campaign';
import { verify, fail } from '../models/kycApplication';
import { User, verifyKYC, failKYC } from '../models/user';
import * as kycView from '../views/kycApplication';

// TODO: trustfeed address middleware
@controller('/trustfeed', authMiddleware, trustfeedAddress)
export class TrustfeedController {
  constructor(@inject(TYPES.HostedCampaignService) private hostedCampaignService: HostedCampaignService,
              @inject(TYPES.KYCApplicationService) private kycService: KYCApplicationService,
              @inject(TYPES.UserService) private userService: UserService,
              @inject(TYPES.MailService) private mailService: MailService
             ) {
  }

  @httpGet('/kycs-to-review')
  async kycsToReview(
    @queryParam('offset') offset
  ) {
    const out = await this.kycService.toReview(offset);
    out.kycs = out.kycs.map(kycView.kycApplication);
    return out;
  }

  @httpPost('/kyc-reviewed')
  async kycReviewed(
    @requestBody() body,
    @response() res
  ) {
    let kyc = await this.kycService.findById(body.kycID);
    if (!kyc) {
      throw new TypedError(404, 'kyc not found');
    }
    let user = await this.userService.findById(kyc.userId);
    if (!user) {
	  throw new TypedError(404, 'unknown user');
    }
    user = verifyKYC(user);
    await this.userService.update(user);

    kyc = verify(kyc);
    await this.kycService.update(kyc);
    this.mailService.sendKYCSuccess(user.currentEmail.address, user.name);
    res.status(201).send({ message: 'verified' });
  }

  @httpPost('/kyc-failed')
  async kycFailed(
    @requestBody() body,
    @response() res
  ) {
    let kyc = await this.kycService.findById(body.kycID);
    if (!kyc) {
      throw new TypedError(404, 'kyc not found');
    }

    let user = await this.userService.findById(kyc.userId);
    if (!user) {
	  throw new TypedError(404, 'unknown user');
    }
    user = failKYC(user);
    await this.userService.update(user);

    kyc = fail(kyc, body.note);
    await this.kycService.update(kyc);
    this.mailService.sendKYCFailure(user.currentEmail.address, user.name, body.note);
    res.status(201).send({ message: 'failed' });
  }

  @httpGet('/campaigns-to-review')
  async campaignsToReview(
    @queryParam('offset') offset
  ) {
    const out = await this.hostedCampaignService.toReview(offset);
    out.campaigns = out.campaigns.map(campaignView.hostedAdminFull);
    return out;
  }

  @httpPost('/campaign-reviewed')
  async campaignReviewed(
    @requestBody() body,
    @response() res
  ) {
    let campaign = await this.hostedCampaignService.findById(body.campaignID);
    if (!campaign) {
      throw new TypedError(404, 'campaign not found');
    }

    let user = await this.userService.findById(campaign.ownerId);
    if (!user) {
	  throw new TypedError(404, 'unknown user');
    }

    campaign = reviewAccepted(campaign);
    await this.hostedCampaignService.update(campaign);
    this.mailService.sendCampaignReviewSuccess(user.currentEmail.address, user.name);
    res.status(201).send({ 'message': 'verified' });
  }

  @httpPost('/campaign-failed')
  async campaignFailed(
    @requestBody() body,
    @response() res
  ) {
    let campaign = await this.hostedCampaignService.findById(body.campaignID);
    if (!campaign) {
      throw new TypedError(404, 'campaign not found');
    }

    let user = await this.userService.findById(campaign.ownerId);
    if (!user) {
	  throw new TypedError(404, 'unknown user');
    }

    campaign = reviewFailed(campaign, body.note);
    await this.hostedCampaignService.update(campaign);
    this.mailService.sendCampaignReviewFailure(user.currentEmail.address, user.name, body.note);
    res.status(201).send({ 'message': 'failed' });
  }
}