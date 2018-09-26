import mongoose from 'mongoose';
import config from '../config';
import validate from 'validate.js';
import * as utils from '../utils';
const Web3 = require('web3');
const Schema = mongoose.Schema;

// A contract that is deployed on a network
const DeployedContract = new Schema({
  address: {
    type: String
  },
  abi: {
    type: String,
    required: true
  }
});

// The on-chain data that can only be modified during DRAFT
const OnChainData = new Schema({
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  network: {
    type: String,
    enum: ['rinkeby'],
    required: true,
    default: ['rinkeby']
  },
  tokenName: {
    type: String
  },
  tokenSymbol: {
    type: String
  },
  numberOfDecimals: {
    type: Number
  },
  startingTime: {
    type: Date
  },
  duration: {
    type: Number
  },
  rate: {
    type: String
  },
  softCap: {
    type: String
  },
  hardCap: {
    type: String
  },
  isMinted: {
    type: Boolean,
    default: false
  },
  version: {
    type: String,
    enum: ['0.0.0'],
    required: true,
    default: ['0.0.0']
  },
  tokenContract: {
    type: DeployedContract,
    required: false
  },
  crowdsaleContract: {
    type: DeployedContract,
    required: false
  },
  walletContract: {
    type: DeployedContract,
    required: false
  },
  weiRaised: {
    type: String,
    required: false
  }
});

const stringToBNOrUndefined = s => {
  try {
    return Web3.utils.toBN(s);
  } catch (err) {
    return undefined;
  }
};

OnChainData.methods.generateReport = function() {
  const constraints = {
    network: {
      presence: true,
      inclusion: ['rinkeby']
    },
    tokenName: {
      presence: true
    },
    tokenSymbol: {
      presence: true
    },
    numberOfDecimals: {
      presence: true,
      numericality: {
        noStrings: true,
        greaterThanOrEqualTo: 0,
        lessThanOrEqualTo: 18
      }
    },
    startingTime: {
      presence: true
    },
    duration: {
      presence: true,
      numericality: {
        noStrings: true,
        greaterThanOrEqualTo: 1
      }
    },
    rate: {
      presence: true
    },
    softCap: {
      presence: true
    },
    hardCap: {
      presence: true
    },
    isMinted: {
      presence: true
    },
    version: {
      presence: true,
      inclusion: ['0.0.0']
    }
  };
  let errs = validate(this, constraints);
  if (errs === undefined) {
    errs = {};
  }

  const tomorrow = Date.now() + 1000 * 60 * 60 * 24;
  const startingTime = this.startingTime;
  if (!config.dev && startingTime && startingTime.getTime() < tomorrow) {
    const msg = 'Starting time must be at least one day into the future';
    if (errs.startingTime) {
      errs.startingTime.push(msg);
    } else {
      errs.startingTime = [msg];
    }
  }

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

  const rate = utils.stringRoundedOrUndefined(this.rate);
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

export default OnChainData;
