var TokenFactory = artifacts.require("./TokenFactory.sol");
var CertificateFactory = artifacts.require("./CertificateFactory.sol");

module.exports = function(deployer, network, accounts) {

  deployer.deploy(TokenFactory, {from: accounts[0]});
  deployer.deploy(CertificateFactory, {from: accounts[0]});
};
