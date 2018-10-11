pragma solidity ^0.4.18;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract TrustFeedToken is ERC20 {
	string public name;
	string public symbol;
	uint8 public decimals;

	constructor(string _name, string _symbol, uint8 _decimals, uint256 _initialSupply, address _owner) public {
		name = _name;
		symbol = _symbol;
		decimals = _decimals;
		_mint(_owner, _initialSupply);
	}
}
