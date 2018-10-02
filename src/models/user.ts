import { injectable } from 'inversify';
import { Email } from './email';
import config from '../config';
import { TypedError } from '../utils';
import ethUtil from 'ethereumjs-util';
import jwt from 'jsonwebtoken';
import { HashToEmail } from './hashToEmail';
import * as kyc from './kycApplication';

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

export const updateEmail = async (user: User, email: string, hashToEmailService, mailer): Promise<User> => {
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

export const isKYCVerified = (user: User): boolean => {
  return user.kycStatus === kyc.KYC_STATUS_VERIFIED;
};

export const verifyKYC = (user: User): User => {
  user.kycStatus = kyc.KYC_STATUS_VERIFIED;
  user.updatedAt = new Date();
  return user;
};

export const failKYC = (user: User): User => {
  user.kycStatus = undefined;
  user.updatedAt = new Date();
  return user;
};
