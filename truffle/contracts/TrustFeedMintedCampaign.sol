pragma solidity ^0.4.18;

import './TrustFeedWallet.sol';
import './TrustFeedMintableToken.sol';
import './TrustFeedMintedCrowdsale.sol';

// This is a 'wrapper'. It constructs the token, then the crowdsale.
contract TrustFeedMintedCampaign {
  TrustFeedWallet public wallet;  
  TrustFeedMintableToken public token;
  TrustFeedMintedCrowdsale public crowdsale;

  event NewCampaign(
    address campaignAddress,
    string campaignId
  );

  constructor(
    // The owners of the token
    address[] _owners,
    // Token name
    string _name,
    // Token symbol
    string _symbol,
    // The decimals for token
    uint8 _decimals,
    // Start time of crowdsale
    uint256 _openingTime,
    // End of crowdsale
    uint256 _closingTime,
    // Price
    uint256 _rate,
    // The hard cap
    uint256 _cap,
    // The soft cap
    uint256 _goal,
    // The campaign id
    string _campaignId
  ) public {

    wallet = new TrustFeedWallet(
      _owners,
      2);
      
    // Create the token
    token = new TrustFeedMintableToken(
      _name,
      _symbol,
      _decimals);

    // Create the crowdsale
    crowdsale = new TrustFeedMintedCrowdsale(
      _openingTime,
      _closingTime,
      _rate,
      wallet,
      _cap,
      token,
      _goal);

    // Allow crowdsale to mint tokens
    token.addMinter(crowdsale);
    token.addMinter(wallet);
    token.renounceMinter();

    emit NewCampaign(this, _campaignId);
  }
}
