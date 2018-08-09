const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Campaign = new Schema({
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
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
});

export default Campaign;
