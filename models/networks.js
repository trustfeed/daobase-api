import Web3 from 'web3';
import config from '../config';
import * as te from '../typedError';

let rinkebyFull = new Web3(`https://rinkeby.infura.io/${config.infuraKey}`);

let rinkebyLight;

try {
  if (!config.rinkebyLightNode) {
    console.log('no light node available');
  } else {
    let prov = new Web3.providers.WebsocketProvider(
      config.rinkebyLightNode,
      {
        headers: {
          Origin: 'localhost',
        },
      });
    let w3 = new Web3(prov);
    w3.eth.getBlockNumber()
      .then(b => {
        rinkebyLight = w3;
      })
      .catch(err => {
        console.log(err);
      });
  }
} catch (err) { console.log(err); };

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
      return rinkebyFull;
    default:
      throw new Error('unknown network');
    }
  },

  // Get a connection to a (local) light node on the given network
  lightNode: async (network) => {
    switch (network) {
    case 'rinkeby':
      if (!rinkebyLight) {
        throw new te.TypedError(500, 'no light node available');
      } else {
        return rinkebyLight;
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
