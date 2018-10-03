import { controller, httpPost, request, response } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { TypedError } from '../utils';
import { UserService } from '../services/user';
import { isEmailVerified } from '../models/user';
import TYPES from '../constant/types';
import { authMiddleware } from '../middleware/auth';
import { S3Service } from '../services/s3';
import { KYCApplication, KYC_STATUS_PENDING, KYC_STATUS_VERIFIED } from '../models/kycApplication';
import { KYCApplicationService } from '../services/kycApplication';
import config from '../config';

@controller('/kyc', authMiddleware)
export class KYCController {
  constructor(@inject(TYPES.UserService) private userService: UserService,
              @inject(TYPES.KYCApplicationService) private kycApplicationService: KYCApplicationService,
              @inject(TYPES.S3Service) private s3Service: S3Service
  ) {}

  private async checkUserHasEmail(
    userId: string
  ) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new TypedError(404, 'user not found');
    }
    if (!isEmailVerified(user)) {
      throw new TypedError(403, 'email must be verified');
    }
    return user;
  }

  @httpPost('/passport-image')
  async passportImage(
    @request() req,
    @response() res
  ) {
    this.checkUserHasEmail(req.decoded.id);

    const extension = req.body.extension || 'png';
    const contentType = req.body.contentType || 'image/png';

    const url = await this.s3Service.signUpload(
        req.decoded.id,
        'kyc/passport-images',
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

  @httpPost('/facial-image')
  async facialImage(
    @request() req,
    @response() res
  ) {
    this.checkUserHasEmail(req.decoded.id);

    const extension = req.body.extension || 'png';
    const contentType = req.body.contentType || 'image/png';

    const url = await this.s3Service.signUpload(
        req.decoded.id,
        'kyc/facial-images',
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

  @httpPost('/')
  async post(
    @request() req,
    @response() res
  ) {
    const user = await this.checkUserHasEmail(req.decoded.id);

    if (!req.body.passportImageURL || !req.body.facialImageURL) {
      throw new TypedError(400, 'missing image URL');
    }

    let app = new KYCApplication(
        req.decoded.id,
        req.body.passportImageURL,
        req.body.facialImageURL
    );
    app = await this.kycApplicationService.insert(app);
    user.kycStatus = KYC_STATUS_PENDING;
    await this.userService.update(user);
    res.status(201).send({
      message: 'received'
    });

    if (config.dev) {
      setTimeout(async () => {
        app.status = KYC_STATUS_VERIFIED;
        user.kycStatus = KYC_STATUS_VERIFIED;
        await this.kycApplicationService.update(app);
        await this.userService.update(user);
      }, 10 * 1000);
    }
  }
}
