import { injectable } from 'inversify';
import * as onChain from './onChainData';
import * as offChain from './offChainData';
import { TypedError, stringRoundedOrUndefined } from '../utils';
import config from '../config';
import { ContractService } from '../services/contract';
import Web3 from 'web3';

@injectable()
export class HostedCampaign {
  public ownerId: string;
  public campaignStatus: string;
  public onChainData: onChain.OnChainData;
  public offChainData: offChain.OffChainData;
  public createdAt: Date;
  public updatedAt: Date;
  public type: string;
  public offChainDataDraft?: any;
  public _id?: string;

  constructor(
    ownerId: string,
    onChainData: onChain.OnChainData
  ) {
    this.ownerId = ownerId;
    this.campaignStatus = 'DRAFT';
    this.onChainData = onChainData;
    this.offChainData = new offChain.OffChainData();
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.type = 'hostedCampaign';
  }
}

// Throws an error if the hosted campaign contains configuration errors
export const validate = (hostedCampaign: HostedCampaign) => {
  onChain.validateData(hostedCampaign.onChainData);
  offChain.validateData(hostedCampaign.offChainData);
};

export const submitForReview = (hostedCampaign: HostedCampaign): HostedCampaign => {
  if (hostedCampaign.campaignStatus === 'DRAFT') {
    validate(hostedCampaign);
    hostedCampaign.campaignStatus = 'PENDING_REVIEW';
    hostedCampaign.updatedAt = new Date();
    return hostedCampaign;
  } else if (hostedCampaign.campaignStatus === 'DEPLOYED') {
    const draft = hostedCampaign.offChainDataDraft;
    const offChainErrs = offChain.validateData(draft);
    hostedCampaign.campaignStatus = 'PENDING_OFF_CHAIN_REVIEW';
    hostedCampaign.updatedAt = new Date();
    return hostedCampaign;
  } else {
    throw new TypedError(400, 'the campaign is not a draft');
  }
};

export const reviewAccepted = (hostedCampaign: HostedCampaign): HostedCampaign => {
  if (hostedCampaign.campaignStatus === 'PENDING_REVIEW') {
    hostedCampaign.campaignStatus = 'REVIEWED';
    hostedCampaign.updatedAt = new Date();
    return hostedCampaign;
  } else if (hostedCampaign.campaignStatus === 'PENDING_OFF_CHAIN_REVIEW') {
    hostedCampaign.campaignStatus = 'DEPLOYED';
    hostedCampaign.offChainData = hostedCampaign.offChainDataDraft;
    hostedCampaign.updatedAt = new Date();
    return hostedCampaign;
  } else {
    throw new TypedError(400, 'the campaign is not pending review');
  }
};

export const cancelReview = (hostedCampaign: HostedCampaign): HostedCampaign => {
  const campaignStatus = hostedCampaign.campaignStatus;
  if (campaignStatus === 'PENDING_REVIEW' || campaignStatus === 'REVIEWED') {
    hostedCampaign.campaignStatus = 'DRAFT';
    hostedCampaign.updatedAt = new Date();
    return hostedCampaign;
  } else if (campaignStatus === 'PENDING_OFF_CHAIN_REVIEW') {
    hostedCampaign.campaignStatus = 'DEPLOYED';
    hostedCampaign.updatedAt = new Date();
    return hostedCampaign;
  } else {
    throw new TypedError(
      400,
      'the campaign is not pending review, reviewed or pending off chain review'
    );
  }
};

// const getCampaignContract = async(
//  hostedCampaign: HostedCampaign,
//  contractService: ContractService
// ) => {
//
//  let name = 'TrustFeedCampaign';
//  if (hostedCampaign.onChainData.isMinted) {
//    name = 'TrustFeedMintedCampaign';
//  }
//
//  return contractService.findByNameVersion(name, hostedCampaign.onChainData.version);
// };
//
// const mintedConstructorArgs = (hostedCampaign, userAddress) => {
//  const rate = stringRoundedOrUndefined(hostedCampaign.onChainData.rate);
//  const startTime = hostedCampaign.onChainData.startingTime.getTime() / 1000;
//  return [
//    [config.trustfeedAddress, userAddress],
//    hostedCampaign.onChainData.tokenName,
//    hostedCampaign.onChainData.tokenSymbol,
//    hostedCampaign.onChainData.numberOfDecimals,
//
//    startTime,
//    startTime + hostedCampaign.onChainData.duration * 60 * 60 * 24,
//
//    rate,
//    hostedCampaign.onChainData.hardCap,
//    hostedCampaign.onChainData.softCap,
//    hostedCampaign._id.toString(),
//    // TODO: Get rid of the broadcaster contract
//    '0xB900F568D3F54b5DE594B7968e68181fC45fCAc6'
//  ];
// };
//
// const nonMintedConstructorArgs = (hostedCampaign, userAddress) => {
//  const rate = stringRoundedOrUndefined(hostedCampaign.onChainData.rate);
//  const startTime = hostedCampaign.onChainData.startingTime.getTime() / 1000;
//  return [
//    [config.trustfeedAddress, userAddress],
//    hostedCampaign.onChainData.tokenName,
//    hostedCampaign.onChainData.tokenSymbol,
//    hostedCampaign.onChainData.numberOfDecimals,
//
//    Web3.utils.toBN(hostedCampaign.onChainData.hardCap).mul(Web3.utils.toBN(rate)),
//
//    startTime,
//    startTime + hostedCampaign.onChainData.duration * 60 * 60 * 24,
//
//    rate,
//    hostedCampaign.onChainData.hardCap,
//    hostedCampaign.onChainData.softCap,
//    hostedCampaign._id.toString(),
//    // TODO: different networks
//    '0xB900F568D3F54b5DE594B7968e68181fC45fCAc6'
//  ];
// };
//
// export const deploymentTransaction = async (
//  hostedCampaign: HostedCampaign,
//  userAddress: string,
//  contractService: ContractService
// ) => {
//  const sts = hostedCampaign.campaignStatus;
//  if (sts !== 'REVIEWED' && sts !== 'PENDING_DEPLOYMENT') {
//    throw new TypedError(400, 'the campaign is not reviewed');
//  }
//  if (config.dev) {
//    hostedCampaign.onChainData.startingTime = new Date(
//      1000 * (new Date().getTime() / 1000 + 5 * 60)
//    );
//  }
//  const contract = await getCampaignContract(hostedCampaign, contractService);
//  let args = this.hostedCampaign.onChainData.isMinted ?
// 	     mintedConstructorArgs(hostedCampaign, userAddress) :
// 	     nonMintedConstructorArgs(hostedCampaign, userAddress);
////    return contract.makeDeployment(this.hostedCampaign.onChainData.network, args);
////  });
// };

//// Get the contract describing the campaign
// HostedCampaign.methods.getCampaignContract = function() {
//  let name = 'TrustFeedCampaign';
//  if (this.onChainData.isMinted) {
//    name = 'TrustFeedMintedCampaign';
//  }
//
//  return Contract.findOne({
//    name,
//    version: this.onChainData.version
//  }).exec();
// };
//
// export default HostedCampaign;
