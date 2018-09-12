import { Base64 } from 'js-base64';
import mongoose from 'mongoose';
import * as te from '../typedError';
import Contract from './contract';
import config from '../config';
import Networks from './networks';
import validate from 'validate.js';
import Web3 from 'web3';
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
    enum: ['rinkeby'],
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
    type: String,
  },
  softCap: {
    type: String,
  },
  hardCap: {
    type: String,
  },
  isMinted: {
    type: Boolean,
    default: false,
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
  walletContract: {
    type: DeployedContract,
    required: false,
  },
  weiRaised: {
    type: String,
    required: false,
  },
});

const stringToBNOrUndefined = (s) => {
  try {
    return Web3.utils.toBN(s);
  } catch (err) {
    return undefined;
  }
};

const stringRoundedOrUndefined = (s) => {
  try {
    return Math.round(Number(s));
  } catch (err) {
    return undefined;
  }
};

OnChainData.methods.generateReport = function () {
  const constraints = {
    network: {
      presence: true,
      inclusion: ['rinkeby'],
    },
    tokenName: {
      presence: true,
    },
    tokenSymbol: {
      presence: true,
    },
    numberOfDecimals: {
      presence: true,
      numericality: {
        noStrings: true,
        greaterThanOrEqualTo: 0,
        lessThanOrEqualTo: 18,
      },
    },
    startingTime: {
      presence: true,
    },
    duration: {
      presence: true,
      numericality: {
        noStrings: true,
        greaterThanOrEqualTo: 1,
      },
    },
    rate: {
      presence: true,
    },
    softCap: {
      presence: true,
    },
    hardCap: {
      presence: true,
    },
    isMinted: {
      presence: true,
    },
    version: {
      presence: true,
      inclusion: ['0.0.0'],
    },
  };
  let errs = validate(this, constraints);
  if (errs === undefined) {
    errs = {};
  }

  // const tomorrow = Date.now(); // + 1000 * 60 * 60 * 24;
  // if (this.startingTime && this.startingTime.getTime() * 1000 < tomorrow) {
  //  console.log(this.startingTime);
  //  console.log(this.startingTime.getTime(), Date.now() + 1000 * 60 * 60 * 24);
  //  const msg = 'Starting time must be at least one day into the future';
  //  if (errs.startingTime) {
  //    errs.startingTime.push(msg);
  //  } else {
  //    errs.startingTime = [msg];
  //  }
  // }

  const softCap = stringToBNOrUndefined(this.softCap);
  if (!softCap || softCap < 1) {
    const msg = 'Soft cap must be an integer larger than 0';
    if (errs.softCap) {
      errs.softCap.push(msg);
    } else {
      errs.softCap = [msg];
    }
  }

  const hardCap = stringToBNOrUndefined(this.hardCap);
  if (!hardCap || (softCap && hardCap.lte(softCap))) {
    const msg = 'Hard cap must be an integer greater than soft cap';
    if (errs.hardCap) {
      errs.hardCap.push(msg);
    } else {
      errs.hardCap = [msg];
    }
  }

  const rate = stringRoundedOrUndefined(this.rate);
  if (!rate || rate < 1) {
    const msg = 'rate must be larger than 0';
    if (errs.rate) {
      errs.rate.push(msg);
    } else {
      errs.rate = [msg];
    }
  }

  return errs;
};

// The off-chain data that can be altered at other times
const OffChainData = new Schema({
  coverImageURL: {
    type: String,
  },
  whitePaperURL: {
    type: String,
  },
  summary: {
    type: String,
  },
  description: {
    type: String,
  },
  keywords: {
    type: [String],
  },
});

OffChainData.methods.generateReport = function () {
  const constraints = {
    coverImageURL: {
      presence: true,
      url: true,
    },
    whitePaperURL: {
      presence: true,
      url: true,
    },
  };
  let errs = validate(this, constraints);
  if (errs === undefined) {
    errs = {};
  }
  return errs;
};

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
    enum: [
      'DRAFT',
      'PENDING_REVIEW',
      'REVIEWED',
      'PENDING_DEPLOYMENT',
      'DEPLOYED',
      'PENDING_OFF_CHAIN_REVIEW',
    ],
    required: true,
    default: ['DRAFT'],
  },
  onChainData: {
    type: OnChainData,
    required: true,
  },
  offChainData: {
    type: OffChainData,
    required: true,
  },
  offChainDataDraft: OffChainData,
});

// Get the contract describing the campaign
HostedCampaign.methods.getCampaignContract = function () {
  let name = 'TrustFeedCampaign';
  if (this.onChainData.isMinted) {
    name = 'TrustFeedMintedCampaign';
  }

  return Contract.findOne({
    name,
    version: this.onChainData.version,
  }).exec();
};

const PeriodSchema = new Schema({
  openingTime: Date,
  closingTime: Date,
});

const LinkSchema = new Schema({
  type: {
    type: String,
    required: true,
  },
});

const TeamMemberSchema = new Schema({
  name: String,
  role: String,
  description: String,
  links: [LinkSchema],
});

const ExternalCampaign = new Schema({
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
  },
  name: String,
  symbol: String,
  summary: String,
  description: String,
  companyURL: String,
  whitePaperURL: String,
  coverImageURL: String,
  preICO: PeriodSchema,
  ico: PeriodSchema,
  links: [LinkSchema],
  location: String,
  team: [TeamMemberSchema],
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
  externalCampaign: {
    type: ExternalCampaign,
  },
});

Campaign.index({ 'hostedCampaign.owner': 1 });
Campaign.index({ 'hostedCampaign.onChainData.tokenContract.address': 1 });

// Create a hosted campaign with the given on-chain data
Campaign.statics.createHostedDomain = function (owner, onChainData) {
  if (onChainData && onChainData.startingTime) {
    onChainData.startingTime = Date(onChainData.startingTime * 1000);
  }
  let hostedCampaign = {
    owner,
    onChainData: onChainData || {},
    offChainData: {},
  };
  console.log(onChainData, hostedCampaign);
  const campaign = this({
    _id: new mongoose.Types.ObjectId(),
    hostedCampaign: hostedCampaign,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return campaign.save();
};

Campaign.statics.findAllExternal = function (owner, offset) {
  const pageSize = 20;
  let q = { externalCampaign: { $exists: true } };
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

// Fetch all hosted campaigns owned by the given user
Campaign.statics.findHostedByOwner = function (owner, offset) {
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

Campaign.statics.createExternalCampaign = function (userId, data) {
  data.addedBy = userId;

  const campaign = this({
    externalCampaign: data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return campaign.save();
};

// This fetches a hosted campaign and checks the user matches
Campaign.statics.fetchHostedCampaign = async function (userId, campaignId) {
  let campaign = await this.findOne({
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

  campaign.updateWeiRaisedOlderThan().catch(console.log);
  return campaign;
};

// Review this hosted campaign
Campaign.statics.submitForReview = function (userId, campaignId) {
  return this.fetchHostedCampaign(userId, campaignId)
    .then(campaign => {
      if (campaign.hostedCampaign.campaignStatus === 'DRAFT') {
        const onChainErrs = campaign.hostedCampaign.onChainData.generateReport();
        const offChainErrs = campaign.hostedCampaign.offChainData.generateReport();
        if (Object.keys(onChainErrs).length > 0 || Object.keys(offChainErrs).length > 0) {
          throw new te.TypedError(
            400,
            'validation error',
            'INVALID_DATA',
            { onChainValidationErrors: onChainErrs,
              offChainValidationErrors: offChainErrs,
            });
        } else {
          campaign.hostedCampaign.campaignStatus = 'PENDING_REVIEW';
          campaign.updatedAt = Date.now();
          return campaign.save();
        }
      } else if (campaign.hostedCampaign.campaignStatus === 'DEPLOYED') {
        const draft = campaign.hostedCampaign.offChainDataDraft;
        const offChainErrs = draft.generateReport();
        if (Object.keys(offChainErrs).length > 0) {
          throw new te.TypedError(
            400,
            'validation error',
            'INVALID_DATA',
            { offChainValidationErrors: offChainErrs });
        } else {
          campaign.hostedCampaign.campaignStatus = 'PENDING_OFF_CHAIN_REVIEW';
          campaign.updatedAt = Date.now();
          return campaign.save();
        }
      } else {
        throw new te.TypedError(400, 'the campaign is not a draft');
      }
    });
};

Campaign.statics.cancelReview = async function (userId, campaignId) {
  let campaign = await this.fetchHostedCampaign(userId, campaignId);

  const campaignStatus = campaign.hostedCampaign.campaignStatus;
  if (campaignStatus === 'PENDING_REVIEW' || campaignStatus === 'REVIEWED') {
    campaign.hostedCampaign.campaignStatus = 'DRAFT';
    campaign.updatedAt = Date.now();
    return campaign.save();
  } else if (campaignStatus === 'PENDING_OFF_CHAIN_REVIEW') {
    campaign.hostedCampaign.campaignStatus = 'DEPLOYED';
    campaign.updatedAt = Date.now();
    return campaign.save();
  } else {
    throw new te.TypedError(400, 'the campaign is not pending review, reviewed or pending off chain review');
  }
};

// This is temporary. Allow a user to end the review stage.
Campaign.statics.acceptReview = function (userId, campaignId) {
  return this.fetchHostedCampaign(userId, campaignId)
    .then(campaign => {
      if (campaign.hostedCampaign.campaignStatus === 'PENDING_REVIEW') {
        campaign.hostedCampaign.campaignStatus = 'REVIEWED';
        campaign.updatedAt = Date.now();
        return campaign.save();
      } else if (campaign.hostedCampaign.campaignStatus === 'PENDING_OFF_CHAIN_REVIEW') {
        campaign.hostedCampaign.campaignStatus = 'DEPLOYED';
        campaign.hostedCampaign.offChainData = campaign.hostedCampaign.offChainDataDraft;
        campaign.updatedAt = Date.now();
        return campaign.save();
      } else {
        throw new te.TypedError(400, 'the campaign is not pending review');
      }
    });
};

Campaign.statics.putExternal = async function (userId, campaignId, data) {
  const campaign = await this.findOne({ _id: campaignId }).exec();
  if (!campaign) {
    throw new te.TypedError(404, 'unknown campaign');
  } else if (!campaign.externalCampaign) {
    throw new te.TypedError(403, 'that is not an external campaign');
  }
  data.addedBy = campaign.externalCampaign.addedBy;
  campaign.externalCampaign = data;
  return campaign.save();
};

Campaign.statics.putOnChainData = async function (userId, campaignId, data) {
  const campaign = await this.fetchHostedCampaign(userId, campaignId);
  if (campaign.hostedCampaign.campaignStatus !== 'DRAFT') {
    throw new te.TypedError(403, 'the campaign is not in DRAFT status');
  }

  campaign.hostedCampaign.onChainData = data;
  if (data && data.startingTime) {
    campaign.hostedCampaign.onChainData.startingTime = data.startingTime * 1000;
  }
  campaign.updatedAt = Date.now();
  const errs = campaign.hostedCampaign.onChainData.generateReport();
  if (Object.keys(errs).length > 0) {
    throw new te.TypedError(
      400,
      'validation error',
      'INVALID_DATA',
      { onChainValidationErrors: errs },
    );
  }
  return campaign.save();
};

Campaign.statics.putOffChainData = async function (userId, campaignId, data) {
  const campaign = await this.fetchHostedCampaign(userId, campaignId);
  if (campaign.hostedCampaign.campaignStatus === 'DRAFT') {
    campaign.hostedCampaign.offChainData = data;
    campaign.updatedAt = Date.now();
    return campaign.save();
  } else if (campaign.hostedCampaign.campaignStatus === 'DEPLOYED') {
    campaign.hostedCampaign.offChainDataDraft = data;
    campaign.updatedAt = Date.now();
    return campaign.save();
  } else {
    throw new te.TypedError(403, 'the campaign is not in DRAFT or DEPLOYED status');
  }
};

Campaign.methods.makeDeployment = function (userAddress) {
  return this.hostedCampaign.getCampaignContract()
    .then(contract => {
      if (!contract) {
        throw new te.TypedError(500, 'error finding contract');
      }
      const rate = stringRoundedOrUndefined(this.hostedCampaign.onChainData.rate);
      const startTime = this.hostedCampaign.onChainData.startingTime.getTime() / 1000;
      let args;
      if (this.hostedCampaign.onChainData.isMinted) {
        args = [
          [config.trustfeedAddress, userAddress],
          this.hostedCampaign.onChainData.tokenName,
          this.hostedCampaign.onChainData.tokenSymbol,
          this.hostedCampaign.onChainData.numberOfDecimals,

          startTime,
          startTime + this.hostedCampaign.onChainData.duration * 60 * 60 * 24,

          rate,
          (this.hostedCampaign.onChainData.hardCap),
          (this.hostedCampaign.onChainData.softCap),
          this._id.toString(),
          // TODO: different networks
          '0xB900F568D3F54b5DE594B7968e68181fC45fCAc6',
        ];
      } else {
        args = [
          [config.trustfeedAddress, userAddress],
          this.hostedCampaign.onChainData.tokenName,
          this.hostedCampaign.onChainData.tokenSymbol,
          this.hostedCampaign.onChainData.numberOfDecimals,

          Web3.utils.toBN(this.hostedCampaign.onChainData.hardCap)
            .mul(Web3.utils.toBN(rate)),

          startTime,
          startTime + this.hostedCampaign.onChainData.duration * 60 * 60 * 24,

          rate,
          (this.hostedCampaign.onChainData.hardCap),
          (this.hostedCampaign.onChainData.softCap),
          this._id.toString(),
          // TODO: different networks
          '0xB900F568D3F54b5DE594B7968e68181fC45fCAc6',
        ];
      }
      return contract.makeDeployment(
        this.hostedCampaign.onChainData.network,
        args,
      );
    });
};

Campaign.statics.deploymentTransaction = async function (userId, userAddress, campaignId) {
  let campaign = await this.fetchHostedCampaign(userId, campaignId);
  if (campaign.hostedCampaign.campaignStatus !== 'REVIEWED') {
    throw new te.TypedError(400, 'the campaign is not reviewed');
  }
  if (config.dev) {
    campaign.hostedCampaign.onChainData.startingTime = new Date(1000 * ((new Date().getTime()) / 1000 + 5 * 60));
    campaign = await campaign.save();
  }
  const out = campaign.makeDeployment(userAddress);
  campaign.hostedCampaign.campaignStatus = 'PENDING_DEPLOYMENT';
  await campaign.save();
  return out;
};

Campaign.methods.fetchContracts = async function (campaignAddress) {
  const getInnerContract = async (innerName, func) => {
    const contractJSON = await Contract.findOne({
      name: innerName,
      version: this.hostedCampaign.onChainData.version,
    });

    if (!contractJSON) {
      throw new te.TypedError(500, 'cannot locate contract: ' + innerName);
    }

    return {
      address: await func.call({}),
      abi: contractJSON.abi,
    };
  };

  const campaignContractJson = await this.hostedCampaign.getCampaignContract();
  const web3 = await Networks.fastestNode(this.hostedCampaign.onChainData.network);
  const campaignContract = new web3.eth.Contract(
    JSON.parse(campaignContractJson.abi),
    campaignAddress,
  );

  this.hostedCampaign.onChainData.campaignContract = campaignContract;

  if (this.hostedCampaign.onChainData.isMinted) {
    this.hostedCampaign.onChainData.tokenContract = await getInnerContract(
      'TrustFeedToken',
      campaignContract.methods.token());
    this.hostedCampaign.onChainData.crowdsaleContract = await getInnerContract(
      'TrustFeedCrowdsale',
      campaignContract.methods.crowdsale());
    this.hostedCampaign.onChainData.walletContract = await getInnerContract(
      'TrustFeedWallet',
      campaignContract.methods.wallet());
  } else {
    this.hostedCampaign.onChainData.tokenContract = await getInnerContract(
      'TrustFeedMintableToken',
      campaignContract.methods.token());
    this.hostedCampaign.onChainData.crowdsaleContract = await getInnerContract(
      'TrustFeedMintedCrowdsale',
      campaignContract.methods.crowdsale());
    this.hostedCampaign.onChainData.walletContract = await getInnerContract(
      'TrustFeedWallet',
      campaignContract.methods.wallet());
  }
  return this;
};

Campaign.statics.allPublic = async function (offset) {
  const pageSize = 20;
  let q = {
    $or: [
      { 'hostedCampaign.campaignStatus': 'DEPLOYED' },
      { 'hostedCampaign.campaignStatus': 'PENDING_OFF_CHAIN_REVIEW' },
      { externalCampaign: { $exists: true } },
    ],
  };
  if (offset) {
    q.updatedAt = { $lt: new Date(Number(Base64.decode(offset))) };
  }
  let cs = await this
    .find(q)
    .sort({ updatedAt: 'desc' })
    .limit(pageSize)
    .exec();

  Promise.all(cs.map(c => {
    return c.updateWeiRaisedOlderThan();
  })).catch(console.log);

  let nextOffset;
  if (cs.length === pageSize) {
    nextOffset = Base64.encode(cs[cs.length - 1].updatedAt.getTime());
  }
  return { campaigns: cs, next: nextOffset };
};

Campaign.statics.publicById = async function (campaignId) {
  let campaign = await this.findOne({
    $and: [
      { _id: campaignId },
      { $or: [
        { 'hostedCampaign.campaignStatus': 'DEPLOYED' },
        { 'hostedCampaign.campaignStatus': 'PENDING_OFF_CHAIN_REVIEW' },
        { externalCampaign: { $exists: true } },
      ] }],
  }).exec();
  if (campaign) {
    campaign.updateWeiRaisedOlderThan().catch(console.log);
  }
  return campaign;
};

Campaign.methods.addWeiRaised = async function () {
  if (!this.hostedCampaign ||
  !this.hostedCampaign.onChainData ||
  !this.hostedCampaign.onChainData.network ||
  (this.hostedCampaign.campaignStatus !== 'DEPLOYED' &&
  this.hostedCampaign.campaignStatus !== 'PENDING_OFF_CHAIN_REVIEW') ||
  !this.hostedCampaign.onChainData.crowdsaleContract) {
    return;
  }

  const w3 = await Networks.fastestNode(this.hostedCampaign.onChainData.network);

  let contract = this.hostedCampaign.onChainData.crowdsaleContract;
  contract = new w3.eth.Contract(JSON.parse(contract.abi), contract.address);
  this.hostedCampaign.onChainData.weiRaised = await contract.methods.weiRaised().call();
  return this;
};

Campaign.methods.updateWeiRaisedOlderThan = async function (duration) {
  if (!duration) {
    duration = 1000 * 60 * 5;
  }
  if (Date.now() - this.updatedAt.getTime() > duration) {
    await this.addWeiRaised();
    this.updatedAt = Date.now();
    return this.save();
  } else {
    return Promise.resolve(true);
  }
};

Campaign.statics.updateWeiRaised = async function (tokenAddress) {
  let campaign = await this.findOne({
    'hostedCampaign.onChainData.tokenContract.address': tokenAddress,
  }).exec();

  if (!campaign) {
    throw new te.TypedError(404, 'unknown campaign');
  }

  campaign = await campaign.addWeiRaised();
  campaign.updatedAt = Date.now();
  return campaign.save();
};

module.exports = mongoose.model('Campaign', Campaign);
