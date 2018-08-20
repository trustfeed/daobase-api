import { Base64 } from 'js-base64';
import mongoose from 'mongoose';
import * as te from '../typedError';
import Contract from './contract';
import config from '../config';
import web3OnNetwork from './networks';
const Schema = mongoose.Schema;

const DeployedContract = new Schema({
  address: {
    type: String,
  },
  abi: {
    type: String,
    required: true,
  },
});

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
  totalSupply: {
    type: Number,
  },
  startingTime: {
    type: Date,
  },
  duration: {
    type: Number,
  },
  rate: {
    type: Number,
  },
  softCap: {
    type: Number,
  },
  hardCap: {
    type: Number,
  },
  campaignStatus: {
    type: String,
    enum: ['DRAFT', 'PENDING_REVIEW', 'REVIEWED', 'DEPLOYING', 'DEPLOYED'],
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
  version: {
    type: String,
    enum: ['0.0.0'],
    required: true,
    default: ['0.0.0'],
  },
  tokenContract: {
    type: DeployedContract,
    required: false,
  },
  crowdsaleContract: {
    type: DeployedContract,
    required: false,
  },
});

Campaign.statics.submitForReview = function (userId, campaignId) {
  return this.findOne({
    _id: campaignId,
  }).exec()
    .then(campaign => {
      if (!campaign) {
        throw new te.TypedError(404, 'no such campaign');
      } else if (!campaign.owner.equals(userId)) {
        throw new te.TypedError(403, 'you do not own that campaign');
      } else if (campaign.campaignStatus !== 'DRAFT') {
        throw new te.TypedError(400, 'the contract is not a draft');
      } else {
        campaign.campaignStatus = 'PENDING_REVIEW';
        return campaign.save();
      }
    });
};

Campaign.statics.acceptReview = function (userId, campaignId) {
  return this.findOne({
    _id: campaignId,
  }).exec()
    .then(campaign => {
      if (!campaign) {
        throw new te.TypedError(404, 'no such campaign');
      } else if (!campaign.owner.equals(userId)) {
        throw new te.TypedError(403, 'you do not own that campaign');
      } else if (campaign.campaignStatus !== 'PENDING_REVIEW') {
        throw new te.TypedError(400, 'the contract is not pending review');
      } else {
        campaign.campaignStatus = 'REVIEWED';
        return campaign.save();
      }
    });
};

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

// TODO: data validation
Campaign.statics.deploy = function (userId, campaignId) {
  let campaign, contract, out;
  return this.findOne({
    _id: campaignId,
  }).exec()
    .then(c => {
      if (!c) {
        throw new te.TypedError(404, 'no such campaign');
      } else if (!c.owner.equals(userId)) {
        throw new te.TypedError(403, 'you do not own that campaign');
      }
      campaign = c;
      if (campaign.campaignStatus !== 'REVIEWED') {
        throw new te.TypedError(400, 'the contract is not reviewed');
      } else {
        return Contract.findOne({
          name: 'TrustFeedCampaign',
          version: campaign.version,
        });
      }
    })
    .then(c => {
      if (!c) {
        throw new te.TypedError(500, 'error finding contract');
      }
      contract = c;
      const startTime = campaign.startingTime.getTime();
      return contract.makeDeployment(
        campaign.network,
        [
          config.trustfeedAddress,
          campaign.tokenName,
          campaign.tokenSymbol,
          campaign.numberOfDecimals,
          campaign.totalSupply,
          startTime,
          startTime + campaign.duration * 60 * 60 * 24,
          campaign.rate,
          campaign.hardCap,
          campaign.softCap,
        ]);
    })
    .then(o => {
      out = o;
      campaign.campaignStatus = 'DEPLOYING';
      return campaign.save();
    })
    .then(() => {
      return out;
    });
};

Campaign.statics.finaliseDeployment = function (userId, campaignId, blockNumber, transactionIndex) {
  let campaign, contract, expectedInput, web3;
  let token = {};
  let crowdsale = {};
  return this.findOne({
    _id: campaignId,
  }).exec()
    .then(c => {
      if (!c) {
        throw new te.TypedError(404, 'no such campaign');
      } else if (!c.owner.equals(userId)) {
        throw new te.TypedError(403, 'you do not own that campaign');
      } else {
        campaign = c;
        if (campaign.campaignStatus !== 'DEPLOYING') {
          throw new te.TypedError(400, 'the contract is not DEPLOYING');
        } else {
          web3 = web3OnNetwork(campaign.network);
          return Contract.findOne({
            name: 'TrustFeedCampaign',
            version: campaign.version,
          });
        }
      }
    })
    .then(c => {
      if (!c) {
        throw new te.TypedError(500, 'error finding contract');
      } else {
        contract = c;
        const startTime = campaign.startingTime.getTime();
        return contract.makeDeployment(
          'ws://localhost:7545',
          [
            config.trustfeedAddress,
            campaign.tokenName,
            campaign.tokenSymbol,
            campaign.numberOfDecimals,
            campaign.totalSupply,
            startTime,
            startTime + campaign.duration * 60 * 60 * 24,
            campaign.rate,
            campaign.hardCap,
            campaign.softCap,
          ]);
      }
    })
    .then(deployment => {
      expectedInput = deployment.deployData;
      return web3.eth.getTransactionFromBlock(blockNumber, transactionIndex);
    })
    .then(transaction => {
      if (!transaction) {
        throw new te.TypedError(400, 'no such transaction');
      } else if (transaction.input !== expectedInput) {
        throw new te.TypedError(400, 'that transaction data is not correct');
      } else {
        return web3.eth.getTransactionReceipt(transaction.hash);
      }
    })
    .then(x => {
      if (!x.status) {
        throw new te.TypedError(400, 'that transaction was not successful');
      }
      contract = new web3.eth.Contract(JSON.parse(contract.abi), x.contractAddress);
      return contract.methods.token().call({});
    })
    .then(res => {
      token.address = res;
      return contract.methods.crowdsale().call();
    })
    .then(res => {
      crowdsale.address = res;
      return Contract.findOne({ name: 'TrustFeedToken', version: campaign.version });
    })
    .then(c => {
      if (!c) {
        throw new te.TypedError(500, 'error finding contract');
      } else {
        token.abi = c.abi;
        return Contract.findOne({ name: 'TrustFeedCrowdsale', version: campaign.version });
      }
    })
    .then(c => {
      if (!c) {
        throw new te.TypedError(500, 'error finding contract');
      } else {
        crowdsale.abi = c.abi;
        campaign.tokenContract = token;
        campaign.crowdsaleContract = crowdsale;
        campaign.campaignStatus = 'DEPLOYED';
        return campaign.save();
      }
    });
};

module.exports = mongoose.model('Campaign', Campaign);
