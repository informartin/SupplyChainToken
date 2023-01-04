var TokenFactory = artifacts.require("TokenFactory");
var SCToken = artifacts.require("SCToken");

contract('SCToken', function(accounts) {
    const iterations = 50;

    it("should mint multiple wood tokens", async function() {
        const factory = await TokenFactory.deployed();
        const instance = await factory.createToken("wood", "===", [], [], {from: accounts[0]});
        woodToken = await SCToken.at(instance.logs[0].args["contract_address"]);

        console.log('Token address: ', woodToken.address);

        let tokenPromises = [];
        for(i = 0; i < iterations; i++) {
            tokenPromises.push(woodToken.mint(i, [], [], [], {from: accounts[0]}));
        }
        await Promise.all(tokenPromises);
        const supply = await woodToken.totalSupply.call({from: accounts[0]});
        assert.equal(supply.valueOf(), iterations, `${supply.valueOf()} tokens were minted, expected ${iterations}`);
    });
});