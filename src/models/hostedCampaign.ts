import { injectable } from 'inversify';
import * as onChain from './onChainData';
import * as offChain from './offChainData';
import { TypedError, stringRoundedOrUndefined } from '../utils';
import config from '../config';
import Web3 from 'web3';
import fs from 'fs';
import { DeployedContract } from './deployedContract';
import { Note } from './note';

export const HOSTED_CAMPAIGN_STATUS_DRAFT = 'DRAFT';
export const HOSTED_CAMPAIGN_STATUS_PENDING_REVIEW = 'PENDING_REVIEW';
export const HOSTED_CAMPAIGN_STATUS_REVIEWED = 'REVIEWED';
export const HOSTED_CAMPAIGN_STATUS_PENDING_DEPLOYMENT = 'PENDING_DEPLOYMENT';
export const HOSTED_CAMPAIGN_STATUS_DEPLOYED = 'DEPLOYED';
export const HOSTED_CAMPAIGN_STATUS_PENDING_OFF_CHAIN_REVIEW = 'PENDING_OFF_CHAIN_REVIEW';

export class HostedCampaign {
  public ownerId: string;
  public campaignStatus: string;
  public onChainData: onChain.OnChainData;
  public offChainData?: offChain.OffChainData;
  public createdAt: Date;
  public updatedAt: Date;
  public type: string;
  public offChainDataDraft?: any;
  public notes?: Note[];
  public _id?: string;

  constructor(
    ownerId: string,
    onChainData: onChain.OnChainData
  ) {
    this.ownerId = ownerId;
    this.campaignStatus = HOSTED_CAMPAIGN_STATUS_DRAFT;
    this.onChainData = onChainData;
    // this.offChainData = new offChain.OffChainData();
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.type = 'hostedCampaign';
    this.notes = [];
  }
}

// Throws an error if the hosted campaign contains configuration errors
export const validate = (hostedCampaign: HostedCampaign) => {
  onChain.validateData(hostedCampaign.onChainData);
  offChain.validateData(hostedCampaign.offChainData);
};

export const submitForReview = (hostedCampaign: HostedCampaign): HostedCampaign => {
  if (hostedCampaign.campaignStatus === HOSTED_CAMPAIGN_STATUS_DRAFT) {
    validate(hostedCampaign);
    hostedCampaign.campaignStatus = HOSTED_CAMPAIGN_STATUS_PENDING_REVIEW;
    hostedCampaign.updatedAt = new Date();
    return hostedCampaign;
  } else if (hostedCampaign.campaignStatus === HOSTED_CAMPAIGN_STATUS_DEPLOYED) {
    const draft = hostedCampaign.offChainDataDraft;
    const offChainErrs = offChain.validateData(draft);
    hostedCampaign.campaignStatus = HOSTED_CAMPAIGN_STATUS_PENDING_OFF_CHAIN_REVIEW;
    hostedCampaign.updatedAt = new Date();
    return hostedCampaign;
  } else {
    throw new TypedError(400, 'the campaign is not a draft');
  }
};

export const reviewAccepted = (hostedCampaign: HostedCampaign): HostedCampaign => {
  if (hostedCampaign.campaignStatus === HOSTED_CAMPAIGN_STATUS_PENDING_REVIEW) {
    hostedCampaign.campaignStatus = HOSTED_CAMPAIGN_STATUS_REVIEWED;
    hostedCampaign.updatedAt = new Date();
    return hostedCampaign;
  } else if (hostedCampaign.campaignStatus === HOSTED_CAMPAIGN_STATUS_PENDING_REVIEW) {
    hostedCampaign.campaignStatus = HOSTED_CAMPAIGN_STATUS_DEPLOYED;
    hostedCampaign.offChainData = hostedCampaign.offChainDataDraft;
    hostedCampaign.updatedAt = new Date();
    return hostedCampaign;
  } else {
    throw new TypedError(400, 'the campaign is not pending review');
  }
};

export const reviewFailed = (hostedCampaign: HostedCampaign, note: string): HostedCampaign => {
  if (hostedCampaign.campaignStatus === HOSTED_CAMPAIGN_STATUS_PENDING_REVIEW) {
    hostedCampaign.campaignStatus = HOSTED_CAMPAIGN_STATUS_DRAFT;
    hostedCampaign.notes.push(new Note(note));
    hostedCampaign.updatedAt = new Date();
    return hostedCampaign;
  } else if (hostedCampaign.campaignStatus === HOSTED_CAMPAIGN_STATUS_PENDING_REVIEW) {
    hostedCampaign.campaignStatus = HOSTED_CAMPAIGN_STATUS_DEPLOYED;
    hostedCampaign.notes.push(new Note(note));
    hostedCampaign.updatedAt = new Date();
    return hostedCampaign;
  } else {
    throw new TypedError(400, 'the campaign is not pending review');
  }
};

export const cancelReview = (hostedCampaign: HostedCampaign): HostedCampaign => {
  const campaignStatus = hostedCampaign.campaignStatus;
  if (
    campaignStatus === HOSTED_CAMPAIGN_STATUS_PENDING_REVIEW ||
    campaignStatus === HOSTED_CAMPAIGN_STATUS_REVIEWED) {
    hostedCampaign.campaignStatus = HOSTED_CAMPAIGN_STATUS_DRAFT;
    hostedCampaign.updatedAt = new Date();
    return hostedCampaign;
  } else if (campaignStatus === HOSTED_CAMPAIGN_STATUS_PENDING_OFF_CHAIN_REVIEW) {
    hostedCampaign.campaignStatus = HOSTED_CAMPAIGN_STATUS_DEPLOYED;
    hostedCampaign.updatedAt = new Date();
    return hostedCampaign;
  } else {
    throw new TypedError(
      400,
      'the campaign is not pending review, reviewed or pending off chain review'
    );
  }
};

export const makeDeployment = async (
        hostedCampaign: HostedCampaign,
        userAddress: string,
        web3Service: any
  ) => {
  const sts = hostedCampaign.campaignStatus;
  if (sts !== HOSTED_CAMPAIGN_STATUS_REVIEWED &&
      sts !== HOSTED_CAMPAIGN_STATUS_PENDING_DEPLOYMENT) {
    throw new TypedError(400, 'the campaign is not reviewed');
  }
  const contractJSON = await readCampaignContractFromFile(hostedCampaign);
  let args = hostedCampaign.onChainData.isMinted ?
               mintedConstructorArgs(hostedCampaign, userAddress) :
               nonMintedConstructorArgs(hostedCampaign, userAddress);

  const contract = web3Service.createContract(contractJSON.abi);
  const deploy = contract.deploy({
    data: contractJSON.bytecode,
    arguments: args
  });
  hostedCampaign.campaignStatus = HOSTED_CAMPAIGN_STATUS_PENDING_DEPLOYMENT;
  return {
    transaction: deploy.encodeABI()
  };
};

// TODO: Should this be moved this to onChainData model?
const readContractFromFile = async(name: string, version: string) => {
  return new Promise<any>((resolve, reject) => {
    fs.readFile(
      `./contracts/v${version}/${name}.json`,
      `utf8`,
      (err, cont) => {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(cont));
        }
      });
  });
};

const readCampaignContractFromFile = async (hostedCampaign: HostedCampaign) => {
  let name = 'TrustFeedCampaign';
  if (hostedCampaign.onChainData.isMinted) {
    name = 'TrustFeedMintedCampaign';
  }
  return readContractFromFile(name, hostedCampaign.onChainData.version);
};

const readTokenContractFromFile = async (hostedCampaign: HostedCampaign) => {
  let name = 'TrustFeedToken';
  if (hostedCampaign.onChainData.isMinted) {
    name = 'TrustFeedMintableToken';
  }
  return readContractFromFile(name, hostedCampaign.onChainData.version);
};

const readCrowdsaleContractFromFile = async (hostedCampaign: HostedCampaign) => {
  let name = 'TrustFeedCrowdsale';
  if (hostedCampaign.onChainData.isMinted) {
    name = 'TrustFeedMintedCrowdsale';
  }
  return readContractFromFile(name, hostedCampaign.onChainData.version);
};

const readWalletContractFromFile = async (hostedCampaign: HostedCampaign) => {
  let name = 'TrustFeedWallet';
  return readContractFromFile(name, hostedCampaign.onChainData.version);
};

const mintedConstructorArgs = (hostedCampaign, userAddress) => {
  const rate = stringRoundedOrUndefined(hostedCampaign.onChainData.rate);
  const startTime = hostedCampaign.onChainData.startingTime.getTime() / 1000;
  return [
    [config.trustfeedAddress, userAddress],
    hostedCampaign.onChainData.tokenName,
    hostedCampaign.onChainData.tokenSymbol,
    hostedCampaign.onChainData.numberOfDecimals,

    startTime,
    startTime + hostedCampaign.onChainData.duration * 60 * 60 * 24,

    rate,
    hostedCampaign.onChainData.hardCap,
    hostedCampaign.onChainData.softCap,
    hostedCampaign._id.toString()
  ];
};

const nonMintedConstructorArgs = (hostedCampaign, userAddress) => {
  const rate = stringRoundedOrUndefined(hostedCampaign.onChainData.rate);
  const startTime = hostedCampaign.onChainData.startingTime.getTime() / 1000;
  return [
    [config.trustfeedAddress, userAddress],
    hostedCampaign.onChainData.tokenName,
    hostedCampaign.onChainData.tokenSymbol,
    hostedCampaign.onChainData.numberOfDecimals,

    Web3.utils.toBN(hostedCampaign.onChainData.hardCap).mul(Web3.utils.toBN(rate)).toString(),

    startTime,
    startTime + hostedCampaign.onChainData.duration * 60 * 60 * 24,

    rate,
    hostedCampaign.onChainData.hardCap,
    hostedCampaign.onChainData.softCap,
    hostedCampaign._id.toString()
  ];
};

export const fetchContracts = async (hostedCampaign, campaignAddress, web3Service) => {
  const campaignJson = await readCampaignContractFromFile(hostedCampaign);
  const campaignContract = web3Service.createContract(
    campaignJson.abi,
    campaignAddress
  );
  hostedCampaign.onChainData.campaignContract = new DeployedContract(campaignAddress, campaignJson.abi);

  const tokenJson = await readTokenContractFromFile(hostedCampaign);
  const tokenAddress = await campaignContract.methods.token().call({});
  hostedCampaign.onChainData.tokenContract = new DeployedContract(tokenAddress, tokenJson.abi);

  const crowdsaleJson = await readCrowdsaleContractFromFile(hostedCampaign);
  const crowdsaleAddress = await campaignContract.methods.crowdsale().call({});
  hostedCampaign.onChainData.crowdsaleContract = new DeployedContract(crowdsaleAddress, crowdsaleJson.abi);

  const walletJson = await readWalletContractFromFile(hostedCampaign);
  const walletAddress = await campaignContract.methods.wallet().call({});
  hostedCampaign.onChainData.walletContract = new DeployedContract(walletAddress, walletJson.abi);
};

export const updateWeiRaised = async (hostedCampaign, web3Service) => {
  if (!hostedCampaign ||
     !hostedCampaign.onChainData ||
     !hostedCampaign.onChainData.crowdsaleContract ||
     !hostedCampaign.onChainData.crowdsaleContract.abi ||
     !hostedCampaign.onChainData.crowdsaleContract.address) {
	  return hostedCampaign;
  }
  // Get the crowdsale contract
  const crowdsaleContract = web3Service.createContract(
    hostedCampaign.onChainData.crowdsaleContract.abi,
    hostedCampaign.onChainData.crowdsaleContract.address
  );
  // Call wei raised
  const weiRaised = await crowdsaleContract.methods.weiRaised().call();
  hostedCampaign.onChainData.weiRaised = weiRaised;
  return hostedCampaign;
};

export const updateOnChainData = (hostedCampaign, onChainData) => {
  if (hostedCampaign.campaignStatus === HOSTED_CAMPAIGN_STATUS_DRAFT) {
    hostedCampaign.onChainData = onChainData;
    return hostedCampaign;
  } else {
    throw new TypedError(400, 'campaign is not DRAFT');
  }
};

export const updateOffChainData = (hostedCampaign, offChainData) => {
  if (hostedCampaign.campaignStatus === HOSTED_CAMPAIGN_STATUS_DRAFT) {
    hostedCampaign.offChainData = offChainData;
    return hostedCampaign;
  } else if (hostedCampaign.campaignStatus === HOSTED_CAMPAIGN_STATUS_DEPLOYED) {
    hostedCampaign.offChainDataDraft = offChainData;
    return hostedCampaign;
  } else {
    throw new TypedError(400, 'campaign is not DRAFT or DEPLOYED');
  }
};

export const isDeployed = (hostedCampaign: HostedCampaign): boolean => {
  return (hostedCampaign.campaignStatus === HOSTED_CAMPAIGN_STATUS_DEPLOYED ||
	  hostedCampaign.campaignStatus === HOSTED_CAMPAIGN_STATUS_PENDING_OFF_CHAIN_REVIEW);
};

export const isOngoing = (hostedCampaign: HostedCampaign): boolean => {
  if (!isDeployed(hostedCampaign)) {
	  return false;
  }
  const nw = new Date();
  const startingTime = hostedCampaign.onChainData.startingTime;
  const duration = hostedCampaign.onChainData.duration * 1000 * 60 * 60 * 24;
  return (nw > startingTime &&
	  nw.getTime() < startingTime.getTime() + duration);
};
