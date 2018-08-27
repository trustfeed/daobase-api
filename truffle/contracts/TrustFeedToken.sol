pragma solidity ^0.4.18;

import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';

contract TrustFeedToken is StandardToken {
	string public name;
	string public symbol;
	uint8 public decimals;

	constructor(string _name, string _symbol, uint8 _decimals, uint256 _initialSupply, address _owner) public {
		name = _name;
		symbol = _symbol;
		totalSupply_ = _initialSupply;
		decimals = _decimals;
		balances[_owner] = _initialSupply;
		emit Transfer(0x0, _owner, _initialSupply);
	}
}
