import { controller, httpGet, httpPost, httpPut, queryParam, next, request, requestBody, response } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import * as express from 'express';
import { TypedError } from '../utils';
import { UserService } from '../services/user';
import { HashToEmailService } from '../services/hashToEmail';
import { checkSignature } from '../models/user';
import { verifyEmail } from '../models/hashToEmail';
import TYPES from '../constant/types';

const daysBetween = (start, end) => {
  const milli = Math.abs(start.getTime() - end.getTime());
  return milli / (1000 * 60 * 60 * 24);
};

@controller('/verify')
export class VerifyController {
  constructor(@inject(TYPES.UserService) private userService: UserService,
	      @inject(TYPES.HashToEmailService) private hashToEmailService: HashToEmailService) {}

  @httpPost('/email')
  public async post(
    @requestBody() body: any,
    @response() res: express.Response,
    @next() next: express.NextFunction
  ) {
    try {
      const { token } = body;
      if (token == null) {
        throw new TypedError(400, 'missing token', 'INVALID_TOKEN');
      }

      const hashToEmail = await this.hashToEmailService.findByHash(token);

      if (hashToEmail == null) {
        throw new TypedError(404, 'no such token', 'INVALID_TOKEN');
      } else if (daysBetween(hashToEmail.createdAt, new Date()) > 1) {
        throw new TypedError(410, 'token expired', 'EXPIRED_TOKEN');
      }
      await verifyEmail(hashToEmail, this.userService);

      res.status(201).send({
        message: 'verified',
        type: 'SUCCESS'
      });
    } catch (err) {
      next(err);
    }
  }

}
