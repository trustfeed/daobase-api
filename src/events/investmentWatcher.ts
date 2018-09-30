import { inject } from 'inversify';
import { EventWatcher } from './eventWatcher';
import Web3 from 'web3';
import config from '../config';
import { UserService } from '../services/user';
import { HostedCampaignService } from '../services/hostedCampaign';
import { InvestmentService } from '../services/investment';
import { Web3Service } from '../services/web3';
import TYPES from '../constant/types';
import { makeDeployment, fetchContracts, updateWeiRaised } from '../models/hostedCampaign';
import { Investment } from '../models/investment';

const topicToAddress = topic => {
  if (topic && topic.length >= 40) {
    return '0x' + topic.substring(topic.length - 40);
  } else {
    return undefined;
  }
};

export class InvestmentWatcher extends EventWatcher {
  // Which investments do we care about
  private userPublicAddresses: any = new Set([]);
  // Map the token address to campaign id
  private tokenAddresses: any = {};
  // Don't crawl simultanuously
  private isCrawlingAllKnown = false;

  constructor(
    @inject(TYPES.Web3Service) private web3Service: Web3Service,
    @inject(TYPES.UserService) private userService: UserService,
    @inject(TYPES.HostedCampaignService) private hostedCampaignService: HostedCampaignService,
    @inject(TYPES.InvestmentService) private investmentService: InvestmentService
  ) {
    super();

    // TODO: How to determine when this has finished?
    let x = this.userService.forEach(user => {
      this.userPublicAddresses.add(user.publicAddress);
    });
    this.hostedCampaignService.forEach(campaign => {
      if (campaign.campaignStatus === 'DEPLOYED' || campaign.campaignStatus === 'PENDING_OFF_CHAIN_REVIEW') {
        this.tokenAddresses[campaign.onChainData.tokenContract.address] = campaign._id;
      }
    });

    console.log('constructed');
    setTimeout(() => this.crawlAllKnown(), 5 * 1000);
  }

  private async lookupCampaign(tokenAddress) {
    const campaignId = this.tokenAddresses[tokenAddress];
    if (!campaignId) {
      return undefined;
    }
    return this.hostedCampaignService.findById(campaignId);
  }

  // Handle a new log event, updating the db if needed
  protected async processEvent(log: any): Promise<void> {
    const tokenAddress = log.address;

    let campaign = await this.lookupCampaign(tokenAddress);
    if (!campaign) {
      return;
    }
    this.updateWeiRaised(campaign);

    const tokenContract = this.web3Service.createContract(
      campaign.onChainData.tokenContract.abi,
      campaign.onChainData.tokenContract.address
    );

    const from = topicToAddress(log.topics[1]);
    const to = topicToAddress(log.topics[2]);
    if (this.userPublicAddresses.has(from)) {
      const user = await this.userService.findByPublicAddress(from);
      if (!user) {
        return;
      }
      // get tokens owned
      let tokensOwned = await tokenContract.methods.balanceOf(user.publicAddress).call();
      this.updateInvestment(user, campaign, tokensOwned);
    }
    if (this.userPublicAddresses.has(to)) {
      const user = await this.userService.findByPublicAddress(to);
      if (!user) {
        return;
      }
      // get tokens owned
      let tokensOwned = await tokenContract.methods.balanceOf(user.publicAddress).call();
      this.updateInvestment(user, campaign, tokensOwned);
    }
  }

  // After a connection is established listen for new events
  protected async startWatching(): Promise<any> {
    this.crawlAllKnown();
    return this.web3.eth.subscribe(
      'logs',
      {
        topics: [Web3.utils.sha3('Transfer(address,address,uint256)')]
      }
    );
  }

  // Walk over all pairs of (users, campaigns)
  private async crawlAllKnown() {
    console.log('crawl all known');
    if (this.isCrawlingAllKnown) {
      return;
    }
    this.isCrawlingAllKnown = true;
    for (let tokenAddress in this.tokenAddresses) {
      for (let userAddress of this.userPublicAddresses) {
        await this.checkUserToken(userAddress, tokenAddress);
      }
      let campaign = await this.lookupCampaign(tokenAddress);
      if (campaign) {
        this.updateWeiRaised(campaign);
      }
    }
    this.isCrawlingAllKnown = false;
  }

  private async checkUserToken(userAddress, tokenAddress) {
    let campaign = await this.lookupCampaign(tokenAddress);
    if (!campaign) {
      return;
    }

    const user = await this.userService.findByPublicAddress(userAddress);
    if (!user) {
      return;
    }
    // get tokens owned
    const tokenContract = this.web3Service.createContract(
      campaign.onChainData.tokenContract.abi,
      campaign.onChainData.tokenContract.address
    );
    let tokensOwned = await tokenContract.methods.balanceOf(userAddress).call();
    this.updateInvestment(user, campaign, tokensOwned);
  }

  private async updateWeiRaised(campaign) {
    campaign = await updateWeiRaised(campaign, this.web3Service);
    this.hostedCampaignService.update(campaign);
  }

  private async updateInvestment(user, campaign, tokensOwned) {
    const investment = new Investment(
      user._id,
      campaign._id,
      campaign.onChainData.tokenContract.address,
      tokensOwned,
      campaign.onChainData.tokenName,
      campaign.onChainData.tokenSymbol,
      campaign.onChainData.tokenDecimals
    );
    this.investmentService.upsert(investment);
  }
}
