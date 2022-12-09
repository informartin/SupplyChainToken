pragma solidity ^0.5.0;

import "./SCToken.sol";

contract TokenFactory {

  function createToken(address[] memory _sourceBlockchainRelayAddresses, address[] memory _componentAddresses, uint32[] memory _amounts) public returns (address) {
    address contract_address = address(new SCToken(msg.sender, _sourceBlockchainRelayAddresses, _componentAddresses, _amounts));
    emit TokenContractCreated(contract_address, msg.sender);
    return contract_address;
  }

  event TokenContractCreated(address contract_address, address sender);
}
