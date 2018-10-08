var TrustFeedCampaign = artifacts.require('TrustFeedCampaign');
var TrustFeedToken = artifacts.require('TrustFeedToken');
var TrustFeedCrowdsale = artifacts.require('TrustFeedCrowdsale');
var TrustFeedWallet = artifacts.require('TrustFeedWallet');

contract('TrustFeedCampaign', function (accounts) {
  it('Finalise with msig.', async () => {
    let campaign = web3.eth.contract(TrustFeedCampaign.abi).at('0x47ee2dd8503f96a019faf159ac57457144e992d8');
    let crowdsaleAddress = await campaign.crowdsale.call();
    let crowdsale = web3.eth.contract(TrustFeedCrowdsale.abi).at(crowdsaleAddress);
    
    // crowdsale.buyTokens.sendTransaction(
    //  accounts[5],
    //  {
    //    from: accounts[5],
    //    value: 2000,
    //    gas: 1000000,
    //  },
    //  (err, r) => {
    //    console.log(err, r);
    //  }
    // );

    let campaignWalletAddress = await campaign.wallet.call();
    let campaignWallet =
      web3.eth.contract(TrustFeedWallet.abi).at(campaignWalletAddress);
    // let finaliseData = crowdsale.finalize.getData();
    // campaignWallet.submitTransaction.sendTransaction(
    //  crowdsaleAddress, 0, finaliseData,
    //  {
    //    from: accounts[3],
    //    gas: 1000000,
    //  },
    //  (err, r) => console.log(err, r)
    // );
    campaignWallet.transactions.call(0, (err, r) => console.log(err, r));

    /// // / wait until the crowdsale is closed
    /// / let start = new Date().getTime();
    /// / while (new Date().getTime() < start + 1000 * 60);

    let trustfeedWalletAddress = '0x34437cbabe4eeaa21b3cec92ce9454406e7be087';
    let trustfeedWallet =
     web3.eth.contract(TrustFeedWallet.abi).at(trustfeedWalletAddress);
    // let confirmData = campaignWallet.confirmTransaction.getData(0);
    // trustfeedWallet.submitTransaction.sendTransaction(
    // campaignWalletAddress, 0, confirmData,
    // {
    //   from: accounts[0],
    //   gas: 1000000,
    // },
    // (err, r) => console.log(err, r)
    // );
    crowdsale.isFinalized.call((err, r) => console.log(err, r));
    trustfeedWallet.transactions.call(0, (err, r) => console.log(err, r));
  });
});
