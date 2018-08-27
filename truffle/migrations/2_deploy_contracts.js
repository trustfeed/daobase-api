var Campaign = artifacts.require('./TrustFeedCampaign.sol');
var Registry = artifacts.require('./TrustFeedCampaignRegistry.sol');

const duration = {
  seconds: function (val) {
    return val;
  },
  minutes: function (val) {
    return val * this.seconds(60);
  },
  hours: function (val) {
    return val * this.minutes(60);
  },
  days: function (val) {
    return val * this.hours(24);
  },
  weeks: function (val) {
    return val * this.days(7);
  },
  years: function (val) {
    return val * this.days(365);
  }
};

module.exports = function (deployer, network, accounts) {
  const openingTime = web3.eth.getBlock('latest').timestamp + duration.minutes(10);
  const closingTime = openingTime + duration.days(10);
  const rate = 1;
  const hardCap = 10000000;
  const softCap = 1000;
  const name = 'test';
  const symbol = 'TFT';
  const decimals = 18;
  const init = 1000000;
  return deployer
    .deploy(Registry)
    .then(() => {
      return deployer.deploy(
        Campaign, [accounts[0], accounts[1]],
        name,
        symbol,
        decimals,
        init,
        openingTime,
        closingTime,
        rate,
        hardCap,
        softCap,
        'some_fake_id',
        Registry.address);
    });
};