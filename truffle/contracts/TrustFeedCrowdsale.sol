pragma solidity ^0.4.18;

import 'openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/emission/AllowanceCrowdsale.sol';
import './TrustFeedToken.sol';

contract TrustFeedCrowdsale is AllowanceCrowdsale, TimedCrowdsale, CappedCrowdsale, RefundableCrowdsale {
	constructor(
    // Start
    uint256 _openingTime,
    // End
    uint256 _closingTime,
    // Price
    uint256 _rate,
    // Owner address (soon to be multi-sig)
    address _wallet,
    // The hard cap
    uint256 _cap,
    // The token
    TrustFeedToken _token,
    // The soft cap
    uint256 _goal,
    address _tokenWallet
  )
    public
    AllowanceCrowdsale(_tokenWallet)
    Crowdsale(_rate, _wallet, _token)
    CappedCrowdsale(_cap)
    RefundableCrowdsale(_goal)
    TimedCrowdsale(_openingTime, _closingTime)
  {
    require(_goal <= _cap);
  }
}
