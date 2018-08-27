import Web3 from 'web3';
import config from '../config';
import * as te from '../typedError';

const web3OnNetwork = async (network) => {
  switch (network) {
  case 'rinkeby':
    return new Web3(`https://rinkeby.infura.io/${config.infuraKey}`);
  case 'kovan':
    let prov = new Web3.providers.WebsocketProvider(
      'ws://kovan:21000', // config.kovanNode,
      {
        headers: {
          Origin: 'localhost',
        },
      });
    let w3 = new Web3(prov);
    return w3.eth.getBlockNumber()
      .then(b => {
        console.log('koven block:', b);
        return w3;
      })
      .catch(err => {
        console.log(err);
        throw new te.TypedError(500, 'parity connection error');
      });
  default:
    throw new Error('unknown network');
  }
};

export default web3OnNetwork;
