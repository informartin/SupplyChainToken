module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      gas: 4712388,
      network_id: "*" // Match any network id
    },
    powtestnet: {
      host: "127.0.0.1",
      port: 9545,
      gas: 4712388,
      network_id: "*" // Match any network id
    }
  },


  compilers: {
    solc: {
      version:"^0.5.5",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200   // Optimize for how many times you intend to run the code
        },
      },
    }
  }
}
