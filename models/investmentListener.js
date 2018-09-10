import Networks from './networks';
import User from './user';
import Investments from './investments';
import Campaign from './campaign';

const topicToAddress = topic => {
  if (topic && topic.length >= 40) {
    return '0x' + topic.substring(topic.length - 40);
  } else {
    return undefined;
  }
};

const checkUser = async publicAddress => {
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

const publicAddresses = new Set([]);

export default {
  listenForERC20: () => {
    const listenToEvent = async (network) => {
      const w3 = await Networks.lightNode(network);
      w3.eth.subscribe(
        'logs',
        {
          fromBlock: 0,
          topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
        }, () => {})
        .on('data', tx => {
          const token = tx.address;
          const from = topicToAddress(tx.topics[1]);
          const to = topicToAddress(tx.topics[2]);
          Campaign.updateWeiRaised(token).catch(() => {});// console.log);
          if (token && from && to) {
            if (publicAddresses.has(from)) {
              Investments.updateBalance(network, token, from).catch(() => {});// err => console.log(err));
            }
            if (publicAddresses.has(to)) {
              Investments.updateBalance(network, token, to).catch(() => {});// err => console.log(err));
            }
          }
        });
    };

    const ns = Networks.supported;
    return Promise.all(ns.map(listenToEvent));
  },

  addAddresses: async addresses => {
    Promise.all(addresses.map(checkUser)).catch(err => { console.log(err); });
    addresses.map(x => publicAddresses.add(x));
  },

  crawlAllKnown: async () => {
    User.find().stream().on('data', u => {
      checkUser(u.publicAddress);
      publicAddresses.add(u.publicAddress);
    });
  },
};
