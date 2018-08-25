import Web3 from 'web3';
import config from '../config';
import * as te from '../typedError';

const web3OnNetwork = (network) => {
  switch (network) {
  case 'rinkeby':
    // return new Web3(`https://rinkeby.infura.io/${config.infuraKey}`);
    let prov = new Web3.providers.WebsocketProvider(
      config.rinkebyNode,
      {
        headers: {
          Origin: 'localhost',
        },
      });
    let w3 = new Web3(prov);
    // if (w3.isConnected()) {
    return w3.eth.getBlockNumber()
      .then(() => {
        return w3;
      })
      .catch(err => {
        console.log(err);
        throw new te.TypedError(500, 'cannot connect to web3');
      });
    // } else {
    //  throw new te.TypedError(500, 'cannot connect to web3');
    // }
  default:
    throw new Error('unknown network');
  }
};

export default web3OnNetwork;
