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
  Web3.utils.sha3('Finalized()')
];

@injectable()
export class FinalisedWatcher extends EventWatcher {

  // Map the wallet address to campaign id
  private crowdsaleAddresses: any = {};
  // TODO: Put this data into mongo to prevent re-crawling on every restart
  private scrapedTo = 3122578;
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

  private async updateStatus(campaign) {
    if (campaign.campaignStatus !== hc.HOSTED_CAMPAIGN_STATUS_PENDING_FINALISATION_EXECUTION) {
      return;
    }

    const contractJSON = campaign.onChainData.crowdsaleContract;
    const contract = this.web3Service.createContract(contractJSON.abi, contractJSON.address);
    const isFinalised = await contract.methods.isFinalized().call();
    if (isFinalised) {
      campaign.campaignStatus = hc.HOSTED_CAMPAIGN_STATUS_FINALISED;
      await this.hostedCampaignService.update(campaign);
      delete this.crowdsaleAddresses[contractJSON.address];
    }
  }

  public async addCampaign(campaign) {
    const contract = campaign.onChainData.crowdsaleContract;
    if (!contract) {
      return;
    }
    this.crowdsaleAddresses[contract.address] = campaign._id;
    await this.updateStatus(campaign);
  }

  // Handles a new log event, updating the db if needed
  protected async processEvent(log: any): Promise<void> {
    const address = log.address;
    const campaign = this.lookupCampaign(address);
    if (!campaign) {
      return;
    }
    this.updateStatus(campaign);
  }

  // After a connection is established listen for new events
  protected async startWatching(): Promise<any> {
    return this.web3.eth.subscribe(
      'logs',
      {
        topics: [ Web3.utils.sha3('Finalized()') ]
      }
    );
  }

  private async lookupCampaign(crowdsaleAddress) {
    const campaignId = this.crowdsaleAddresses[crowdsaleAddress];
    if (!campaignId) {
      return undefined;
    }
    return this.hostedCampaignService.findById(campaignId);
  }

}
