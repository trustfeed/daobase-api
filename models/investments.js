import Networks from './networks';
import { Base64 } from 'js-base64';
import User from './user';
import * as te from '../typedError';
import Campaign from './campaign';
import mongoose from 'mongoose';
import Web3 from 'web3';
const Schema = mongoose.Schema;

const OwnedToken = new Schema({
  tokenAddress: String,
  tokensOwned: String,
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
  },
  tokenName: String,
  tokenSymbol: String,
  tokenDecimals: Number,
});

// TODO: Consider normalising the collection for sorting ease.
const Investment = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
    unique: true,
  },
  tokens: {
    type: [OwnedToken],
    default: [],
    required: true,
  },
});

Investment.statics.updateBalance = async function (
  network,
  token,
  publicAddress) {
  const w3 = await Networks.node(network);
  const abi = [
    {
      'constant': true,
      'inputs': [
        {
          'name': '_owner',
          'type': 'address',
        },
      ],
      'name': 'balanceOf',
      'outputs': [
        {
          'name': '',
          'type': 'uint256',
        },
      ],
      'payable': false,
      'stateMutability': 'view',
      'type': 'function',
    },
  ];
  const cont = new w3.eth.Contract(abi, token);
  const balance = await cont.methods.balanceOf(publicAddress).call();
  const campaign = await Campaign.findOne({
    'hostedCampaign.onChainData.tokenContract.address': token,
  });
  let ownedToken = { tokenAddress: token, tokensOwned: balance };
  if (campaign) {
    ownedToken.campaignId = campaign._id;
    ownedToken.tokenName = campaign.hostedCampaign.onChainData.tokenName;
    ownedToken.tokenSymbol = campaign.hostedCampaign.onChainData.tokenSymbol;
    ownedToken.tokenDecimals = campaign.hostedCampaign.onChainData.numberOfDecimals;
  } else {
    return true;
  }

  const user = await User.findOne({ publicAddress }).exec();
  if (!user) {
    throw new te.TypedError(404, `user not found (${publicAddress})`);
  }

  let investments = await this.findOne({ user: user._id }).exec();
  if (!investments) {
    investments = this({
      user: user._id,
      tokens: [],
    });
  }
  investments.tokens = investments.tokens.filter(x => x.tokenAddress !== token);
  if (ownedToken.tokensOwned !== '0') {
    investments.tokens.push(ownedToken);
  }
  return investments.save();
};

Investment.statics.byUser = async function (user, order, offset) {
  const pageSize = 20;
  let investments = await this.findOne({ user });
  if (!investments) {
    return { tokens: [] };
  }

  let tokens = investments.tokens;

  if (offset) {
    offset = this.decodeOffset(offset);
  } else {
    offset = 0;
  }

  switch (order) {
  case 'symbol':
    tokens
      .sort((x, y) => {
        if (x.tokenSymbol === y.tokenSymbol) {
          return x._id > y._id;
        } else {
          return x.tokenSymbol > y.tokenSymbol;
        }
      });
    break;
  case 'name':
    tokens
      .sort((x, y) => {
        if (x.tokenName === y.tokenName) {
          return x._id > y._id;
        } else {
          return x.tokenName > y.tokenName;
        }
      });
    break;
  case 'owned':
    tokens
      .sort((x, y) => {
        if (x.tokensOwned === y.tokensOwned) {
          return x._id > y._id;
        } else {
          return Web3.utils.toBN(x.tokensOwned).gt(Web3.utils.toBN(y.tokensOwned));
        }
      });
    break;
  default:
    throw new te.TypedError(401, 'unknown order');
  }

  tokens = tokens.slice(offset, offset + pageSize);

  let nextOffset;
  if (tokens.length === pageSize) {
    nextOffset = Base64.encode(offset + pageSize);
  }
  return { tokens, nextOffset };
};

module.exports = mongoose.model('Investment', Investment);
