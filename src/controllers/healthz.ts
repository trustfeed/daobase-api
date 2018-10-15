import { controller, httpGet } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import TYPES from '../constant/types';
import { Web3Service } from '../services/web3';

@controller('/healthz')
export class HealthzController {
  constructor(
  @inject(TYPES.Web3Service) private web3Service: Web3Service
  ) {}

  @httpGet('/')
  public get(): string {
    return 'ok';
  }

  @httpGet('/block-number')
  public async blockNumber() {
    const bn = await this.web3Service.getBlockNumber();
    return bn.toString();
  }
}
