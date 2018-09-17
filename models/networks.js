import Web3 from 'web3';
import config from '../config';
import * as te from '../typedError';

let rinkebyInfura = new Web3('wss://rinkeby.infura.io/ws');

const Networks = {
  // The networs we support
  supported: ['rinkeby'],

  registry: (network) => {
    switch (network) {
    case 'rinkeby':
      return '0xB900F568D3F54b5DE594B7968e68181fC45fCAc6';
    default:
      throw new Error('unknown network');
    }
  },

  // Get a connection to a full node on the given network
  node: async (network) => {
    switch (network) {
    case 'rinkeby':
      return rinkebyInfura;
    default:
      throw new Error('unknown network');
    }
  },
};

export default Networks;
