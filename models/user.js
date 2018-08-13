import mongoose from 'mongoose';
import Campaign from './campaign';
import * as te from '../typedError';

const Schema = mongoose.Schema;

const User = new Schema({
  _id: Schema.Types.ObjectId,
  publicAddress: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
  nonce: {
    type: String,
    required: true,
  },
  campaigns: [{
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
  }],
});

User.statics.findOneByPublicAddress = function (publicAddress) {
  return this.findOne({
    publicAddress,
  }).exec();
};

User.statics.create = function (publicAddress) {
  const campaigns = [];
  const nonce = Math.floor(Math.random() * 10000).toString();
  const user = this({
    _id: new mongoose.Types.ObjectId(),
    publicAddress,
    nonce,
    campaigns,
  });

  return user.save();
};

User.statics.addCampaign = function (publicAddress) {
  return this.findOne({
    publicAddress,
  }).exec()
    .then(user => {
      if (!user) {
        throw new te.TypedError(404, 'unknown publicAddress');
      } else {
        return Campaign.create(user._id);
      }
    });
};

module.exports = mongoose.model('User', User);
