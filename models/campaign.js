import { Base64 } from 'js-base64';
import mongoose from 'mongoose';
import * as te from '../typedError';
import Contract from './contract';
import config from '../config';
import web3OnNetwork from './networks';
const Schema = mongoose.Schema;

// A contract that is deployed on a network
const DeployedContract = new Schema({
  address: {
    type: String,
  },
  abi: {
    type: String,
    required: true,
  },
});

// The on-chain data that can only be modified during DRAFT
const OnChainData = new Schema({
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  network: {
    type: String,
    enum: ['local', 'ganache-trustfeed', 'rinkeby'],
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
  rate: {
    type: Number,
  },
  softCap: {
    type: Number,
  },
  hardCap: {
    type: Number,
  },
  version: {
    type: String,
    enum: ['0.0.0'],
    required: true,
    default: ['0.0.0'],
  },
});

// The off-chain data that can be altered at other times
const OffChainData = new Schema({
  coverImageURL: {
    type: String,
  },
  whitePaperURL: {
    type: String,
  },
  description: {
    type: String,
  },
  keywords: {
    type: [String],
  },
});

// A campaign that is hosted by TrustFeed
const HostedCampaign = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
  },
  campaignStatus: {
    type: String,
    enum: ['DRAFT', 'PENDING_REVIEW', 'REVIEWED', 'DEPLOYING', 'DEPLOYED'],
    required: true,
    default: ['DRAFT'],
  },
  tokenContract: {
    type: DeployedContract,
    required: false,
  },
  crowdsaleContract: {
    type: DeployedContract,
    required: false,
  },
  onChainData: {
    type: OnChainData,
    required: true,
  },
  offChainData: {
    type: OffChainData,
    required: true,
  },
});

// The complete campaign data model
const Campaign = new Schema({
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
  hostedCampaign: {
    type: HostedCampaign,
  },
});

Campaign.index({ 'hostedCampaign.owner': 1 });

// Create a hosted campaign with the given on-chain data
Campaign.statics.createHostedDomain = function (owner, onChainData) {
  const hostedCampaign = {
    owner,
    onChainData: onChainData || {},
    offChainData: {},
  };
  const campaign = this({
    _id: new mongoose.Types.ObjectId(),
    hostedCampaign: hostedCampaign,
  });

  return campaign.save();
};

// Fetch all hosted campaigns owned by the given user
Campaign.statics.findByOwner = function (owner, offset) {
  const pageSize = 20;
  let q = { 'hostedCampaign.owner': owner };
  if (offset) {
    q.updatedAt = { $lt: new Date(Number(Base64.decode(offset))) };
  }
  
  return this
    .find(q)
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

// This fetches a hosted campaign and checks the user matches
Campaign.statics.fetchHostedCampaign = function (userId, campaignId) {
  return this.findOne({
    _id: campaignId,
  }).exec()
    .then(campaign => {
      if (!campaign) {
        throw new te.TypedError(404, 'no such campaign');
      } else if (!campaign.hostedCampaign) {
        throw new te.TypedError(403, 'not a hosted campaign');
      } else if (!campaign.hostedCampaign.owner.equals(userId)) {
        throw new te.TypedError(403, 'you do not own that campaign');
      } else {
        return campaign;
      }
    });
};

// Review this hosted campaign
Campaign.statics.submitForReview = function (userId, campaignId) {
  return this.fetchHostedCampaign(userId, campaignId)
    .then(campaign => {
      if (campaign.hostedCampaign.campaignStatus !== 'DRAFT') {
        throw new te.TypedError(400, 'the campaign is not a draft');
      } else {
        campaign.hostedCampaign.campaignStatus = 'PENDING_REVIEW';
        campaign.updatedAt = Date.now();
        return campaign.save();
      }
    });
};

// This is temporary. Allow a user to end the review stage.
Campaign.statics.acceptReview = function (userId, campaignId) {
  return this.fetchHostedCampaign(userId, campaignId)
    .then(campaign => {
      if (campaign.hostedCampaign.campaignStatus !== 'PENDING_REVIEW') {
        throw new te.TypedError(400, 'the campaign is not pending review');
      } else {
        campaign.hostedCampaign.campaignStatus = 'REVIEWED';
        campaign.updatedAt = Date.now();
        return campaign.save();
      }
    });
};

Campaign.statics.putOnChainData = function (userId, campaignId, data) {
  return this.fetchHostedCampaign(userId, campaignId)
    .then(campaign => {
      if (campaign.hostedCampaign.campaignStatus !== 'DRAFT') {
        throw new te.TypedError(403, 'the campaign is not in DRAFT status');
      } else {
        campaign.hostedCampaign.onChainData = data;
        campaign.updatedAt = Date.now();
        return campaign.save();
      }
    });
};

Campaign.statics.putOffChainData = function (userId, campaignId, data) {
  return this.fetchHostedCampaign(userId, campaignId)
    .then(campaign => {
      campaign.hostedCampaign.offChainData = data;
      campaign.updatedAt();
      return campaign.save();
    });
};

Campaign.methods.makeDeployment = function () {
  return Contract.findOne({
    name: 'TrustFeedCampaign',
    version: this.hostedCampaign.onChainData.version,
  })
    .then(contract => {
      if (!contract) {
        throw new te.TypedError(500, 'error finding contract');
      }
      const startTime = this.hostedCampaign.onChainData.startingTime.getTime();
      return contract.makeDeployment(
        this.hostedCampaign.onChainData.network,
        [
          config.trustfeedAddress,
          this.hostedCampaign.onChainData.tokenName,
          this.hostedCampaign.onChainData.tokenSymbol,
          this.hostedCampaign.onChainData.numberOfDecimals,
          this.hostedCampaign.onChainData.hardCap,
          startTime,
          startTime + this.hostedCampaign.onChainData.duration * 60 * 60 * 24,
          this.hostedCampaign.onChainData.rate,
          this.hostedCampaign.onChainData.hardCap,
          this.hostedCampaign.onChainData.softCap,
        ]);
    });
};

Campaign.statics.deploy = function (userId, campaignId) {
  let campaign, out;

  return this.fetchHostedCampaign(userId, campaignId)
    .then(c => {
      campaign = c;
      return campaign.makeDeployment();
    })
    .then(o => {
      out = o;
      campaign.hostedCampaign.campaignStatus = 'DEPLOYING';
      return campaign.save();
    })
    .then(() => {
      return out;
    });
};

Campaign.statics.finaliseDeployment = async function (userId, campaignId, blockNumber, transactionIndex) {
  const validateTransaction = (deployment) => {
    const expectedInput = deployment.transaction;
    return web3.eth.getTransactionFromBlock(blockNumber, transactionIndex)
      .catch(() => {
        throw new te.TypedError(400, 'cannot look up that block number and transaction index');
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
      .then(receipt => {
        if (!receipt.status) {
          throw new te.TypedError(400, 'that transaction was not successful');
        } else {
          return receipt;
        }
      });
  };

  const getCampaignContract = (receipt) => {
    return Contract.findOne({
      name: 'TrustFeedCampaign',
      version: campaign.hostedCampaign.onChainData.version,
    }).exec()
      .then(c => {
        return new web3.eth.Contract(JSON.parse(c.abi), receipt.contractAddress);
      });
  };

  const getInnerContract = (innerName) => {
    let out = {};
    return campaignContract.methods.token().call({})
      .then(res => {
        out.address = res;
        return Contract.findOne({
          name: innerName,
          version: campaign.hostedCampaign.onChainData.version,
        });
      })
      .then(c => {
        if (!c) {
          throw new te.TypedError(500, 'error finding contract');
        } else {
          out.abi = c.abi;
          return out;
        }
      });
  };

  let campaign = await this.fetchHostedCampaign(userId, campaignId);
  let web3 = web3OnNetwork(campaign.hostedCampaign.onChainData.network);
  let campaignContract = await (campaign.makeDeployment()
    .then(validateTransaction)
    .then(getCampaignContract));
  campaign.hostedCampaign.tokenContract = await getInnerContract('TrustFeedToken');
  campaign.hostedCampaign.crowdsaleContract = await getInnerContract('TrustFeedCrowdsale');
  return campaign.save();
};

Campaign.statics.allPublic = function (offset) {
  const pageSize = 20;
  let q = { 'hostedCampaign.campaignStatus': 'DEPLOYED' };
  if (offset) {
    q.updatedAt = { $lt: new Date(Number(Base64.decode(offset))) };
  }
  return this
    .find(q)
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

Campaign.statics.publicById = function (campaignId) {
  return this.findOne({
    _id: campaignId,
    'hostedCampaign.campaignStatus': 'DEPLOYED',
  }).exec();
};

module.exports = mongoose.model('Campaign', Campaign);
