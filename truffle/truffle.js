require('babel-register');
require('babel-polyfill');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: 'localhost',
      port: 7545,
      network_id: '*'
    },
    rinkeby: {
      host: 'localhost', // Connect to geth on the specified
      port: 8545,
      network_id: 4, // 4 - rinkeby
      gas: 5612388 // Gas limit used for deploys
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 2000
    }
  }
};
