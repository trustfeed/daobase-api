//var TrustFeedMintedCampaign = artifacts.require('TrustFeedMintedCampaign');
//var TrustFeedMintableToken = artifacts.require('TrustFeedMintableToken');
//var TrustFeedMintedCrowdsale = artifacts.require('TrustFeedMintedCrowdsale');
//
//contract('TrustFeedCampaign', function (accounts) {
//  it('Buy token', async function () {
//    let campaign = await TrustFeedMintedCampaign.deployed();
//    let crowdsaleAddr = await campaign.crowdsale.call();
//    let crowdsaleFactory = web3.eth.contract(TrustFeedMintedCrowdsale.abi);
//    let crowdsale = crowdsaleFactory.at(crowdsaleAddr);
//
//    let openingTime = Number(crowdsale.openingTime.call().toString());
//    let closingTime = Number(crowdsale.closingTime.call().toString());
//
//    let tokenAddr = await campaign.token.call();
//    let tokenFactory = web3.eth.contract(TrustFeedMintableToken.abi);
//    let token = tokenFactory.at(tokenAddr);
//
//    let walletAddr = await campaign.wallet.call();
//
//    while ((new Date()).getTime() / 1000 < openingTime);
//
//    crowdsale.buyTokens.sendTransaction(
//      accounts[5],
//      {
//        from: accounts[5],
//        value: web3.toWei('1', 'ether'),
//        gas: 1000000,
//      }
//    );
//    crowdsale.buyTokens.sendTransaction(
//      accounts[6],
//      {
//        from: accounts[5],
//        value: web3.toWei('2', 'ether'),
//        gas: 1000000,
//      }
//    );
//
//    // Use a proper sleep function
//    while (((new Date()).getTime() / 1000) < (closingTime + 3)) { }
//
//    crowdsale.finalize.sendTransaction(
//      {
//        from: accounts[7],
//        gas: 1000000,
//      }
//    );
//
//    assert.equal(crowdsale.finalized.call(), true, 'not finalised');
//    assert.equal(web3.eth.getBalance(walletAddr), web3.toWei('3', 'ether'), 'wallet did\'t recieve the funds');
//    assert.equal(token.balanceOf.call(accounts[5]), web3.toWei('1', 'ether'), 'accounts[5] didn\'t recieve the tokens');
//    assert.equal(token.balanceOf.call(accounts[6]), web3.toWei('2', 'ether'), 'accounts[6] didn\'t recieve the tokens');
//  });
//});
