import User from './user';
import Campaign from './campaign';
import mongoose from 'mongoose';
import * as te from '../typedError';
const Schema = mongoose.Schema;

const Vote = new Schema({
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  up: {
    type: Boolean,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
  },
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    index: true,
    required: true,
  },
  email: {
    type: String,
    index: true,
    required: true,
  },
  retracted: {
    type: Boolean,
    required: true,
    default: false,
  },
});

// Create
Vote.statics.create = function (userId, campaignId, up) {
  let email;

  return User.findOneById(userId)
    .then(u => {
      if (!u) {
        throw new te.TypedError(404, 'user not found');
      } else if (!u.currentEmail || !u.currentEmail.verifiedAt) {
        throw new te.TypedError(403, 'verified email address required');
      } else {
        email = u.currentEmail.address;
        return Campaign.findOneById(campaignId);
      }
    })
    .then(c => {
      if (!c) {
        throw new te.TypedError(404, 'campaign not found');
      } else {
        return this.aggregate(
          [
            {
              $match: {
                email: email,
                campaign: campaignId,
                retracted: false,
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            }]);
      }
    })
    .then(agg => {
      console.log(agg);
      // if (agg.length === 0) {
      // } else {
      // }
    });
  // Check the user has valid email address
  // Check the email has not voted for the campaign already
};

// Retract
// Set the flag

// Count per campaign
// Use mongo aggregation

// Get votes per account
// find

module.exports = mongoose.model('Vote', Vote);
