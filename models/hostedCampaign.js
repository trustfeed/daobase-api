import OnChainData from './onChainData';
import OffChainData from './offChainData';
import mongoose from 'mongoose';
import Contract from './contract';
const Schema = mongoose.Schema;

// A campaign that is hosted by TrustFeed
const HostedCampaign = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
  },
  campaignStatus: {
    type: String,
    enum: [
      'DRAFT',
      'PENDING_REVIEW',
      'REVIEWED',
      'PENDING_DEPLOYMENT',
      'DEPLOYED',
      'PENDING_OFF_CHAIN_REVIEW',
    ],
    required: true,
    default: ['DRAFT'],
  },
  onChainData: {
    type: OnChainData,
    required: true,
  },
  offChainData: {
    type: OffChainData,
    required: true,
  },
  offChainDataDraft: OffChainData,
});

// Get the contract describing the campaign
HostedCampaign.methods.getCampaignContract = function () {
  let name = 'TrustFeedCampaign';
  if (this.onChainData.isMinted) {
    name = 'TrustFeedMintedCampaign';
  }

  return Contract.findOne({
    name,
    version: this.onChainData.version,
  }).exec();
};

export default HostedCampaign;
