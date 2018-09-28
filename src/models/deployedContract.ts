import { injectable } from 'inversify';

@injectable()
export class DeployedContract {
  constructor(public address: string, public abi: string) {}
}
