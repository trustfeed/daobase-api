import { controller, httpGet, httpPost, httpPut, queryParam, next, request, requestBody, response } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import * as express from 'express';
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

  @httpPost('/passport-image')
  async passportImage(
    @request() req,
    @response() res,
    @next() next
  ) {
    try {
      if (req.decoded.id == null) {
        throw new TypedError(400, 'missing user id');
      }
      const user = await this.userService.findById(req.decoded.id);
      if (!isEmailVerified(user)) {
        throw new TypedError(403, 'email must be verified');
      }

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
    } catch (err) {
      next(err);
    }
  }

  @httpPost('/facial-image')
  async facialImage(
    @request() req,
    @response() res,
    @next() next
  ) {
    try {
      if (req.decoded.id == null) {
        throw new TypedError(400, 'missing user id');
      }
      const user = await this.userService.findById(req.decoded.id);
      if (!isEmailVerified(user)) {
        throw new TypedError(403, 'email must be verified');
      }

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
    } catch (err) {
      next(err);
    }
  }

  @httpPost('/')
  async post(
    @request() req,
    @response() res,
    @next() next
  ) {
    try {
      if (!req.decoded.id) {
        throw new TypedError(400, 'missing user id');
      }
      const user = await this.userService.findById(req.decoded.id);
      if (!isEmailVerified(user)) {
        throw new TypedError(403, 'email must be verified');
      }

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
          // await app.verify(this.userService);
	  // await this.userService.update(user);
        }, 10 * 1000);
      }
    } catch (err) {
      next(err);
    }
  }
}
