var TrustFeedCampaign = artifacts.require('./TrustFeedCampaign.sol');
var TrustFeedMintedCampaign = artifacts.require('./TrustFeedMintedCampaign.sol');
// var TrustFeedWallet = artifacts.require('./TrustFeedWallet');

module.exports = async (deployer, network, accounts) => {
  const openingTime = Date.now() / 1000 + 2;
  const closingTime = openingTime + 12;
  const rate = web3.toBigNumber('1');
  const hardCap = web3.toWei('5', 'ether');
  const softCap = web3.toWei('1', 'ether');
  const name = 'test';
  const symbol = 'TFT';
  const decimals = 18;
  const init = web3.toBigNumber(hardCap).mul(rate);
  deployer.deploy(
    TrustFeedCampaign,
    [accounts[0], accounts[2]],
    name,
    symbol,
    decimals,
    init,
    openingTime,
    closingTime,
    rate,
    hardCap,
    softCap,
    'id')
    // .then(() => {
    //  deployer.deploy(
    //    TrustFeedMintedCampaign,
    //    [accounts[0], accounts[2]],
    //    name,
    //    symbol,
    //    decimals,
    //    closingTime + 3,
    //    closingTime + 16,
    //    rate,
    //    hardCap,
    //    softCap,
    //    'id');
    // })
    .catch(console.log);
};
