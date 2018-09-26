import mongoose from 'mongoose';
import validate from 'validate.js';
const Schema = mongoose.Schema;

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

export default OffChainData;
