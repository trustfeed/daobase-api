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
import * as hc from '../models/hostedCampaign';
import * as campaignView from '../views/campaign';
import { verify, fail } from '../models/kycApplication';
import { User, verifyKYC, failKYC } from '../models/user';
import * as kycView from '../views/kycApplication';
import { WalletWatcher } from '../events/walletWatcher';
import { Web3Service } from '../services/web3';

// TODO: trustfeed address middleware
@controller('/trustfeed', authMiddleware)
export class TrustfeedController {
  constructor(@inject(TYPES.HostedCampaignService) private hostedCampaignService: HostedCampaignService,
              @inject(TYPES.KYCApplicationService) private kycService: KYCApplicationService,
              @inject(TYPES.UserService) private userService: UserService,
              @inject(TYPES.MailService) private mailService: MailService,
              @inject(TYPES.WalletWatcher) private walletWatcher: WalletWatcher,
              @inject(TYPES.Web3Service) private web3Service: Web3Service
             ) {
  }

  // TODO: can this be middleware
  private async checkAccount(req) {
    const publicAddress = req.decoded.publicAddress.toLowerCase();
    if (!this.walletWatcher.trustFeedAddresses.has(publicAddress)) {
	    throw new TypedError(403, 'not a trustfeed account');
    }
  }

  @httpGet('/kycs-pending-review')
  async kycsToReview(
    @request() req,
    @queryParam('offset') offset
  ) {
    await this.checkAccount(req);
    const out = await this.kycService.toReview(offset);
    out.kycs = out.kycs.map(kycView.kycApplication);
    return out;
  }

  @httpPost('/kyc-review')
  async kycReviewed(
    @request() req,
    @requestBody() body,
    @response() res
  ) {
    if (body.isValid) {
      await this.checkAccount(req);
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
    } else {
      await this.checkAccount(req);
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
  }

  @httpGet('/campaigns-pending-review')
  async campaignsToReview(
    @request() req,
    @queryParam('offset') offset
  ) {
    await this.checkAccount(req);
    const out = await this.hostedCampaignService.toReview(offset);
    out.campaigns = out.campaigns.map(campaignView.hostedAdminFull);
    return out;
  }

  @httpPost('/campaign-review')
  async campaignReviewed(
    @request() req,
    @requestBody() body,
    @response() res
  ) {
    if (body.isValid) {
      await this.checkAccount(req);
      let campaign = await this.hostedCampaignService.findById(body.campaignID);
      if (!campaign) {
        throw new TypedError(404, 'campaign not found');
      }

      let user = await this.userService.findById(campaign.ownerId);
      if (!user) {
	  throw new TypedError(404, 'unknown user');
      }

      campaign = hc.reviewAccepted(campaign);
      await this.hostedCampaignService.update(campaign);
      this.mailService.sendCampaignReviewSuccess(user.currentEmail.address, user.name);
      res.status(201).send({ 'message': 'verified' });
    } else {
      await this.checkAccount(req);
      let campaign = await this.hostedCampaignService.findById(body.campaignID);
      if (!campaign) {
        throw new TypedError(404, 'campaign not found');
      }

      let user = await this.userService.findById(campaign.ownerId);
      if (!user) {
	  throw new TypedError(404, 'unknown user');
      }

      campaign = hc.reviewFailed(campaign, body.note);
      await this.hostedCampaignService.update(campaign);
      this.mailService.sendCampaignReviewFailure(user.currentEmail.address, user.name, body.note);
      res.status(201).send({ 'message': 'failed' });
    }
  }

  @httpGet('/campaigns-pending-finalisation')
  async campaignsToFinalise(
    @request() req,
    @queryParam('offset') offset
  ) {
    await this.checkAccount(req);
    const out = await this.hostedCampaignService.toFinalise(offset);
    out.campaigns = out.campaigns.map(campaignView.hostedAdminFull);
    return out;
  }

  @httpPost('/finalise-campaign')
  async finaliseCampaign(
    @request() req,
    @requestBody() body,
    @response() res
  ) {
    await this.checkAccount(req);
    let campaign = await this.hostedCampaignService.findById(body.campaignID);
    if (!campaign) {
      throw new TypedError(404, 'campaign not found');
    }

    let [campaignDash, byteCode] = hc.confirmFinalise(
      campaign,
      this.web3Service,
      this.walletWatcher.contract
    );
    await this.hostedCampaignService.update(campaignDash);
    res.status(201).send({ transaction: byteCode });
  }
}
