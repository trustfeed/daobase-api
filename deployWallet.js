const Web3 = require('web3');
const fs = require('fs');
const Tx = require('ethereumjs-tx');

const contractData = JSON.parse(fs.readFileSync('contracts/v0.0.0/TrustFeedWallet.json'));
// const web3 = new Web3('https://rinkeby.infura.io/b71b5516edee43848e35e8bae83d0e7c');
const web3 = new Web3('https://parity.trustfeed.io:443');

// const accnt = web3.eth.accounts.privateKeyToAccount('0xBAF0932EB57241CC79A5C1A9AB3C71F9BFE66784B2A22ACE642240E5D51300EF');
//
// const deploy = async (contract) => {
//  const deploy = contract.deploy({
//    data: contractData.bytecode,
//    arguments: [
//      [ '0x3aa9ce734dd21fa5e6962978e2ccc7f4ac513348',
//        '0x6f814186177b3dc28d39136d44afd496546ebc57',
//        '0x211470a95e861c540184e687c9ddb44400b43824' ],
//      1] });
//  let gas = await deploy.estimateGas();
//  let gasPrice = await web3.eth.getGasPrice();
//  gas = web3.utils.toHex(gas);
//  gasPrice = web3.utils.toHex(gasPrice);
//
//  // let tx = new Tx({
//  //  data: deploy.encodeABI(),
//  //  gas: gas,
//  //  gasPrice: gasPrice,
//  //  from: '0x90af460235cb9fb28956b45e9d80aac3dc3bd74e',
//  //  value: web3.utils.toHex('0'),
//  //  chainId: '4',
//  //  nonce: '0',
//  // });
//  // let privateKey = Buffer.from('BAF0932EB57241CC79A5C1A9AB3C71F9BFE66784B2A22ACE642240E5D51300EF'.toLowerCase(), 'hex');
//  // tx.sign(privateKey);
//  // let sTx = tx.serialize();
//  // return web3.eth.sendSignedTransaction('0x' + sTx.toString('hex'));
//
//  let tx = await accnt.signTransaction({
//    data: deploy.encodeABI(),
//    gas: gas,
//    gasPrice: gasPrice,
//    from: '0x90af460235cb9fb28956b45e9d80aac3dc3bd74e',
//    value: web3.utils.toHex('0'),
//    // chainId: '4',
//    // nonce: '0'
//  });
//  console.log(tx);
//  return web3.eth.sendSignedTransaction(tx.rawTransaction);
// };
//
// const contract = new web3.eth.Contract(contractData.abi);
/// / cost(contract);
// deploy(contract).then(console.log).catch(console.log);
//
const wallet = new web3.eth.Contract(contractData.abi, '0x40776a2cEC264c7762A4f58ef50Dd5A4B06916F5');
wallet.methods.owners(0).call().then(console.log);
wallet.methods.owners(1).call().then(console.log);
wallet.methods.owners(2).call().then(console.log);
wallet.methods.getOwners().call().then(console.log);
