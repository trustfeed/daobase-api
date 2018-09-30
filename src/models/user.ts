import { injectable } from 'inversify';
import { Email } from './email';
import config from '../config';
import { TypedError } from '../utils';
import ethUtil from 'ethereumjs-util';
import jwt from 'jsonwebtoken';
import { HashToEmail } from './hashToEmail';
import * as mailer from './mailer';
import { CampaignService } from '../services/campaign';

export class User {
  public publicAddress: string;
  public nonce: string;
  public updatedAt: Date;
  public previousEmails: Email[];
  public _id?: string;
  public currentEmail?: Email;
  public name?: string;
  public kycStatus?: string;

  constructor(
    publicAddress: string
  ) {
    this.publicAddress = publicAddress;
    this.nonce = Math.floor(Math.random() * 10000).toString();
    this.previousEmails = [];
    this.updatedAt = new Date();
  }
}

export const updateEmail = async (user: User, email: string, hashToEmailService): Promise<User> => {
  if (user.currentEmail && user.currentEmail.address !== email) {
    user.previousEmails.push(user.currentEmail);
  }

  if (user.currentEmail == null || user.currentEmail.address !== email) {
    user.currentEmail = new Email(email);
    user.updatedAt = new Date();
  }
  if (config.dev) {
    user.currentEmail.verifiedAt = new Date();
  } else {
    const h2e = new HashToEmail(user, email);
    await hashToEmailService.insert(h2e);
    await mailer.sendEmailVerification(
      user.currentEmail.address,
      user.name,
      `${config.frontendHost}/email-verification?token=${h2e.hash}`
    );
  }
  return user;
};

export const checkSignature = (user: User, signature: string): string => {
  const signedAddress = sign(user, signature);
  if (signedAddress.toLowerCase() !== user.publicAddress.toLowerCase()) {
    throw new TypedError(401, 'signature verification failed');
  }
  user.nonce = Math.floor(Math.random() * 10000).toString();
  return generateToken(user);
};

const sign = (user: User, signature: string): string => {
  try {
    const msg = `I am signing my one-time nonce: ${user.nonce}`;
    const msgBuffer = ethUtil.toBuffer(msg);
    const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
    const signatureBuffer = ethUtil.toBuffer(signature);
    const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
    const publicKey = ethUtil.ecrecover(
      msgHash,
      signatureParams.v,
      signatureParams.r,
      signatureParams.s
    );
    const addressBuffer = ethUtil.publicToAddress(publicKey);
    return ethUtil.bufferToHex(addressBuffer);
  } catch (err) {
    throw new TypedError(401, 'signature verification failed: ' + err.message);
  }
};

const generateToken = (user: User): string => {
  const data = { id : user._id, publicAddress: user.publicAddress };
  return jwt.sign(data, config.secret, { expiresIn: '1d' });
};

export const isEmailVerified = (user: User): boolean => {
  return user.currentEmail != null && user.currentEmail.verifiedAt != null;
};

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
