import { injectable } from 'inversify';
import { Note } from './note';

export class KYCApplication {
  public createdAt: Date;
  public notes: string[];
  public status: string;
  public _id?: string;

  constructor(
    public userId: string,
    public passportImageURL: string,
    public facialImageURL: string
  ) {
    this.createdAt = new Date();
    this.status = 'PENDING';
    this.notes = [];
  }
}

// import mongoose from 'mongoose';
// import User from './user';
// import * as utils from '../utils';
// import { Base64 } from 'js-base64';
// import Note from './note';
//
// const Schema = mongoose.Schema;
//
// const KYCApplication = new Schema({
//  user: {
//    type: Schema.Types.ObjectId,
//    ref: 'User',
//    index: true,
//    required: true
//  },
//  passportImageURL: {
//    type: String,
//    required: true
//  },
//  facialImageURL: {
//    type: String,
//    required: true
//  },
//  status: {
//    type: String,
//    enum: ['PENDING', 'VERIFIED', 'FAILED'],
//    default: 'PENDING'
//  },
//  createdAt: {
//    type: Date,
//    required: true,
//    default: Date.now()
//  },
//  notes: {
//    type: [Note],
//    required: true,
//    default: []
//  }
// });
//
// KYCApplication.statics.create = async function(user, passportImageURL, facialImageURL) {
//  const app = this({
//    user,
//    passportImageURL,
//    facialImageURL
//  });
//
//  let u = await User.findOneById(user);
//  if (!u) {
//    throw new utils.TypedError(404, 'user not found');
//  }
//  u.kycStatus = 'PENDING';
//  await u.save();
//
//  return app.save();
// };
//
// KYCApplication.statics.pendingVerification = async function(offset) {
//  const pageSize = 20;
//  let q = {
//    status: 'PENDING',
//    updatedAt: undefined
//  };
//  if (offset) {
//    q.updatedAt = {
//      $lt: new Date(Number(Base64.decode(offset)))
//    };
//  }
//  let kycs = await this.find(q)
//    .sort({
//      createdAt: 1
//    })
//    .limit(pageSize)
//    .exec();
//
//  let nextOffset;
//  if (kycs.length === pageSize) {
//    nextOffset = Base64.encode(kycs[kycs.length - 1].updatedAt.getTime());
//  }
//  return {
//    kycs: kycs,
//    next: nextOffset
//  };
// };
//
// KYCApplication.methods.verify = async function() {
//  let user = await User.findOneById(this.user);
//  if (!user) {
//    throw new utils.TypedError(404, 'user not found');
//  }
//  user.kycStatus = 'VERIFIED';
//  this.status = 'VERIFIED';
//  await this.save();
//  return user.save();
// };
//
// KYCApplication.methods.fail = async function(noteText) {
//  let user = await User.findOneById(this.user);
//  if (!user) {
//    throw new utils.TypedError(404, 'user not found');
//  }
//  user.kycStatus = 'FAILED';
//  this.status = 'FAILED';
//  if (!this.notes) {
//    this.notes = [];
//  }
//  this.notes.push({
//    content: noteText
//  });
//  await this.save();
//  return user.save();
// };
//
// const KYCApplicationModel: any = mongoose.model('KYCApplication', KYCApplication);
// export default KYCApplicationModel;
