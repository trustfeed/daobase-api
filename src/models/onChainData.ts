import { injectable } from 'inversify';
import { DeployedContract } from './deployedContract';
import Web3 from 'web3';
import validate from 'validate.js';
import config from '../config';
import { stringToBNOrUndefined, stringRoundedOrUndefined } from '../utils';

@injectable()
export class OnChainData {
  public createdAt: Date;
  public network: string;
  public tokenName: string;
  public tokenSymbol: string;
  public numberOfDecimals: number;
  public startingTime: Date;
  public duration: number;
  public rate: string;
  public softCap: string;
  public hardCap: string;
  public isMinted: boolean;
  public version: string;
  public tokenContract?: DeployedContract;
  public crowdsaleContract?: DeployedContract;
  public walletContract?: DeployedContract;
  public weiRaised?: string;
  public _id?: string;

  constructor(
    network: string,
    tokenName: string,
    tokenSymbol: string,
    numberOfDecimals: number,
    startingTime: Date,
    duration: number,
    rate: string,
    softCap: string,
    hardCap: string,
    isMinted: boolean,
    version?: string
  ) {
    this.createdAt = new Date();
    this.network = network;
    this.tokenName = tokenName;
    this.tokenSymbol = tokenSymbol;
    this.numberOfDecimals = numberOfDecimals;
    this.startingTime = startingTime;
    this.duration = duration;
    this.rate = rate;
    this.softCap = softCap;
    this.hardCap = hardCap;
    this.isMinted = isMinted;
    if (version != null) {
      this.version = version;
    } else {
      this.version = '0.0.0';
    }
  }
}

export const generateReport = (onChainData: OnChainData): any => {
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
