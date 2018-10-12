import { injectable } from 'inversify';
import { DeployedContract } from './deployedContract';
import validate from 'validate.js';
import config from '../config';
import { TypedError, stringToBNOrUndefined, stringRoundedOrUndefined } from '../utils';

export class OnChainData {
  public createdAt: Date;
  public startingTime: Date;
  public version: string;
  public tokenContract?: DeployedContract;
  public crowdsaleContract?: DeployedContract;
  public walletContract?: DeployedContract;
  public weiRaised?: string;
  public _id?: string;

  constructor(
    public tokenName: string,
    public tokenSymbol: string,
    public numberOfDecimals: number,
    startingTime: number,
    public duration: number,
    public rate: string,
    public softCap: string,
    public hardCap: string,
    public isMinted: boolean,
    version?: string
  ) {
    this.createdAt = new Date();
    this.startingTime = new Date(startingTime * 1000);
    if (version != null) {
      this.version = version;
    } else {
      this.version = '1.0.0';
    }

    validateData(this);
  }
}

// Throws an error if data is invalid
export const validateData = (onChainData: OnChainData) => {
  const constraints = {
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
        greaterThan: 0
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
      inclusion: ['0.0.0', '1.0.0']
    }
  };
  let errs = validate(onChainData, constraints);
  if (errs === undefined) {
    errs = {};
  }

  let tomorrow: any;
  if (config.dev) {
    const tomorrow = Date.now() + 1000 * 60 * 15;
  } else {
    const tomorrow = Date.now() + 1000 * 60 * 60 * 24;
  }
  const startingTime = onChainData.startingTime;
  if (!config.dev && startingTime && startingTime.getTime() < tomorrow) {
    const msg = 'Starting time must be at least one day into the future';
    if (errs.startingTime) {
      errs.startingTime.push(msg);
    } else {
      errs.startingTime = [msg];
    }
  }

  const softCap = stringToBNOrUndefined(onChainData.softCap);
  if (!softCap || softCap < 0) {
    const msg = 'Soft cap must be an integer larger than or equal to 0';
    if (errs.softCap) {
      errs.softCap.push(msg);
    } else {
      errs.softCap = [msg];
    }
  }

  const hardCap = stringToBNOrUndefined(onChainData.hardCap);
  if (!hardCap || (softCap && hardCap.lt(softCap))) {
    const msg = 'Hard cap must be an integer greater than soft cap';
    if (errs.hardCap) {
      errs.hardCap.push(msg);
    } else {
      errs.hardCap = [msg];
    }
  }

  const rate = stringRoundedOrUndefined(onChainData.rate);
  if (!rate || rate < 1) {
    const msg = 'rate must be larger than 0';
    if (errs.rate) {
      errs.rate.push(msg);
    } else {
      errs.rate = [msg];
    }
  }

  if (Object.keys(errs).length > 0) {
    throw new TypedError(400, 'validation error', 'INVALID_DATA', {
      onChainValidationErrors: errs
    });
  }
};
