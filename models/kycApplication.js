import mongoose from 'mongoose';
import User from './user';
import * as te from '../typedError';

const Schema = mongoose.Schema;

const KYCApplication = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
  },
  passportImageURL: {
    type: String,
    required: true,
  },
  facialImageURL: {
    type: String,
    required: true,
  },
});

KYCApplication.statics.create = async function (user, passportImageURL, facialImageURL) {
  const app = this({
    user,
    passportImageURL,
    facialImageURL,
  });

  let u = await User.findOneById(user);
  if (!u) {
    throw new te.TypedError(404, 'user not found');
  }
  u.kycStatus = 'PENDING';
  await u.save();

  return app.save();
};

KYCApplication.methods.verify = async function () {
  let user = await User.findOneById(this.user);
  if (!user) {
    throw new te.TypedError(404, 'user not found');
  }
  user.kycStatus = 'VERIFIED';
  return user.save();
};

module.exports = mongoose.model('KYCApplication', KYCApplication);
