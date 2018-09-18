import Networks from './networks';
import User from './user';
import Investments from './investments';
import Campaign from './campaign';
import EventWorker from './eventWorker';

// This is a set of public address of known users.
// This is used to drop transfer events for non-users.
const userPublicAddresses = new Set([]);

// This listens for token transfer events on a single network,
// should handle crashes of the ethereum client
class InvestmentListener extends EventWorker {
  constructor (network) {
    super(Networks.node(network));

    this.network = network;
  }

  // Handle a new log event, updating the db if needed
  async _processEvent (log) {
    const token = log.address;
    const from = topicToAddress(log.topics[1]);
    const to = topicToAddress(log.topics[2]);
    console.log('chech wei raised');
    Campaign.updateWeiRaised(token).catch(console.log);
    if (token && from && to) {
      if (userPublicAddresses.has(from)) {
        Investments.updateBalance(this.network, token, from).catch(() => {});
      }
      if (userPublicAddresses.has(to)) {
        Investments.updateBalance(this.network, token, to).catch(() => {});
      }
    }
  }

  // After a connection is established listen for new events
  async _startWatching () {
    crawlAllKnown();
    return this.web3.eth.subscribe(
      'logs',
      {
        fromBlock: 0,
        topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
      }, () => {});
  }
};

// Strip the extra data off the address
const topicToAddress = (topic) => {
  if (topic && topic.length >= 40) {
    return '0x' + topic.substring(topic.length - 40);
  } else {
    return undefined;
  }
};

// This starts listeners on all known networks.
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
let isCrawlingAllKnown = false;
const crawlAllKnown = async () => {
  console.log('crawling all known');
  if (isCrawlingAllKnown) {
    return;
  }
  isCrawlingAllKnown = true;
  await User.find().stream().on('data', u => {
    checkUser(u.publicAddress);
    userPublicAddresses.add(u.publicAddress);
  });
  isCrawlingAllKnown = false;
};

// Add new user addresses
const addUserAddresses = async (addresses) => {
  Promise.all(addresses.map(checkUser)).catch(err => { console.log(err); });
  addresses.map(a => userPublicAddresses.push(a));
};

export default { startListner, crawlAllKnown, addUserAddresses };
