import { controller, httpGet } from 'inversify-express-utils';

@controller('/healthz')
export class HealthzController {
  @httpGet('/')
  public get(): string {
    return 'ok';
  }
}
