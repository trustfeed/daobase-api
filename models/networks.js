import Web3 from 'web3';
import config from '../config';
import * as te from '../typedError';

const web3OnNetwork = async (network) => {
  switch (network) {
  case 'rinkeby':
    // return new Web3(`https://rinkeby.infura.io/${config.infuraKey}`);
    let prov = new Web3.providers.WebsocketProvider(
      config.rinkebyNode,
      {
        headers: {
          Origin: 'api.tokenadmin.work',
        },
      });
    let w3 = new Web3(prov);
    return w3.eth.getBlockNumber()
      .then(() => {
        return w3;
      })
      .catch(err => {
        console.log(err);
        return new Web3(`https://rinkeby.infura.io/${config.infuraKey}`);
      });
  default:
    throw new Error('unknown network');
  }
};

export default web3OnNetwork;
