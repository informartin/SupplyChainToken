pragma solidity ^0.4.15;

import "./Certificate.sol";

contract CertificateFactory {

  function createCertificate(string description) public returns (address) {
    address contract_address = new Certificate(msg.sender, description);
    emit CertificateContractCreated(contract_address, msg.sender);
    return contract_address;
  }

  event CertificateContractCreated(address contract_address, address sender);
}
