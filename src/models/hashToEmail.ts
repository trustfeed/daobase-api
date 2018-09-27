import { injectable } from 'inversify';
import config from '../config';
import { User } from './user';
import { Email } from './email';
import { sha256 } from 'js-sha256';
import { TypedError } from '../utils';

// const HashToEmail = new Schema({
//  hash: {
//    type: String,
//    required: true,
//    unique: true,
//    index: true
//  },
//  createdAt: {
//    type: Date,
//    required: true,
//    default: Date.now
//  },
//  user: {
//    type: Schema.Types.ObjectId,
//    ref: 'User',
//    required: true
//  },
//  address: {
//    type: Schema.Types.ObjectId,
//    required: true
//  }
// });

@injectable()
export class HashToEmail {
  public hash: string;
  public user: string;
  public email: string;
  public createdAt: Date;
  public _id?: string;

  constructor(
    user: User,
    email: string
  ) {
    this.user = user._id.toString();
    this.email = email;

    const hash = sha256.create();
    hash.update(user.toString() + email + Math.random());
    this.hash = hash.hex();

    this.createdAt = new Date();
  }
}

export const verifyEmail = async (hashToEmail: HashToEmail, userService): Promise<boolean> => {
  let user = await userService.findById(hashToEmail.user);
  if (user == null) {
    throw new TypedError(500, 'internal error');
  } else if (user.currentEmail == null || user.currentEmail.address !== hashToEmail.email) {
    throw new TypedError(
          400,
          'a different email has been registred for that account',
          'EXPIRED_TOKEN'
        );
  } else if (user.currentEmail.verifiedAt) {
    throw new TypedError(400, 'the address is already verified', 'VERIFIED_TOKEN');
  } else {
    user.currentEmail.verifiedAt = Date.now();
    user.updatedAt = Date.now();
    await userService.update(user);
    return true;
  }
};
