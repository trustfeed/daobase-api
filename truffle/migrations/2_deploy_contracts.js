var Campaign = artifacts.require('./TrustFeedCampaign.sol');
var Registry = artifacts.require('./TrustFeedCampaignRegistry.sol');

module.exports = function (deployer, network, accounts) {
  const openingTime = Date.now() / 1000;
  const closingTime = openingTime + 100 * 60 * 60 * 24;
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
        Campaign,
        [accounts[0], accounts[1]],
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
