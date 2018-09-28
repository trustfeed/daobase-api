import { injectable } from 'inversify';
import { DeployedContract } from './deployedContract';
import Web3 from 'web3';
import validate from 'validate.js';
import config from '../config';
import { stringToBNOrUndefined, stringRoundedOrUndefined } from '../utils';

@injectable()
export class OffChainData {
  coverImageURL?: string;
  whitePaperURL?: string;
  summary?: string;
  keywords: string[];

  constructor() {
    this.keywords = [];
  }
}

export const generateReport = (offChainData: OffChainData): any => {
  const constraints = {
    coverImageURL: {
      presence: true,
      url: true
    },
    whitePaperURL: {
      presence: true,
      url: true
    }
  };
  let errs = validate(this, constraints);
  if (errs === undefined) {
    errs = {};
  }
  return errs;
};
