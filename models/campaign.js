const mongoose = require('mongoose');
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

Campaign.statics.findById = function (id) {
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

module.exports = mongoose.model('Campaign', Campaign);
