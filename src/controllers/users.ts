import { controller, httpGet, httpPost, httpPut, request, requestBody, response } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import * as express from 'express';
import { TypedError } from '../utils';
import { UserService } from '../services/user';
import { HashToEmailService } from '../services/hashToEmail';
import { updateEmail } from '../models/user';
import TYPES from '../constant/types';
import { authMiddleware } from '../middleware/auth';
import * as view from '../views/user';
import { InvestmentWatcher } from '../events/investmentWatcher';

@controller('/users')
export class UsersController {
  constructor(@inject(TYPES.UserService) private userService: UserService,
              @inject(TYPES.HashToEmailService) private hashToEmailService: HashToEmailService,
              @inject(TYPES.InvestmentWatcher) private investmentWatcher: InvestmentWatcher) {}

  @httpGet('/', authMiddleware)
  public async get(
    @request() req: any,
    @requestBody() body: any
) {
    if (!req.decoded || !req.decoded.publicAddress) {
      throw new TypedError(500, 'publicAddress required in access token');
    }

    const user = await this.userService.findByPublicAddress(req.decoded.publicAddress);
    if (!user) {
      throw new TypedError(404, 'publicAddress not found');
    }
    return view.self(user);
  }

  @httpPost('/')
  public async post(
    @requestBody() body: any,
    @response() res: express.Response
  ) {
    const { publicAddress } = body;
    if (!publicAddress) {
      throw new TypedError(400, 'publicAddress required');
    }

    let user = await this.userService.findByPublicAddress(publicAddress);
    if (user) {
      throw new TypedError(409, 'publicAddress already registered');
    }
    user = await this.userService.create(publicAddress);
    this.investmentWatcher.addCampaign(user);
    res.status(201).json({
      nonce: user.nonce
    });
  }

  @httpPut('/', authMiddleware)
  public async put(
    @request() req: any,
    @requestBody() body: any
  ) {
    if (!req.decoded.id) {
      throw new TypedError(400, 'missing user id');
    }

    const user = await this.userService.findById(req.decoded.id);
    if (!user) {
      throw new TypedError(404, 'user not in database');
    }
    if (body.name && body.name !== user.name) {
      user.name = body.name;
    }
    if (body.email) {
      await updateEmail(user, body.email, this.hashToEmailService);
    }
    await this.userService.update(user);
    return {
      message: 'updated'
    };
  }
}
