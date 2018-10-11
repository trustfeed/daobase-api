pragma solidity ^0.4.18;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol';

contract TrustFeedMintableToken is ERC20Mintable {
	string public name;
	string public symbol;
	uint8 public decimals;

	constructor(string _name, string _symbol, uint8 _decimals) public {
		name = _name;
		symbol = _symbol;
		decimals = _decimals;
	}
}
