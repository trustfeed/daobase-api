import Networks from './networks';
import User from './user';
import * as te from '../typedError';
import Campaign from './campaign';
import mongoose from 'mongoose';
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
});

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

Investment.statics.updateBalance = async function (network, token, publicAddress) {
  const w3 = await Networks.fastestNode(network);
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
  };

  const user = await User.findOne({ publicAddress }).exec();
  if (!user) {
    throw new te.TypedError(404, 'user not found');
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

module.exports = mongoose.model('Investment', Investment);
