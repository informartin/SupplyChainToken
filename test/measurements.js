var TokenFactory = artifacts.require("TokenFactory");
var SCToken = artifacts.require("SCToken");
var Relay = artifacts.require("Relay");

const { prepareReceiptProof, rlpEncodedBlock } = require("./utils.js")
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { GetProof } = require("eth-proof");

const deployment_iterations = 1;
const increase_supply_iterations = 5;

const jsonRpcUrl = "http://localhost:7545"
const prover = new GetProof(jsonRpcUrl);

contract('SCToken', function(accounts) {

  var relay;
  var results = [];

  it("should deploy relay contract", async function() {
    relay = await Relay.deployed();
  });

  it("measure deployment cost", async function() {
    var factory = await TokenFactory.deployed();
    var gas_costs = [];

    for(i = 0; i < deployment_iterations; i++) {

      var relay_addresses = [];
      var inputAddresses = [];
      var inputAmounts = [];


      for(a = 0; a < i; a++) {
        inputAddresses.push("0xB64Ddd3b9c348B891E0A6640BffF3Fda3b6dE110");
        relay_addresses.push("0xB64Ddd3b9c348B891E0A6640BffF3Fda3b6dE110")
        inputAmounts.push(10);
      }
      let contract = await factory.createToken(
        relay_addresses,
        inputAddresses,
        inputAmounts,
        {from: accounts[0]});
      gas_costs.push({
        number: i,
        gas_costs: contract.receipt.cumulativeGasUsed
      })
    }
    if(gas_costs.length > 0) {
      const csvWriter = createCsvWriter({
          path: 'measurements/erc721_deployment_costs.csv',
          header: [
              {id: 'number', title: 'NUMBER'},
              {id: 'gas_costs', title: 'GAS_COSTS'}
          ]
      });
      csvWriter.writeRecords(gas_costs)       // returns a promise
      .then(() => {
          console.log('CSV written');
      });
    }
    return true;
  });

  it("measure increasing supply costs", async function() {
    this.timeout(0);
    var factory;
    var tokens = [];
    var relay_addresses = [];
    var contract_addresses = [];
    var batches_uid = [];
    var amounts = [];
    factory = await TokenFactory.deployed();
    for (i = 0; i < increase_supply_iterations; i++) {
      //let contract_addresses = tokens.map((c_address) => c_address.slice(0,42));
      //let batches_uid = tokens.map((c_address) => "0x".concat(c_address.slice(42,c_address.length)));
      let token = await factory.createToken(
        relay_addresses,
        contract_addresses,
        amounts,
        {from: accounts[0]}
      );
      let address = token.logs[0]["args"]["contract_address"];
      console.log(i+1, ". contract address: ", address);
      blockHashes = [];
      receiptProofs =  [];
      rlpBlocks = [];
      let cumulative_gas = 0;

      var cumStartTime = performance.now();

      for (j = 0; j < contract_addresses.length; j++) {
        let inst = await SCToken.at(contract_addresses[j]);
        const receipt = await inst.reduceContent(
          batches_uid[j],
          address,
          1,
          1
        );
        await relay.storeHeaderHash(receipt.receipt.blockHash, {from: accounts[0]});
        cumulative_gas += receipt["receipt"]["cumulativeGasUsed"];
        const block = await web3.eth.getBlock(receipt.receipt.blockHash);
        blockHashes.push(block.hash);
        const pr = await prover.receiptProof(receipt.tx);
        receiptProofs.push(prepareReceiptProof(pr))
        rlpBlocks.push(rlpEncodedBlock(block));
        // await inst.approve(address, batches_uid[j], {from: accounts[0]});
      }
      let tokenInstance = await SCToken.at(address);
      var startTime = performance.now();
      let batchResult = await tokenInstance.mint(
        increase_supply_iterations-i,
        blockHashes,
        rlpBlocks,
        receiptProofs.map(proof => proof.rlpEncodedReceipt),
        receiptProofs.map(proof => proof.path),
        receiptProofs.map(proof => proof.witness),
        Array(blockHashes.length).fill(1)
      )
      var cumEndTime = performance.now()
      var endTime = performance.now()
      // let batchResult = await tokenInstance.mint(increase_supply_iterations-i, contract_addresses, batches_uid, amounts, {from: accounts[0]});
      // let batch_uid = await tokenInstance.tokenByIndex.call(0, {from: accounts[0]});
      let batch_uid = batchResult.logs[1]["args"]["batchId"];
      contract_addresses.push(address);
      relay_addresses.push(relay.address)
      batches_uid.push(batch_uid);
      amounts.push(1);
      results.push({
        number: i,
        gas_costs: batchResult["receipt"]["cumulativeGasUsed"],
        cumulative_gas: cumulative_gas + batchResult["receipt"]["cumulativeGasUsed"],
        time: endTime - startTime,
        cumulative_time: cumEndTime - cumStartTime
      });
    }
    
  });

  it("should store results", () => {
    if(results.length > 0) {
      const csvWriter = createCsvWriter({
          path: 'measurements/erc721_creation_costs.csv',
          header: [
              {id: 'number', title: 'NUMBER'},
              {id: 'gas_costs', title: 'GAS_COSTS'},
              {id: 'cumulative_gas', title: 'CUMULATIVE_GAS_COSTS'},
              {id: 'time', title: 'TIME_MS'},
              {id: 'cumulative_time', title: 'CUMULATIVE_TIME_MS'}
          ]
      });

      csvWriter.writeRecords(results)
        .then(() => {
            console.log('CSV written');
        });
    }
  })
})
