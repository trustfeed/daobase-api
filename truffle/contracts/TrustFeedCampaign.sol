pragma solidity ^0.4.18;

import './TrustFeedWallet.sol';
import './TrustFeedToken.sol';
import './TrustFeedCrowdsale.sol';

// This is a 'wrapper'. It constructs the token, then the crowdsale.
contract TrustFeedCampaign {
  TrustFeedWallet public wallet;  
  TrustFeedToken public token;
  TrustFeedCrowdsale public crowdsale;

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
    // The initial supply for the token
    uint256 _initialSupply,
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
    token = new TrustFeedToken(
      _name,
      _symbol,
      _decimals,
      _initialSupply,
      this);

    // Create the crowdsale
    crowdsale = new TrustFeedCrowdsale(
      _openingTime,
      _closingTime,
      _rate,
      wallet,
      _cap,
      token,
      _goal);

    // Transfer the initial funds
    token.transfer(crowdsale, _initialSupply);
    // Transfer the crowdsale to the wallet
    crowdsale.transferOwnership(wallet);

    emit NewCampaign(this, _campaignId);
  }
}
