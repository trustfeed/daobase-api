import { inject, injectable } from 'inversify';
import { EventWatcher } from './eventWatcher';
import Web3 from 'web3';
import config from '../config';
import { UserService } from '../services/user';
import { HostedCampaignService } from '../services/hostedCampaign';
import { InvestmentService } from '../services/investment';
import { Web3Service } from '../services/web3';
import TYPES from '../constant/types';
import * as hc from '../models/hostedCampaign';
import { Investment } from '../models/investment';
import fs from 'fs';

const topics = [
  Web3.utils.sha3('Confirmation(address,uint256)')
];

const topicToAddress = topic => {
  if (topic && topic.length >= 40) {
    return '0x' + topic.substring(topic.length - 40);
  } else {
    return undefined;
  }
};

const topicToInt = topic => {
  try {
    return Web3.utils.toBN(topic).toString();
  } catch (err) {
    return undefined;
  }
};

@injectable()
export class ConfirmationWatcher extends EventWatcher {

  private async checkTransaction(contract, idx, expectedTransaction) {
    const actualTransaction = await contract.methods.transactions(idx).call();
    if (!actualTransaction) {
      console.log('invalid index');
      return false;
    } else if (
      actualTransaction.destination !== expectedTransaction.destination ||
      actualTransaction.data !== expectedTransaction.data ||
      actualTransaction.executed !== expectedTransaction.executed
    ) {
      console.log('data does not match');
      return false;
    } else {
      return true;
    }
  }

  // Map the wallet address to campaign id
  private walletAddresses: any = {};
  // TODO: Put this data into mongo to prevent re-crawling on every restart
  private scrapedTo = 1;
  private chunckSize = 10000;

  constructor(
    @inject(TYPES.Web3Service) private web3Service: Web3Service,
    @inject(TYPES.HostedCampaignService) private hostedCampaignService: HostedCampaignService
  ) {
    super();

    this.hostedCampaignService.forEach(campaign => {
      this.addCampaign(campaign);
    });
  }

  private async checkExpected(campaign, wallet, topics) {
    const expectedTransaction = hc.getFinaliseTransaction(campaign, this.web3Service);
    const idx = topicToInt(topics[2]);
    if (!idx) {
      console.log('invalid index');
      return;
    }
    if (!await this.checkTransaction(wallet, idx, expectedTransaction)) {
      return;
    }
    campaign.campaignStatus = hc.HOSTED_CAMPAIGN_STATUS_PENDING_FINALISATION_CONFIRMATION;
    campaign.finalisationIndex = idx;
    await this.hostedCampaignService.update(campaign);
  }

  public async addCampaign(campaign) {
    if (campaign.onChainData.walletContract === null ||
        campaign.onChainData.walletContract === undefined) {
      return;
    }
    this.walletAddresses[campaign.onChainData.walletContract.address] = campaign._id;
    if (campaign.campaignStatus !== hc.HOSTED_CAMPAIGN_STATUS_PENDING_FINALISATION_SUBMISSION) {
      return;
    }
    // check all events from this wallet to check for a confirmation
    const contractJSON = campaign.onChainData.walletContract;
    const contract = this.web3Service.createContract(contractJSON.abi, contractJSON.address);
    contract.events.Confirmation()
      .on('data', (event) => {
        this.checkExpected(campaign, contract, event.raw.topic);
      });
  }

  // Handles a new log event, updating the db if needed
  protected async processEvent(log: any): Promise<void> {
    if (!log || !log.address) {
      return;
    }

    const walletAddress = log.address;
    let campaign = await this.lookupCampaign(walletAddress);
    if (!campaign) {
      console.log('unkown campaign');
      return;
    }

    // acknowledge the finalisation request
    if (campaign.campaignStatus !== hc.HOSTED_CAMPAIGN_STATUS_PENDING_FINALISATION_SUBMISSION) {
      console.log('not awaiting finalisation');
      return;
    }
    const expectedTransaction = hc.getFinaliseTransaction(campaign, this.web3Service);

    if (campaign.onChainData.walletContract === null ||
        campaign.onChainData.walletContract === undefined) {
      return;
    }
    const contractJSON = campaign.onChainData.walletContract;
    const contract = this.web3Service.createContract(contractJSON.abi, contractJSON.address);
    this.checkExpected(campaign, contract, log.topics);
  }

  // After a connection is established listen for new events
  protected async startWatching(): Promise<any> {
    this.crawl();
    return this.web3.eth.subscribe(
      'logs',
      {
        topics: [ Web3.utils.sha3('Confirmation(address,uint256)')]
      }
    );
  }

  private async crawl() {
    while (this.scrapedTo < (await this.web3.eth.getBlockNumber())) {
      let to = Math.min(
        this.scrapedTo + this.chunckSize,
	await this.web3.eth.getBlockNumber());

      let logs = await this.web3.eth.getPastLogs({
        fromBlock: this.web3.utils.toHex(this.scrapedTo),
        toBlock: this.web3.utils.toHex(to),
        topics: [ Web3.utils.sha3('Confirmation(address,uint256)')]
      });

      await Promise.all(logs.map((x) => this.processEvent(x)));
      this.scrapedTo = to;
    }
  }

  private async lookupCampaign(walletAddress) {
    const campaignId = this.walletAddresses[walletAddress];
    if (!campaignId) {
      return undefined;
    }
    return this.hostedCampaignService.findById(campaignId);
  }

}
