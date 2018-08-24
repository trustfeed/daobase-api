import web3OnNetwork from '../models/networks';
import fs from 'fs';
import EthereumTx from 'ethereumjs-tx';

const contractData = JSON.parse(fs.readFileSync('contracts/TrustFeedCampaignRegistry.json'));
var web3 = web3OnNetwork(process.argv[2]);

// const accnt = web3.eth.accounts.privateKeyToAccount(process.argv[4]);
//
// console.log(accnt);
// accnt.signTransaction({
//  from: process.argv[3],
//  to: '0x899d17f34e7f9f5f0fc54dabad4d61ac4a40ba36',
//  value: '1',
//  gas: '1',
//  gasPrice: '1',
// })
//  .then(tx => {
//    console.log(tx);
//    return web3.eth.sendSignedTransaction(tx.rawTransaction);
//  })
//  .then(console.log);
//

const contract = new web3.eth.Contract(contractData.abi);
const deploy = contract.deploy({ data: contractData.bytecode });
deploy
  .estimateGas()
  .then(cost => {
    // return accnt.signTransaction({ data: deploy.encodeABI(), gas: Math.round(1.5 * cost), from: process.argv[3] });
  });
/// /  .then(tx => {
/// /    console.log(tx);
/// /    return web3.eth.sendSignedTransaction(tx);
/// /  })
/// /  .then(console.log);
