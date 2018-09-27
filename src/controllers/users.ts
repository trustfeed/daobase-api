import { controller, httpGet, httpPost, httpPut, queryParam, next, request, requestBody, response } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import * as express from 'express';
import { TypedError } from '../utils';
import { UserService } from '../services/user';
import TYPES from '../constant/types';
import authMiddleware from '../middleware/auth';
import * as view from '../views/user';

@controller('/users')
export class UsersController {
  constructor(@inject(TYPES.UserService) private userService: UserService) {}

  @httpGet('/')
  public async get(
    @request() req: any,
    @requestBody() body: any,
    @response() res: express.Response,
    @next() next: express.NextFunction) {
    authMiddleware(req, res, async () => {
      try {
        if (!req.decoded || !req.decoded.publicAddress) {
          throw new TypedError(500, 'publicAddress required in access token');
        }

        const user = await this.userService.findByPublicAddress(req.decoded.publicAddress);
        if (!user) {
          throw new TypedError(404, 'publicAddress not found');
        }
        return view.self(user);
      } catch (err) {
        next(err);
      }
    });
  }

  @httpPost('/')
  public async post(
    @requestBody() body: any,
    @response() res: express.Response,
    @next() next: express.NextFunction
  ) {
    try {
      const { publicAddress } = body;
      if (!publicAddress) {
        throw new TypedError(400, 'publicAddress required');
      }

      let user = await this.userService.findByPublicAddress(publicAddress);
      if (user) {
        throw new TypedError(409, 'publicAddress already registered');
      }
      user = await this.userService.newUser(publicAddress);
      // TODO: reimplement this
      // InvestmentListener.addUserAddresses([publicAddress]);
      res.status(201).json({
        nonce: user.nonce
      });
    } catch (err) {
      next(err);
    }
  }

  @httpPut('/')
  public async put(
    @request() req: any,
    @requestBody() body: any,
    @response() res: express.Response,
    @next() next: express.NextFunction
  ) {
    authMiddleware(req, res, async () => {
      try {
        if (!req.decoded.id) {
          throw new TypedError(400, 'missing user id');
        }

        const user = await this.userService.findById(req.decoded.id);
        if (!user) {
          throw new TypedError(404, 'user not in database');
        }
        if (req.body.name && req.body.name !== user.name) {
          user.name = req.body.name;
        }
        if (body.email) {
          await user.addEmail(req.body.email);
        }
        await this.userService.updateUser(user);
        res.status(201).send({
          message: 'updated'
        });
      } catch (err) {
        next(err);
      }
    });
  }
}
