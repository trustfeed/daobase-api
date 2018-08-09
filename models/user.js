import mongoose from 'mongoose';
import Campaign from './campaign';

const Schema = mongoose.Schema;

const User = new Schema({
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
  campaigns: {
    type: [Campaign],
    default: [],
  },
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
    publicAddress,
    nonce,
    campaigns,
  });

  return user.save();
};

module.exports = mongoose.model('User', User);
