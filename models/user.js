import mongoose from 'mongoose';
import Campaign from './campaign';
import * as te from '../typedError';
import HashToEmail from './hashToEmail';

const Schema = mongoose.Schema;

const Email = new Schema({
  address: {
    type: String,
    required: true,
  },
  verifiedAt: {
    type: Date,
  },
  name: {
    type: String,
  },
});

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
  currentEmail: Email,
  previousEmails: {
    type: [Email],
    default: [],
    required: true,
  },
  name: {
    type: String,
  },
});

User.statics.findOneByPublicAddress = function (publicAddress) {
  return this.findOne({
    publicAddress,
  }).exec();
};

User.statics.create = function (publicAddress) {
  const nonce = Math.floor(Math.random() * 10000).toString();
  const user = this({
    _id: new mongoose.Types.ObjectId(),
    publicAddress,
    nonce,
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

User.methods.addEmail = function (email) {
  if (this.currentEmail) {
    this.previousEmails.push(this.currentEmail);
  }
  this.currentEmail = { address: email };
  return this.save().then(HashToEmail.create(this._id, email));
};

module.exports = mongoose.model('User', User);
