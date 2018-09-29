import { controller, httpPost, request, response } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { TypedError } from '../utils';
import { UserService } from '../services/user';
import { isEmailVerified } from '../models/user';
import TYPES from '../constant/types';
import { authMiddleware } from '../middleware/auth';
import { signUpload } from '../models/s3';
import { KYCApplication } from '../models/kycApplication';
import { KYCApplicationService } from '../services/kycApplication';
import config from '../config';

@controller('/kyc', authMiddleware)
export class KYCController {
  constructor(@inject(TYPES.UserService) private userService: UserService,
              @inject(TYPES.KYCApplicationService) private kycApplicationService: KYCApplicationService) {}

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

    const url = await signUpload(
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

    const url = await signUpload(
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
    user.kycStatus = 'PENDING';
    await this.userService.update(user);
    res.status(201).send({
      message: 'received'
    });

    if (config.dev) {
      setTimeout(async () => {
        app.status = 'VERIFIED';
        user.kycStatus = 'VERIFIED';
        await this.kycApplicationService.update(app._id, app);
        await this.userService.update(user);
      }, 10 * 1000);
    }
  }
}
