var TokenFactory = artifacts.require("TokenFactory");
var CertificateFactory = artifacts.require("CertificateFactory");
var SCToken = artifacts.require("SCToken");
var Certificate = artifacts.require("Certificate");
var Relay = artifacts.require("Relay");

const { GetProof } = require("eth-proof");
const { prepareReceiptProof, rlpEncodedBlock } = require("./utils.js");

const jsonRpcUrl = "http://localhost:7545"
const prover = new GetProof(jsonRpcUrl);

contract('SCToken', function(accounts) {
  var woodToken;
  var glueToken;
  var tableToken;
  var certificate;
  var relay;

  it("should deploy relay contract", async function() {
    relay = await Relay.deployed();
  });

  it("should mint wood tokens", function() {
    return TokenFactory.deployed().then((factory) => {
      return factory.createToken([], [], [], {from: accounts[0]});
    }).then(async (instance) => {
      woodToken = await SCToken.at(instance.logs[0].args["contract_address"]);
      return woodToken.mint(100, [], [], [], [], [], [], {from: accounts[0]});
    }).then((receipt) => {
      woodToken.tokenId = web3.utils.toHex(receipt.logs[1].args[0]);
      return woodToken.balanceOf.call(accounts[0], {from: accounts[0]});
    }).then((supply) => {
      assert.equal(supply.valueOf(), 1, "Token has not been minted");
    })
  });

  it("should mint glue tokens", function() {
    return TokenFactory.deployed().then((factory) => {
      return factory.createToken([], [], [], {from: accounts[0]});
    }).then(async (instance) => {
      glueToken = await SCToken.at(instance.logs[0].args["contract_address"]);
      return glueToken.mint(200, [], [], [], [], [], [], {from: accounts[0]});
    }).then((receipt) => {
      relay.storeHeaderHash(receipt.receipt.blockHash, {from: accounts[0]});
      glueToken.transactionHash = receipt.tx;
      glueToken.headerHash = receipt.receipt.blockHash;
      glueToken.tokenId = web3.utils.toHex(receipt.logs[1].args[0]);
      return glueToken.balanceOf.call(accounts[0], {from: accounts[0]});
    }).then((supply) => {
      assert.equal(supply.valueOf(), 1, "Token has not been minted");
    })
  });

  it("should create table contract", async function() {
    const tokenFactory = await TokenFactory.deployed();
    const receipt = await tokenFactory.createToken(
      [relay.address, relay.address],
      [woodToken.address, glueToken.address],
      [1,2]
    );
    tableToken = await SCToken.at(receipt.logs[0].args["contract_address"]);
  })

  it("should burn wood token", async function() {
    const receipt = await woodToken.reduceContent(
      woodToken.tokenId,
      tableToken.address,
      1,
      1
    );
    await relay.storeHeaderHash(receipt.receipt.blockHash, {from: accounts[0]});
    woodToken.transactionHash = receipt.tx;
    woodToken.headerHash = receipt.receipt.blockHash
  });

  it("should burn glue token", async function() {
    const receipt = await glueToken.reduceContent(
      glueToken.tokenId,
      tableToken.address,
      1,
      2
    );
    await relay.storeHeaderHash(receipt.receipt.blockHash, {from: accounts[0]});
    glueToken.transactionHash = receipt.tx;
    glueToken.headerHash = receipt.receipt.blockHash;
  });

  it("should mint table tokens", async function() {
    const woodBlock = await web3.eth.getBlock(woodToken.headerHash);
    const woodPr = await prover.receiptProof(woodToken.transactionHash);
    const woodReceiptProof = prepareReceiptProof(woodPr);
    const woodRlpBlock = rlpEncodedBlock(woodBlock);

    const glueBlock = await web3.eth.getBlock(glueToken.headerHash);
    const gluePr = await prover.receiptProof(glueToken.transactionHash);
    const glueReceiptProof = prepareReceiptProof(gluePr);
    const glueRlpBlock = rlpEncodedBlock(glueBlock);

    // console.log('root: ', woodBlock.receiptsRoot);
    // console.log(woodRlpBlock);

    // console.log('defined hash: ', woodBlock.hash);
    // console.log('calculated hash: ', web3.utils.keccak256(woodRlpBlock));

    // console.log('index: ', woodPr.txIndex);
    // console.log('path: ',woodReceiptProof.path);
    // console.log('witness: ', woodReceiptProof.witness);
    // console.log('rlp receipt: ', woodReceiptProof.rlpEncodedReceipt);

    await tableToken.mint(
      1,
      [woodBlock.hash, glueBlock.hash],
      [woodRlpBlock, glueRlpBlock],
      [woodReceiptProof.rlpEncodedReceipt, glueReceiptProof.rlpEncodedReceipt],
      [woodReceiptProof.path, glueReceiptProof.path],
      [woodReceiptProof.witness, glueReceiptProof.witness],
      [1],
      {from: accounts[0]}
    );
    const balance = await tableToken.balanceOf.call(accounts[0], {from: accounts[0]});
    assert.equal(balance.valueOf(), 1, "Token has not been minted");
  });

  // it("should mint table tokens", function() {
  //   let factory;

  //   return TokenFactory.deployed().then((result) => {
  //     factory = result;
  //     return factory.createToken(
        
  //       [woodToken.address, glueToken.address],
  //       [1,2]);
  //   }).then(async (instance) => {
  //     tableToken = await SCToken.at(instance.logs[0].args["contract_address"]);
  //     return woodToken.approve(tableToken.address, woodTokenId);
  //   }).then(() => {
  //     return glueToken.approve(tableToken.address, glueTokenId);
  //   }).then(() => {
  //     return tableToken.mint(
  //       1,
  //       [woodToken.address, glueToken.address],
  //       [woodTokenId, glueTokenId],
  //       [1,2],
  //       {from: accounts[0]});
  //   }).then(() => {
  //     return tableToken.totalSupply.call({from: accounts[0]});
  //   }).then((supply) => {
  //     assert.equal(supply.valueOf(), 1, "Token has not been minted");
  //   });
  // });

  it("should certify wood", function() {
    return CertificateFactory.deployed().then((factory) => {
      return factory.createCertificate("FSC", {from: accounts[0]});
    }).then(async (instance) => {
      certificate = await Certificate.at(instance.logs[0].args["contract_address"]);
      return certificate.certifyGood(woodToken.address, {from: accounts[0]});
    }).then(() => {
      return certificate.hasGood(woodToken.address, {from: accounts[0]});
    }).then((result) => {
      assert.isTrue(result);
    });
  });

  // it("should mint table tokens with certificate", function() {
  //   let factory;
  //   let woodTokenId;
  //   let glueTokenId;

  //   return TokenFactory.deployed().then((result) => {
  //     factory = result;
  //     return woodToken.tokenByIndex.call(0, {from: accounts[0]});
  //   }).then((result) => {
  //     woodTokenId = result;
  //     return glueToken.tokenByIndex.call(0, {from: accounts[0]});
  //   }).then((result) => {
  //     glueTokenId = result;
  //     return factory.createToken(
  //       "table",
  //       "n--n",
  //       [certificate.address, glueToken.address],
  //       [1,2]);
  //   }).then(async (instance) => {
  //     tableToken = await SCToken.at(instance.logs[0].args["contract_address"]);
  //     return woodToken.approve(tableToken.address, woodTokenId);
  //   }).then(() => {
  //     return glueToken.approve(tableToken.address, glueTokenId);
  //   }).then(() => {
  //     return tableToken.mint(
  //       1,
  //       [woodToken.address, glueToken.address],
  //       [woodTokenId, glueTokenId],
  //       [1,2],
  //       {from: accounts[0]});
  //   }).then(() => {
  //     return tableToken.totalSupply.call({from: accounts[0]});
  //   }).then((supply) => {
  //     assert.equal(supply.valueOf(), 1, "Token has not been minted");
  //   });
  // });


})
