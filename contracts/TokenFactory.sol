pragma solidity ^0.4.15;

import "./SCToken.sol";

contract TokenFactory {

  function createToken(string _name, string _symbol, address[] _components, uint256[] _amounts) public returns (address) {
    address contract_address = new SCToken(msg.sender, _name, _symbol, _components, _amounts);
    emit TokenContractCreated(contract_address, msg.sender);
    return contract_address;
  }

  event TokenContractCreated(address contract_address, address sender);
}
