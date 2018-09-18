import Networks from './networks';
import User from './user';
import Investments from './investments';
import Campaign from './campaign';
import EventWorker from './eventWorker';

const userPublicAddresses = new Set([]);

class InvestmentListener extends EventWorker {
  // Strip the extra data off the address
  static topicToAddress (topic) {
    if (topic && topic.length >= 40) {
      return '0x' + topic.substring(topic.length - 40);
    } else {
      return undefined;
    }
  };

  // Construct a listener that will handle network errors.
  constructor (network) {
    super(Networks.node(network));

    this.network = network;
  }

  // Handle a new log event
  async _processLog (log) {
    const token = log.address;
    const from = this.topicToAddress(log.topics[1]);
    const to = this.topicToAddress(log.topics[2]);
    Campaign.updateWeiRaised(token).catch(() => {});
    if (token && from && to) {
      if (userPublicAddresses.has(from)) {
        Investments.updateBalance(this.network, token, from).catch(() => {});
      }
      if (userPublicAddresses.has(to)) {
        Investments.updateBalance(this.network, token, to).catch(() => {});
      }
    }
  }

  // After a connection is established, crawl all users + campaigns then listen for new events
  async _startWatching () {
    // TODO: scrape all
    return this.web3.eth.subscribe(
      'logs',
      {
        fromBlock: 0,
        topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
      }, () => {});
  }
};

const startListner = async () => {
  const ls = Networks.supported.map(n => new InvestmentListener(n));
  return Promise.all(ls.map(l => l.watchEvents()));
};

// Check all data for a user. This needs to be called when a new user is added.
const checkUser = async (publicAddress) => {
  const user = await User.findOne({ publicAddress }).exec();
  if (!user) {
    return;
  }
  return Campaign
    .find({ 'hostedCampaign.onChainData.tokenContract': { $exists: true } })
    .stream()
    .on('data', campaign => {
      return Investments.updateBalance(
        campaign.hostedCampaign.onChainData.network,
        campaign.hostedCampaign.onChainData.tokenContract.address,
        publicAddress,
      );
    });
};

// Crawl all users
const crawlAllKnown = async () => {
  User.find().stream().on('data', u => {
    checkUser(u.publicAddress);
    userPublicAddresses.add(u.publicAddress);
  });
};

// Add new user addresses
const addUserAddresses = async (addresses) => {
  Promise.all(addresses.map(checkUser)).catch(err => { console.log(err); });
  addresses.map(a => userPublicAddresses.push(a));
};

export default { startListner, crawlAllKnown, addUserAddresses };
