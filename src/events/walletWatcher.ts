import { inject, injectable } from 'inversify';
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
import fs from 'fs';

const version = '0.0.0';

@injectable()
export class WalletWatcher extends EventWatcher {
  // The address currently listed on the wallet
  public trustFeedAddresses: any = new Set([]);
  public contract: any;
  protected topics: [];

  constructor(
    @inject(TYPES.Web3Service) private web3Service: Web3Service
  ) {
    super();

    this.readContract();
    this.setCurrentAddresses();
  }

  // Handle a new log event
  protected async processEvent(log: any): Promise<void> {
    this.setCurrentAddresses();
  }

  // After a connection is established listen for new events
  protected async startWatching(): Promise<any> {
    return this.contract.events.allEvents({
      topics: this.topics
    });
  }

  // Read the wallet contract from file
  private readContract() {
    const data = JSON.parse(fs.readFileSync(
      `./contracts/v${version}/TrustFeedWallet.json`,
      'utf-8'
    ));
    this.contract = this.web3Service.createContract(data.abi, config.trustfeedWalletAddress);
  }

  // Grab the current state of the wallet
  private async setCurrentAddresses() {
    const addresses = await this.contract.methods.getOwners().call();
    let s = new Set([]);
    addresses.map(a => { s.add(a.toString().toLowerCase()); });
    this.trustFeedAddresses = s;
  }
}

// Watch for new trustfeed accounts
@injectable()
export class WalletAdd extends WalletWatcher {
  protected topic = [ Web3.utils.sha3('OwnerAddition(address)') ];
}

// Watch for removed trustfeed accounts
@injectable()
export class WalletRemove extends WalletWatcher {
  protected topic = [ Web3.utils.sha3('OwnerRemoval(address)') ];
}
