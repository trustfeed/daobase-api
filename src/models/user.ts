import mongoose from 'mongoose';
import Campaign from './campaign';
import * as utils from '../utils';
import HashToEmail from './hashToEmail';
import config from '../config';

const Schema = mongoose.Schema;

const Email = new Schema({
  address: {
    type: String,
    required: true
  },
  verifiedAt: {
    type: Date
  },
  name: {
    type: String
  }
});

const User = new Schema({
  publicAddress: {
    type: String,
    index: true,
    unique: true,
    required: true
  },
  nonce: {
    type: String,
    required: true
  },
  currentEmail: Email,
  previousEmails: {
    type: [Email],
    default: [],
    required: true
  },
  name: {
    type: String
  },
  kycStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'FAILED']
  }
});

User.statics.findOneByPublicAddress = function(publicAddress) {
  return this.findOne({
    publicAddress
  }).exec();
};

User.statics.findOneById = function(id) {
  return this.findOne({
    _id: id
  }).exec();
};

User.statics.create = function(publicAddress) {
  const nonce = Math.floor(Math.random() * 10000).toString();
  const user = this({
    publicAddress,
    nonce
  });

  return user.save();
};

User.statics.addHostedCampaign = function(publicAddress, onChainData) {
  return this.findOne({
    publicAddress
  })
    .exec()
    .then(user => {
      if (!user) {
        throw new utils.TypedError(404, 'unknown publicAddress');
      } else {
        return Campaign.createHostedDomain(user._id, onChainData);
      }
    });
};

User.statics.addExternalCampaign = async function(publicAddress, data) {
  const user = await this.findOne({
    publicAddress
  }).exec();
  if (!user) {
    throw new utils.TypedError(404, 'unknown publicAddress');
  } else {
    return Campaign.createExternalCampaign(user._id, data);
  }
};

User.methods.addEmail = function(email) {
  if (this.currentEmail && this.currentEmail.address !== email) {
    this.previousEmails.push(this.currentEmail);
  }

  if (!this.currentEmail || this.currentEmail.address !== email) {
    this.currentEmail = {
      address: email
    };
    this.updatedAt = new Date();

    if (config.dev) {
      this.currentEmail.verifiedAt = Date.now();
      return this.save();
    } else {
      return this.save()
        .then(HashToEmail.create(this._id, this.currentEmail))
        .then(() => {
          return this;
        });
    }
  } else {
    return this;
  }
};

User.statics.verifyEmail = function(userId, emailId) {
  return this.findOne({
    _id: userId
  })
    .exec()
    .then(user => {
      if (!user) {
        throw new utils.TypedError(500, 'internal error');
      } else if (!user.currentEmail || !user.currentEmail._id.equals(emailId)) {
        throw new utils.TypedError(
          400,
          'a different email has been registred for that account',
          'EXPIRED_TOKEN'
        );
      } else if (user.currentEmail.verifiedAt) {
        throw new utils.TypedError(400, 'the address is already verified', 'VERIFIED_TOKEN');
      } else {
        user.currentEmail.verifiedAt = Date.now();
        user.updatedAt = Date.now();
        return user.save();
      }
    });
};

const UserModel: any = mongoose.model('User', User);
export default UserModel;
