import Web3 from 'web3';
import config from '../config';
import * as te from '../typedError';

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
  fullNode: async (network) => {
    switch (network) {
    case 'rinkeby':
      return new Web3(`https://rinkeby.infura.io/${config.infuraKey}`);
    default:
      throw new Error('unknown network');
    }
  },

  // Get a connection to a (local) light node on the given network
  lightNode: async (network) => {
    switch (network) {
    case 'rinkeby':
      if (!config.rinkebyLightNode) {
        throw new te.TypedError(500, 'no light node available');
      } else {
        let prov = new Web3.providers.WebsocketProvider(
          config.rinkebyLightNode,
          {
            headers: {
              Origin: 'localhost',
            },
          });
        let w3 = new Web3(prov);
        return w3.eth.getBlockNumber()
          .then(b => {
            console.log('rinkeby block:', b);
            return w3;
          })
          .catch(err => {
            console.log(err);
            throw new te.TypedError(500, 'cannot connect to light node');
          });
      }
    default:
      throw new Error('unknown network');
    }
  },

  fastestNode: async (network) => {
    let web3;
    try {
      web3 = await Networks.lightNode(network);
    } catch (err) {
      console.log('cannot connect to light node');
      web3 = await Networks.fullNode(network);
    }
    return web3;
  },
};

export default Networks;
