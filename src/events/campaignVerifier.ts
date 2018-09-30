import { inject } from 'inversify';
import { EventWatcher } from './eventWatcher';
import Web3 from 'web3';
import config from '../config';
import { UserService } from '../services/user';
import { HostedCampaignService } from '../services/hostedCampaign';
import { Web3Service } from '../services/web3';
import TYPES from '../constant/types';
import { makeDeployment, fetchContracts } from '../models/hostedCampaign';

export class CampaignVerifier extends EventWatcher {
  private scrapedTo: number;
  private chunckSize: number;

  constructor(
    @inject(TYPES.Web3Service) private web3Service: Web3Service,
    @inject(TYPES.UserService) private userService: UserService,
    @inject(TYPES.HostedCampaignService) private hostedCampaignService: HostedCampaignService
  ) {
    super();
    // The initial settings
    this.scrapedTo = 3000000;
    this.chunckSize = 10000;
  }

  // Internal function that checks validity of creation event
  private async verifyRegistyEvent(registryEvent) {
    const returnValues = this.web3.eth.abi.decodeParameters(['address', 'string'], registryEvent.data);
    const campaignAddress = returnValues[0];
    const campaignId = returnValues[1];

    const campaign = await this.hostedCampaignService.findById(campaignId);
    if (campaign === null || campaign === undefined) {
      throw new Error('invalid campaign id');
    }
    const campaignStatus = campaign.campaignStatus;
    if (campaignStatus !== 'REVIEWED' && campaignStatus !== 'PENDING_DEPLOYMENT') {
      throw new Error('campaign status is not REVIEWED');
    }

    const user = await this.userService.findById(campaign.ownerId);
    if (user === null || user === undefined) {
      throw new Error('invalid user id');
    }
    const deployment = await makeDeployment(campaign, user.publicAddress, this.web3Service);
    const transaction = await this.web3.eth.getTransactionFromBlock(
      registryEvent.blockNumber,
      registryEvent.transactionIndex
    );
    if (transaction.input !== deployment.transaction) {
      throw new Error("transaction data doesn't match");
    }
    await fetchContracts(campaign, campaignAddress, this.web3Service);
    campaign.campaignStatus = 'DEPLOYED';
    return this.hostedCampaignService.update(campaign);
  }

  // Scrap old events in chuncks.
  private async scrape() {
    const processLog = log => {
      return this.verifyRegistyEvent(log).catch(e => console.log(e.message));
    };

    while (this.scrapedTo <= (await this.web3.eth.getBlockNumber())) {
      let to = this.scrapedTo + this.chunckSize;
      let logs = await this.web3.eth.getPastLogs({
        fromBlock: this.web3.utils.toHex(this.scrapedTo),
        toBlock: this.web3.utils.toHex(to),
        topics: [this.web3.utils.sha3('NewCampaign(address,string)')]
      });

      await Promise.all(logs.map(processLog));
      this.scrapedTo = to;
    }
  }

  // After network outage, crawl unknown blocks and start watching for new events
  protected async startWatching() {
    this.scrape();

    return this.web3.eth.subscribe(
      'logs',
      {
        fromBlock: this.scrapedTo,
        topics: [this.web3.utils.sha3('NewCampaign(address,string)')]
      }
    );
  }

  // Process a registry event
  protected async processEvent(registryEvent) {
    this.verifyRegistyEvent(registryEvent).catch(err => {
      console.log('registry event failed to verify:', err.message);
    });
  }
}
