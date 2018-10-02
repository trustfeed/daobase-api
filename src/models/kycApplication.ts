import { injectable } from 'inversify';
import { Note } from './note';
import { TypedError } from '../utils';

export const KYC_STATUS_PENDING = 'PENDING';
export const KYC_STATUS_VERIFIED = 'VERIFIED';
export const KYC_STATUS_FAILED = 'FAILED';

export class KYCApplication {
  public createdAt: Date;
  public notes: Note[];
  public status: string;
  public _id?: string;

  constructor(
    public userId: string,
    public passportImageURL: string,
    public facialImageURL: string
  ) {
    this.createdAt = new Date();
    this.status = KYC_STATUS_PENDING;
    this.notes = [];
  }
}

export const isVerified = (app: KYCApplication): boolean => {
  return app.status === KYC_STATUS_VERIFIED;
};

export const verify = (app: KYCApplication) => {
  if (app.status !== KYC_STATUS_PENDING) {
    throw new TypedError(400, 'application not in pending status');
  }
  app.status = KYC_STATUS_VERIFIED;
  return app;
};

export const fail = (app: KYCApplication, note: string) => {
  if (app.status !== KYC_STATUS_PENDING) {
    throw new TypedError(400, 'application not in pending status');
  }
  app.status = KYC_STATUS_FAILED;
  app.notes.push(new Note(note));
  return app;
};
