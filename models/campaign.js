import { Base64 } from 'js-base64';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const Campaign = new Schema({
  _id: Schema.Types.ObjectId,
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  network: {
    type: String,
    required: true,
    default: ['rinkeby'],
  },
  tokenName: {
    type: String,
  },
  tokenSymbol: {
    type: String,
  },
  numberOfDecimals: {
    type: Number,
  },
  startingTime: {
    type: Date,
  },
  duration: {
    type: Number,
  },
  softCap: {
    type: Number,
  },
  hardCap: {
    type: Number,
  },
  totalSupply: {
    type: Number,
  },
  campaignStatus: {
    type: String,
    enum: ['DRAFT'],
    required: true,
    default: ['DRAFT'],
  },
  imageURL: {
    type: String,
  },
  oldImages: {
    type: [String],
    default: [],
  },
  whitepaperURL: {
    type: String,
  },
  oldWhitepapers: {
    type: [String],
    default: [],
  },
});

Campaign.statics.findByOwner = function (owner) {
  return this.find({
    owner,
  }).exec();
};

Campaign.statics.findOneById = function (id) {
  return this.findOne({
    _id: id,
  }).exec();
};

Campaign.statics.create = function (owner) {
  const campaign = this({
    _id: new mongoose.Types.ObjectId(),
    owner: owner,
  });

  return campaign.save();
};

Campaign.statics.allPublic = function (offset) {
  const pageSize = 20;
  let q;
  if (offset) {
    q = this.find({ updatedAt: { $lt: new Date(Number(Base64.decode(offset))) } });
  } else {
    q = this.find();
  }
  return q
    .sort({ updatedAt: 'desc' })
    .limit(pageSize)
    .exec()
    .then(cs => {
      let nextOffset;
      if (cs.length === pageSize) {
        nextOffset = Base64.encode(cs[cs.length - 1].updatedAt.getTime());
      }
      return { campaigns: cs, next: nextOffset };
    });
};

module.exports = mongoose.model('Campaign', Campaign);
