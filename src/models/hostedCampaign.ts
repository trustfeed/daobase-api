import { injectable } from 'inversify';
import * as onChain from './onChainData';
import * as offChain from './offChainData';
import { TypedError, stringRoundedOrUndefined } from '../utils';
import config from '../config';
import { ContractService } from '../services/contract';
import Web3 from 'web3';
import fs from 'fs';
import { DeployedContract } from './deployedContract';

@injectable()
export class HostedCampaign {
  public ownerId: string;
  public campaignStatus: string;
  public onChainData: onChain.OnChainData;
  public offChainData?: offChain.OffChainData;
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
    // this.offChainData = new offChain.OffChainData();
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

export const makeDeployment = async (
	hostedCampaign: HostedCampaign,
	userAddress: string,
	web3Service: any
  ) => {
  const sts = hostedCampaign.campaignStatus;
  if (sts !== 'REVIEWED' && sts !== 'PENDING_DEPLOYMENT') {
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
  return {
    transaction: deploy.encodeABI()
  };
};

// TODO: Shoudl this be moved this to onchaindata
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

    Web3.utils.toBN(hostedCampaign.onChainData.hardCap).mul(Web3.utils.toBN(rate)),

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
  hostedCampaign.onChainData.campaignContract = new DeployedContract(campaignJson.abi, campaignAddress);

  const tokenJson = await readTokenContractFromFile(hostedCampaign);
  const tokenAddress = await campaignContract.methods.token().call({});
  hostedCampaign.onChainData.tokenContract = new DeployedContract(tokenJson.abi, tokenAddress);

  const crowdsaleJson = await readCrowdsaleContractFromFile(hostedCampaign);
  const crowdsaleAddress = await campaignContract.methods.crowdsale().call({});
  hostedCampaign.onChainData.crowdsaleContract = new DeployedContract(crowdsaleJson.abi, crowdsaleAddress);

  const walletJson = await readWalletContractFromFile(hostedCampaign);
  const walletAddress = await campaignContract.methods.wallet().call({});
  hostedCampaign.onChainData.walletContract = new DeployedContract(walletJson.abi, walletAddress);
};
