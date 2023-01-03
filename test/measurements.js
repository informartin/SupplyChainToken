var TokenFactory = artifacts.require("TokenFactory");
var CertificateFactory = artifacts.require("CertificateFactory");
var SCToken = artifacts.require("SCToken");
var Certificate = artifacts.require("Certificate");

var BigNumber = require('bignumber.js');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const deployment_iterations = 1;
const increase_supply_iterations = 10;

contract('SCToken', function(accounts) {

    it("measure deployment cost", async function() {
      var factory = await TokenFactory.deployed();
      var gas_costs = [];

      for(i = 0; i < deployment_iterations; i++) {

        var inputAddresses = [];
        var inputAmounts = [];

        for(a = 0; a < i; a++) {
          inputAddresses.push("0xB64Ddd3b9c348B891E0A6640BffF3Fda3b6dE110");
          inputAmounts.push(10);
        }
        let contract = await factory.createToken(
                            "wood",
                            "===",
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
      var factory;
      var tokens = [];
      var contract_addresses = [];
      var batches_uid = [];
      var amounts = [];
      var gas_costs = [];
      factory = await TokenFactory.deployed();
      for (i = 0; i < increase_supply_iterations; i++) {
        //let contract_addresses = tokens.map((c_address) => c_address.slice(0,42));
        //let batches_uid = tokens.map((c_address) => "0x".concat(c_address.slice(42,c_address.length)));
        let token = await factory.createToken(
          "wood",
          "===",
          contract_addresses,
          amounts,
          {from: accounts[0]}
        );
        let address = token.logs[0]["args"]["contract_address"];
        console.log(i+1, ". contract address: ", address);
        for (j = 0; j < contract_addresses.length; j++) {
          let inst = await SCToken.at(contract_addresses[j]);
          await inst.approve(address, batches_uid[j], {from: accounts[0]});
        }
        let tokenInstance = await SCToken.at(address);
        let batchResult = await tokenInstance.mint(increase_supply_iterations-i, contract_addresses, batches_uid, amounts, {from: accounts[0]});
        let batch_uid = await tokenInstance.tokenByIndex.call(0, {from: accounts[0]});
        contract_addresses.push(address);
        batches_uid.push(batch_uid);
        amounts.push(1);
        gas_costs.push({
          number: i,
          gas_costs: batchResult["receipt"]["cumulativeGasUsed"]
        });
      }
      if(gas_costs.length > 0) {
        const csvWriter = createCsvWriter({
            path: 'measurements/erc721_creation_costs.csv',
            header: [
                {id: 'number', title: 'NUMBER'},
                {id: 'gas_costs', title: 'GAS_COSTS'}
            ]
        });

        csvWriter.writeRecords(gas_costs)
          .then(() => {
              console.log('CSV written');
          });
      }
    });
})
