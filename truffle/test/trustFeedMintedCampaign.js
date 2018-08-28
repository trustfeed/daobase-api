var TrustFeedMintedCampaign = artifacts.require('TrustFeedMintedCampaign');
var TrustFeedMintableToken = artifacts.require('TrustFeedMintableToken');
var TrustFeedMintedCrowdsale = artifacts.require('TrustFeedMintedCrowdsale');

contract('TrustFeedMintedCampaign', function (accounts) {
  it('Buy token', function () {
    let instance, crowdsale, crowdsaleAddr, token;
    TrustFeedMintedCampaign.deployed()
      .then(i => {
        instance = i;
        return instance.crowdsale.call();
      }).then(c => {
        let crowdsaleFactory = web3.eth.contract(TrustFeedMintedCrowdsale.abi);
        crowdsale = crowdsaleFactory.at(c);
        crowdsaleAddr = c;
        return instance.token.call();
      }).then(t => {
        let tokenFact = web3.eth.contract(TrustFeedMintableToken.abi);
        token = tokenFact.at(t);

        return token.balanceOf.call(crowdsaleAddr);
      }).then(b => {
        console.log('crowdsale balance:', b.valueOf());
        crowdsale.buyTokens.sendTransaction(
          accounts[5],
          {
            from: accounts[5],
            value: 2000,
            gas: 1000000,
          },
          (err, r) => {
            console.log(err, r);
            token.balanceOf.call(accounts[5], (err, b) => {
              console.log(err, b.valueOf());
            });
          });
      });
  });
});

//        return instance.crowdsale.call();
//      }).then(c => {
//        let crowdsaleFactory = web3.eth.contract(TrustFeedMintedCrowdsale.abi);
//        crowdsale = crowdsaleFactory.at(c);
//        crowdsaleAddr = c;
//        return instance.token.call();
//      }).then(t => {
//        let tokenFact = web3.eth.contract(TrustFeedMintableToken.abi);
//        token = tokenFact.at(t);
//
//        return token.balanceOf.call(crowdsaleAddr);
//      }).then(b => {
//        console.log('crowdsale balance:', b.valueOf());
//        return crowdsale.openingTime.call();
//      }).then(o => {
//        console.log('opening time:', new Date(o.valueOf() * 1000));
//        crowdsale.buyTokens.sendTransaction(
//          accounts[5],
//          {
//            from: accounts[5],
//            value: 2000,
//            gas: 1000000,
//          },
//          (err, r) => {
//            console.log(err, r);
//            token.balanceOf.call(accounts[5], (err, b) => {
//              console.log(err, b.valueOf());
//            });
//          }
//        );
