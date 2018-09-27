import { injectable } from 'inversify';
import Email from './email';
import config from '../config';

export enum KYCStatus {
  Pending = 0,
  Verified = 1,
  Failed = 2
}

interface IUser {
  publicAddress: string;
  nonce: string;
  _id?: string;
  currentEmail?: Email;
  previousEmails?: Email[];
  name?: string;
  kycStatus?: KYCStatus;
}

@injectable()
export class User implements IUser {
  public publicAddress: string;
  public nonce: string;
  public updatedAt: Date;
  public previousEmails: Email[];
  public _id?: string;
  public currentEmail?: Email;
  public name?: string;
  public kycStatus?: KYCStatus;

  constructor(
    publicAddress: string
  ) {
    this.publicAddress = publicAddress;
    this.nonce = Math.floor(Math.random() * 10000).toString();
    this.previousEmails = [];
    this.updatedAt = new Date();
  }

//  addEmail(email: string) {
//    if (this.currentEmail && this.currentEmail.address !== email) {
//      this.previousEmails.push(this.currentEmail);
//    }
//
//    if (!this.currentEmail || this.currentEmail.address !== email) {
//      this.currentEmail = new Email(email);
//      this.updatedAt = new Date();
//    }
//
//    if (config.dev) {
//      this.currentEmail.verifiedAt = new Date();
//    } else {
//      // TODO: send the email verification
////        .then(HashToEmail.create(this._id, this.currentEmail))
////        .then(() => {
////          return this;
////        });
//    }
//  }
}

// User.statics.addHostedCampaign = function(publicAddress, onChainData) {
//  return this.findOne({
//    publicAddress
//  })
//    .exec()
//    .then(user => {
//      if (!user) {
//        throw new utils.TypedError(404, 'unknown publicAddress');
//      } else {
//        return Campaign.createHostedDomain(user._id, onChainData);
//      }
//    });
// };
//
// User.statics.addExternalCampaign = async function(publicAddress, data) {
//  const user = await this.findOne({
//    publicAddress
//  }).exec();
//  if (!user) {
//    throw new utils.TypedError(404, 'unknown publicAddress');
//  } else {
//    return Campaign.createExternalCampaign(user._id, data);
//  }
// };
//
// User.statics.verifyEmail = function(userId, emailId) {
//  return this.findOne({
//    _id: userId
//  })
//    .exec()
//    .then(user => {
//      if (!user) {
//        throw new utils.TypedError(500, 'internal error');
//      } else if (!user.currentEmail || !user.currentEmail._id.equals(emailId)) {
//        throw new utils.TypedError(
//          400,
//          'a different email has been registred for that account',
//          'EXPIRED_TOKEN'
//        );
//      } else if (user.currentEmail.verifiedAt) {
//        throw new utils.TypedError(400, 'the address is already verified', 'VERIFIED_TOKEN');
//      } else {
//        user.currentEmail.verifiedAt = Date.now();
//        user.updatedAt = Date.now();
//        return user.save();
//      }
//    });
// };
//
// const UserModel: any = mongoose.model('User', User);
// export default UserModel;
