import mongoose from 'mongoose';
import User from './user';
import Campaign from './campaign';
import Networks from './networks';
import Contract from './contract';
import EventWorker from './eventWorker';

// This verifies campaigns on a single network. It should handle infura server crashes.
class CampaignVerifier extends EventWorker {
  constructor(network, abi) {
    // Make the event worker that will handle disconnects
    super(Networks.node(network));

    // The initial settings
    this.scrapedTo = 2000000;
    this.chunckSize = 10000;
    this.registry = Networks.registry(network);
    this.contract = new this.web3.eth.Contract(abi, Networks.registry(network));
  }

  // Fetch the abi needed for the events
  static async loadABI(network) {
    const abi = await Contract.findOne({ name: 'TrustFeedCampaignRegistry' })
      .exec()
      .then(c => {
        if (!c) {
          throw new Error('cannot find registry');
        } else {
          return JSON.parse(c.abi);
        }
      });
    return abi;
  }

  // Internal function that checks validaty of creation event
  async _verifyRegistyEvent(registryEvent) {
    const campaignId = mongoose.Types.ObjectId(registryEvent.returnValues.campaignId);
    const campaign = await Campaign.findOne({ _id: campaignId });
    if (!campaign) {
      throw new Error('invalid campaign id');
    }
    if (!campaign.hostedCampaign) {
      throw new Error('not a hosted campaign');
    }
    const campaignStatus = campaign.hostedCampaign.campaignStatus;
    if (campaignStatus !== 'REVIEWED' && campaignStatus !== 'PENDING_DEPLOYMENT') {
      throw new Error('campaign status is not REVIEWED');
    }

    const user = await User.findOneById(campaign.hostedCampaign.owner);
    if (!user) {
      throw new Error('invalid user id');
    }
    const deployment = await campaign.makeDeployment(user.publicAddress);
    const transaction = this.web3.eth.getTransactionFromBlock(
      registryEvent.blockNumber,
      registryEvent.transactionIndex
    );
    if (transaction.input !== deployment.deployment) {
      throw new Error("transaction data doesn't match");
    }
    // Grab the reciept
    const campaignAddress = registryEvent.returnValues.campaignAddress;
    await campaign.fetchContracts(campaignAddress);
    campaign.hostedCampaign.campaignStatus = 'DEPLOYED';
    return campaign.save();
  }

  // Scrap old events in chuncks.
  // TODO: Use event.getPastEvents not all logs.
  async _scrape() {
    const decodeReturnValues = log => {
      const returnValues = this.web3.eth.abi.decodeParameters(['address', 'string'], log.data);
      return { campaignAddress: returnValues[0], campaignId: returnValues[1] };
    };

    const processLog = log => {
      log.returnValues = decodeReturnValues(log);
      return this._verifyRegistyEvent(log).catch(e => console.log(e.message));
    };

    while (this.scrapedTo <= (await this.web3.eth.getBlockNumber())) {
      let to = this.scrapedTo + this.chunckSize;
      let logs = await this.web3.eth.getPastLogs({
        fromBlock: this.web3.utils.toHex(this.scrapedTo),
        toBlock: this.web3.utils.toHex(to),
        address: this.registry
      });

      await Promise.all(logs.map(processLog));
      this.scrapedTo = to;
    }
  }

  // After network outage, crawl unknown blocks and start watching for new events
  async _startWatching() {
    this._scrape();

    return this.contract.events.NewCampaign({}, () => {});
  }

  // Process a registry event
  async _processEvent(registryEvent) {
    this._verifyRegistyEvent(registryEvent).catch(err => {
      console.log('registry event failed to verify:', err.message);
    });
  }
}

// This starts the listeners for all supported networks.
const startCampainVerifier = async () => {
  const abi = await CampaignVerifier.loadABI();
  let ps = Networks.supported.map(n => {
    let verifier = new CampaignVerifier(n, abi);
    Networks.addSubscription(n, verifier);
    return verifier.watchEvents();
  });

  return Promise.all(ps);
};

export default startCampainVerifier;
