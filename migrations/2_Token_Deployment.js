var TokenFactory = artifacts.require("./TokenFactory.sol");

module.exports = function(deployer, network, accounts) {

  deployer.deploy(TokenFactory, {from: accounts[0]});
  /*
  deployer.deploy(WoodToken, 'wood', '===', [], [], {from: accounts[0]})
    .then(function() {
      return deployer.deploy(
        GlueToken,
        'glue',
        '=>',
        [],
        [],
        {from: accounts[0]})
    }).
    then(function() {
      return deployer.deploy(
        TableToken,
        'table',
        'n--n',
        [WoodToken.address,GlueToken.address],
        [1,2],
        {from: accounts[0]})
    })
    */
};
