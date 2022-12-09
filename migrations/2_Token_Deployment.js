var TokenFactory = artifacts.require("./TokenFactory.sol");
var CertificateFactory = artifacts.require("./CertificateFactory.sol");
var Relay = artifacts.require("./Relay.sol");

module.exports = function(deployer, network, accounts) {

  deployer.deploy(TokenFactory, {from: accounts[0]});
  deployer.deploy(CertificateFactory, {from: accounts[0]});
  deployer.deploy(Relay, {from: accounts[0]});
};
