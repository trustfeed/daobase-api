import Web3 from 'web3';
import config from '../config';

const web3OnNetwork = (network) => {
  switch (network) {
  case 'rinkeby':
    return new Web3(`https://rinkeby.infura.io/${config.infuraKey}`);
  default:
    throw new Error('unknown network');
  }
};

export default web3OnNetwork;
