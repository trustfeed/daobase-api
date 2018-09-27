import { injectable } from 'inversify';

interface IEmail {
  address: string;
  verifiedAt?: Date;
}

@injectable()
export class Email implements IEmail {
  constructor(
    public address: string,
    public verifiedAt?: Date
    ) { }
}
