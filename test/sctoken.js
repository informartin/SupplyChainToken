var TokenFactory = artifacts.require("TokenFactory");
var SCToken = artifacts.require("SCToken");

contract('SCToken', function(accounts) {
  var woodToken;
  var glueToken;
  var tableToken;

  it("should mint wood tokens", function() {
    return TokenFactory.deployed().then((factory) => {
      return factory.createToken("wood", "===", [], [], {from: accounts[0]});
    }).then((instance) => {
      woodToken = SCToken.at(instance.logs[0].args["contract_address"]);
      return woodToken.mint(100, [], [], [], {from: accounts[0]});
    }).then(() => {
      return woodToken.totalSupply.call({from: accounts[0]});
    }).then((supply) => {
      assert.equal(supply.valueOf(), 1, "Token ha not been minted");
    })
  });

  it("should mint glue tokens", function() {
    return TokenFactory.deployed().then((factory) => {
      return factory.createToken("glue", "=>", [], [], {from: accounts[0]});
    }).then((instance) => {
      glueToken = SCToken.at(instance.logs[0].args["contract_address"]);
      return glueToken.mint(200, [], [], [], {from: accounts[0]});
    }).then(() => {
      return glueToken.totalSupply.call({from: accounts[0]});
    }).then((supply) => {
      assert.equal(supply.valueOf(), 1, "Token ha not been minted");
    })
  });

  it("should mint table tokens", function() {
    let factory;
    let woodTokenId;
    let glueTokenId;

    return TokenFactory.deployed().then((result) => {
      factory = result;
      return woodToken.tokenByIndex.call(0, {from: accounts[0]});
    }).then((result) => {
      woodTokenId = result;
      return glueToken.tokenByIndex.call(0, {from: accounts[0]});
    }).then((result) => {
      glueTokenId = result;
      return factory.createToken(
        "table",
        "n--n",
        [woodToken.address, glueToken.address],
        [1,2]);
    }).then((instance) => {
      tableToken = SCToken.at(instance.logs[0].args["contract_address"]);
      return woodToken.approve(tableToken.address, woodTokenId);
    }).then(() => {
      return glueToken.approve(tableToken.address, glueTokenId);
    }).then(() => {
      return tableToken.mint(
        1,
        [woodToken.address, glueToken.address],
        [woodTokenId, glueTokenId],
        [1,2],
        {from: accounts[0]});
    }).then(() => {
      return tableToken.totalSupply.call({from: accounts[0]});
    }).then((supply) => {
      assert.equal(supply.valueOf(), 1, "Token ha not been minted");
    });
  });
})
