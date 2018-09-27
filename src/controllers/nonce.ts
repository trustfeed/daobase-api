import { controller, httpGet, queryParam,next } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import * as express from 'express';
import { TypedError } from '../utils';
import { UserService } from '../services/user';
import TYPES from '../constant/types';

@controller('/nonce')
export class NonceController {
  constructor(@inject(TYPES.UserService) private userServices: UserService) {}

  @httpGet('/')
  public async get(
    @queryParam('publicAddress') publicAddress: string,
    @next() next: express.NextFunction) {
    try {
      if (!publicAddress) {
        throw new TypedError(400, 'publicAddress required');
      }
      const user = await this.userServices.findByPublicAddress(publicAddress);
      if (!user) {
        throw new TypedError(404, 'unknown address');
      } else {
        return { nonce: user.nonce };
      }
    } catch (err) {
      next(err);
    }
  }
}
