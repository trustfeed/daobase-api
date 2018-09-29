import { controller, httpPost, requestBody, response } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import * as express from 'express';
import { TypedError } from '../utils';
import { UserService } from '../services/user';
import { checkSignature } from '../models/user';
import TYPES from '../constant/types';

@controller('/auth')
export class AuthController {
  constructor(@inject(TYPES.UserService) private userService: UserService) {}

  @httpPost('/')
  public async post(
    @requestBody() body: any,
    @response() res: express.Response
  ) {
    const { signature, publicAddress } = body;
    if (!signature || !publicAddress) {
      throw new TypedError(400, 'Request should have signature and publicAddress');
    }

    let user = await this.userService.findByPublicAddress(publicAddress);
    if (!user) {
      throw new TypedError(404, 'public address not found');
    }
    const accessToken = checkSignature(user, signature);
    await this.userService.update(user);
    res.status(201).send({
      accessToken
    });
  }

}
