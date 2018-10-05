import { injectable } from 'inversify';
import validate from 'validate.js';
import { TypedError } from '../utils';

export class OffChainData {
  createdAt: Date;
  keywords: string[];

  constructor(
    public coverImageURL?: string,
    public whitePaperURL?: string,
    public summary?: string,
    public description?: string,
    keywords?: string[]
  ) {
    if (keywords === null || keywords === undefined) {
      this.keywords = [];
    } else {
      this.keywords = keywords;
    }
    this.createdAt = new Date();
    validateData(this);
  }
}

export const validateData = (offChainData: OffChainData) => {
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
  let errs = validate(offChainData, constraints);
  if (errs === undefined) {
    errs = {};
  }

  if (Object.keys(errs).length > 0) {
    throw new TypedError(400, 'validation error', 'INVALID_DATA', {
      offChainValidationErrors: errs
    });
  }
};
