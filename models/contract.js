import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import web3OnNetwork from './networks';
const Schema = mongoose.Schema;

const Contract = new Schema({
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  name: {
    type: String,
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
  abi: {
    type: String,
    required: true,
  },
  bytecode: {
    type: String,
    required: true,
  },
  sourceMap: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  compiler: {
    type: String,
    required: true,
  },
});

Contract.index({ name: 1, version: 1 }, { unique: true });

const readFilePromise = (fname) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fname, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const listFilesPromise = (dirname) => {
  return new Promise((resolve, reject) => {
    fs.readdir(dirname, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

Contract.statics.addFromFile = function (fname) {
  return readFilePromise(fname)
    .then(data => {
      let obj;
      try {
        obj = JSON.parse(data);
      } catch (err) {
        throw new Error(err);
      }
      const contract = this({
        createdAt: Date.now(),
        name: obj.contractName,
        version: obj.contractVersion,
        abi: JSON.stringify(obj.abi),
        bytecode: obj.bytecode,
        sourceMap: obj.sourceMap,
        source: obj.source,
        compiler: obj.source,
      });
      return contract.save();
    });
};

Contract.statics.migrateAll = function () {
  const dirName = 'contracts';
  const procFile = (fname) => this.addFromFile(path.join(dirName, fname)).catch(console.log);
  return listFilesPromise(dirName)
    .then(fs => {
      return Promise.all(fs.map(procFile));
    });
};

Contract.methods.makeDeployment = function (network, args) {
  let out;
  const web3 = web3OnNetwork(network);
  const contract = new web3.eth.Contract(JSON.parse(this.abi));
  const deploy = contract.deploy({ data: this.bytecode, arguments: args });
  return deploy
    .estimateGas()
    .then(cost => {
      return { estimatedGas: cost, deployData: deploy.encodeABI() };
    })
    .then(o => {
      out = o;
      return web3.eth.sendTransaction(
        { from: '0x6706F448034E7f3eFF07fA31D6B3EB2dCf8149c8',
          data: out.deployData,
          gas: 2 * out.estimatedGas,
        });
    })
    .then(() => {
      return out;
    });
};

module.exports = mongoose.model('Contract', Contract);
