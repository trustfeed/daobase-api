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
    required: true,
  },
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  retracted: {
    type: Boolean,
    required: true,
    default: false,
  },
});

Vote.index({ campaign: 1, email: 1, retracted: 1 });
Vote.index({ campaign: 1, retracted: 1 });
Vote.index({ user: 1, campaign: 1, retracted: 1 });

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
        return User.findOneById(c.owner);
      }
    })
    .then(owner => {
      if (!owner) {
        throw new te.TypedError(500, 'internal error');
      } else if (owner.currentEmail && owner.currentEmail.address === email) {
        throw new te.TypedError(403, 'the campaign is regestired to your email address');
      } else {
        return this.aggregate(
          [
            {
              $match: {
                campaign: campaignId,
                email: email,
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
      if (agg.length > 0) {
        throw new te.TypedError(400, 'an account associated with your email has already voted for this campaign');
      } else {
        const vote = this({
          up,
          user: userId,
          campaign: campaignId,
          email,
        });
        return vote.save();
      }
    });
};

Vote.statics.retract = function (userId, campaignId) {
  return this.find({ user: userId, campaign: campaignId, retracted: false })
    .then(vs => {
      if (!vs || vs.length === 0) {
        throw new te.TypedError(404, 'no such vote');
      } else {
        const ps = vs.map(x => {
          x.retracted = true;
          return x.save();
        });
        return Promise.all(ps);
      }
    });
};

Vote.statics.count = function (campaignId) {
  return this.aggregate(
    [
      {
        $match: {
          campaign: campaignId,
          retracted: false,
        },
      },
      {
        $group: {
          _id: '$up',
          uniqueEmails: { $addToSet: '$email' },
        },
      },
      {
        $project: {
          votes: { $size: '$uniqueEmails' },
        },
      },
    ])
    .then(rs => {
      let out = { up: 0, down: 0 };
      rs.map(r => {
        if (r._id) {
          out.up = r.votes;
        } else {
          out.down = r.votes;
        }
      });
      return out;
    });
};

Vote.statics.findNewestForPair = function (userId, campaignId) {
  return this
    .find({ user: userId, campaign: campaignId, retracted: false })
    .sort({ createdAt: -1 })
    .limit(1);
};

// Get votes per account
// find

module.exports = mongoose.model('Vote', Vote);
