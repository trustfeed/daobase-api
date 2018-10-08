var TrustFeedCampaign = artifacts.require('./TrustFeedCampaign.sol');
// var MintedCampaign = artifacts.require('./TrustFeedMintedCampaign.sol');
var TrustFeedWallet = artifacts.require('./TrustFeedWallet');

module.exports = async (deployer, network, accounts) => {
  const openingTime = Date.now() / 1000 + 1;
  const closingTime = openingTime + 60;
  const rate = 1;
  const hardCap = 10000000;
  const softCap = 1;
  const name = 'test';
  const symbol = 'TFT';
  const decimals = 18;
  const init = 1000000;
  await deployer.deploy(TrustFeedWallet, [accounts[0], accounts[1]], 1);
  await deployer.deploy(
    TrustFeedCampaign,
    ['0x34437cbabe4eeaa21b3cec92ce9454406e7be087', accounts[3]],
    name,
    symbol,
    decimals,
    init,
    openingTime,
    closingTime,
    rate,
    hardCap,
    softCap,
    'id');
};
