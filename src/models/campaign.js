import {
  Base64
} from 'js-base64';
import mongoose from 'mongoose';
import utils from '../utils';
import Contract from './contract';
import config from '../config';
import Networks from './networks';
import Web3 from 'web3';
import HostedCampaign from './hostedCampaign';
import ExternalCampaign from './externalCampaign.js';
const Schema = mongoose.Schema;

// The complete campaign data model
const Campaign = new Schema({
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  hostedCampaign: {
    type: HostedCampaign
  },
  externalCampaign: {
    type: ExternalCampaign
  }
});

Campaign.index({
  'hostedCampaign.owner': 1
});
Campaign.index({
  'hostedCampaign.onChainData.tokenContract.address': 1
});

// Create a hosted campaign with the given on-chain data
Campaign.statics.createHostedDomain = function (owner, onChainData) {
  if (onChainData && onChainData.startingTime) {
    onChainData.startingTime = new Date(onChainData.startingTime * 1000);
  }
  let hostedCampaign = {
    owner,
    onChainData: onChainData || {},
    offChainData: {}
  };
  const campaign = this({
    _id: new mongoose.Types.ObjectId(),
    hostedCampaign: hostedCampaign,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  return campaign.save();
};

Campaign.statics.findAllExternal = function (owner, offset) {
  const pageSize = 20;
  let q = {
    externalCampaign: {
      $exists: true
    }
  };
  if (offset) {
    q.updatedAt = {
      $lt: new Date(Number(Base64.decode(offset)))
    };
  }

  return this.find(q)
    .sort({
      updatedAt: 'desc'
    })
    .limit(pageSize)
    .exec()
    .then(cs => {
      let nextOffset;
      if (cs.length === pageSize) {
        nextOffset = Base64.encode(cs[cs.length - 1].updatedAt.getTime());
      }
      return {
        campaigns: cs,
        next: nextOffset
      };
    });
};

// Fetch all hosted campaigns owned by the given user
Campaign.statics.findHostedByOwner = function (owner, offset) {
  const pageSize = 20;
  let q = {
    'hostedCampaign.owner': owner
  };
  if (offset) {
    q.updatedAt = {
      $lt: new Date(Number(Base64.decode(offset)))
    };
  }

  return this.find(q)
    .sort({
      updatedAt: 'desc'
    })
    .limit(pageSize)
    .exec()
    .then(cs => {
      let nextOffset;
      if (cs.length === pageSize) {
        nextOffset = Base64.encode(cs[cs.length - 1].updatedAt.getTime());
      }
      return {
        campaigns: cs,
        next: nextOffset
      };
    });
};

Campaign.statics.createExternalCampaign = function (userId, data) {
  data.addedBy = userId;

  const campaign = this({
    externalCampaign: data,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  return campaign.save();
};

// This fetches a hosted campaign and checks the user matches
Campaign.statics.fetchHostedCampaign = async function (userId, campaignId) {
  let campaign = await this.findOne({
    _id: campaignId,
  }).exec();

  if (!campaign) {
    throw new utils.TypedError(404, 'no such campaign');
  } else if (!campaign.hostedCampaign) {
    throw new utils.TypedError(403, 'not a hosted campaign');
  } else if (!campaign.hostedCampaign.owner.equals(userId)) {
    throw new utils.TypedError(403, 'you do not own that campaign');
  }

  campaign.updateWeiRaisedOlderThan().catch(console.log);
  return campaign;
};

// Review this hosted campaign
Campaign.statics.submitForReview = async function (userId, campaignId) {
  const campaign = await this.fetchHostedCampaign(userId, campaignId);

  if (campaign.hostedCampaign.campaignStatus === 'DRAFT') {
    const onChainErrs = campaign.hostedCampaign.onChainData.generateReport();
    const offChainErrs = campaign.hostedCampaign.offChainData.generateReport();
    if (Object.keys(onChainErrs).length > 0 || Object.keys(offChainErrs).length > 0) {
      throw new utils.TypedError(
        400,
        'validation error',
        'INVALID_DATA', {
          onChainValidationErrors: onChainErrs,
          offChainValidationErrors: offChainErrs,
        });
    }
    campaign.hostedCampaign.campaignStatus = 'PENDING_REVIEW';
    campaign.updatedAt = Date.now();
    return campaign.save();
  } else if (campaign.hostedCampaign.campaignStatus === 'DEPLOYED') {
    const draft = campaign.hostedCampaign.offChainDataDraft;
    const offChainErrs = draft.generateReport();
    if (Object.keys(offChainErrs).length > 0) {
      throw new utils.TypedError(
        400,
        'validation error',
        'INVALID_DATA', {
          offChainValidationErrors: offChainErrs
        });
    }
    campaign.hostedCampaign.campaignStatus = 'PENDING_OFF_CHAIN_REVIEW';
    campaign.updatedAt = Date.now();
    return campaign.save();
  } else {
    throw new utils.TypedError(400, 'the campaign is not a draft');
  }
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
    throw new utils.TypedError(400, 'the campaign is not pending review, reviewed or pending off chain review');
  }
};

Campaign.statics.acceptReview = async function (userId, campaignId) {
  const campaign = await this.fetchHostedCampaign(userId, campaignId);
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
    throw new utils.TypedError(400, 'the campaign is not pending review');
  }
};

Campaign.statics.putExternal = async function (userId, campaignId, data) {
  const campaign = await this.findOne({
    _id: campaignId
  }).exec();
  if (!campaign) {
    throw new utils.TypedError(404, 'unknown campaign');
  } else if (!campaign.externalCampaign) {
    throw new utils.TypedError(403, 'that is not an external campaign');
  }
  data.addedBy = campaign.externalCampaign.addedBy;
  campaign.externalCampaign = data;
  return campaign.save();
};

Campaign.statics.putOnChainData = async function (userId, campaignId, data) {
  const campaign = await this.fetchHostedCampaign(userId, campaignId);
  if (campaign.hostedCampaign.campaignStatus !== 'DRAFT') {
    throw new utils.TypedError(403, 'the campaign is not in DRAFT status');
  }

  campaign.hostedCampaign.onChainData = data;
  if (data && data.startingTime) {
    campaign.hostedCampaign.onChainData.startingTime = data.startingTime * 1000;
  }
  campaign.updatedAt = Date.now();
  const errs = campaign.hostedCampaign.onChainData.generateReport();
  if (Object.keys(errs).length > 0) {
    throw new utils.TypedError(
      400,
      'validation error',
      'INVALID_DATA', {
        onChainValidationErrors: errs
      },
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
    throw new utils.TypedError(403, 'the campaign is not in DRAFT or DEPLOYED status');
  }
};

Campaign.methods.makeDeployment = function (userAddress) {
  return this.hostedCampaign.getCampaignContract()
    .then(contract => {
      if (!contract) {
        throw new this.TypedError(500, 'error finding contract');
      }
      const rate = utils.stringRoundedOrUndefined(this.hostedCampaign.onChainData.rate);
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
  const sts = campaign.hostedCampaign.campaignStatus;
  if (sts !== 'REVIEWED' && sts !== 'PENDING_DEPLOYMENT') {
    throw new utils.TypedError(400, 'the campaign is not reviewed');
  }
  if (config.dev) {
    campaign.hostedCampaign.onChainData.startingTime = new Date(
      1000 * (new Date().getTime() / 1000 + 5 * 60)
    );
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
      version: this.hostedCampaign.onChainData.version
    });

    if (!contractJSON) {
      throw new utils.TypedError(500, 'cannot locate contract: ' + innerName);
    }

    return {
      address: await func.call({}),
      abi: contractJSON.abi
    };
  };

  const campaignContractJson = await this.hostedCampaign.getCampaignContract();
  const web3 = Networks.node(this.hostedCampaign.onChainData.network);
  const campaignContract = new web3.eth.Contract(
    JSON.parse(campaignContractJson.abi),
    campaignAddress
  );

  this.hostedCampaign.onChainData.campaignContract = campaignContract;

  if (this.hostedCampaign.onChainData.isMinted) {
    this.hostedCampaign.onChainData.tokenContract = await getInnerContract(
      'TrustFeedToken',
      campaignContract.methods.token()
    );
    this.hostedCampaign.onChainData.crowdsaleContract = await getInnerContract(
      'TrustFeedCrowdsale',
      campaignContract.methods.crowdsale()
    );
    this.hostedCampaign.onChainData.walletContract = await getInnerContract(
      'TrustFeedWallet',
      campaignContract.methods.wallet()
    );
  } else {
    this.hostedCampaign.onChainData.tokenContract = await getInnerContract(
      'TrustFeedMintableToken',
      campaignContract.methods.token()
    );
    this.hostedCampaign.onChainData.crowdsaleContract = await getInnerContract(
      'TrustFeedMintedCrowdsale',
      campaignContract.methods.crowdsale()
    );
    this.hostedCampaign.onChainData.walletContract = await getInnerContract(
      'TrustFeedWallet',
      campaignContract.methods.wallet()
    );
  }
  return this;
};

Campaign.statics.allPublic = async function (offset) {
  const pageSize = 20;
  let q = {
    $or: [{
        'hostedCampaign.campaignStatus': 'DEPLOYED'
      },
      {
        'hostedCampaign.campaignStatus': 'PENDING_OFF_CHAIN_REVIEW'
      },
      {
        externalCampaign: {
          $exists: true
        }
      }
    ]
  };
  if (offset) {
    q.updatedAt = {
      $lt: new Date(Number(Base64.decode(offset)))
    };
  }
  let cs = await this.find(q)
    .sort({
      updatedAt: 'desc'
    })
    .limit(pageSize)
    .exec();

  Promise.all(
    cs.map(c => {
      return c.updateWeiRaisedOlderThan();
    })
  ).catch(console.log);

  let nextOffset;
  if (cs.length === pageSize) {
    nextOffset = Base64.encode(cs[cs.length - 1].updatedAt.getTime());
  }
  return {
    campaigns: cs,
    next: nextOffset
  };
};

Campaign.statics.publicById = async function (campaignId) {
  let campaign = await this.findOne({
    $and: [{
        _id: campaignId
      },
      {
        $or: [{
            'hostedCampaign.campaignStatus': 'DEPLOYED'
          },
          {
            'hostedCampaign.campaignStatus': 'PENDING_OFF_CHAIN_REVIEW'
          },
          {
            externalCampaign: {
              $exists: true
            }
          }
        ]
      }
    ]
  }).exec();
  if (campaign) {
    campaign.updateWeiRaisedOlderThan().catch(console.log);
  }
  return campaign;
};

Campaign.methods.addWeiRaised = async function () {
  if (
    !this.hostedCampaign ||
    !this.hostedCampaign.onChainData ||
    !this.hostedCampaign.onChainData.network ||
    (this.hostedCampaign.campaignStatus !== 'DEPLOYED' &&
      this.hostedCampaign.campaignStatus !== 'PENDING_OFF_CHAIN_REVIEW') ||
    !this.hostedCampaign.onChainData.crowdsaleContract
  ) {
    return;
  }

  const w3 = Networks.node(this.hostedCampaign.onChainData.network);

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
    'hostedCampaign.onChainData.tokenContract.address': tokenAddress
  }).exec();

  if (!campaign) {
    throw new utils.TypedError(404, 'unknown campaign');
  }

  campaign = await campaign.addWeiRaised();
  campaign.updatedAt = Date.now();
  return campaign.save();
};

Campaign.statics.reviewPending = async function (offset) {
  const pageSize = 20;
  let q = {
    $or: [{
        'hostedCampaign.campaignStatus': 'PENDING_REVIEW'
      },
      {
        'hostedCampaign.campaignStatus': 'PENDING_OFF_CHAIN_REVIEW'
      }
    ]
  };
  if (offset) {
    q.updatedAt = {
      $lt: new Date(Number(Base64.decode(offset)))
    };
  }
  let cs = await this.find(q)
    .sort({
      createdAt: 1
    })
    .limit(pageSize)
    .exec();

  let nextOffset;
  if (cs.length === pageSize) {
    nextOffset = Base64.encode(cs[cs.length - 1].updatedAt.getTime());
  }
  return {
    campaigns: cs,
    next: nextOffset
  };
};

export default mongoose.model('Campaign', Campaign);
