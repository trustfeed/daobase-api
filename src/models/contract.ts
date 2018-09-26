import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Networks from './networks';
const Schema = mongoose.Schema;

const Contract = new Schema({
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  name: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true
  },
  abi: {
    type: String,
    required: true
  },
  bytecode: {
    type: String,
    required: true
  },
  sourceMap: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  compiler: {
    type: String,
    required: true
  }
});

Contract.index(
  {
    name: 1,
    version: 1
  },
  {
    unique: true
  }
);

const listFilesPromise = dirname => {
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

Contract.statics.addFromFile = function(fname) {
  const fnameBuffer: Buffer = fs.readFileSync(fname);
  const obj = JSON.parse(fnameBuffer.toString());
  return this.deleteOne({
    name: obj.contractName,
    version: obj.contractVersion
  }).then(data => {
    const contract = this({
      createdAt: Date.now(),
      name: obj.contractName,
      version: obj.contractVersion,
      abi: JSON.stringify(obj.abi),
      bytecode: obj.bytecode,
      sourceMap: obj.sourceMap,
      source: obj.source,
      compiler: obj.source
    });
    return contract.save();
  });
};

Contract.statics.migrateAll = async function() {
  const dirName = 'contracts';
  const procFile = fname => this.addFromFile(path.join(dirName, fname)).catch(console.log);

  // TODO: check next line and remove type any
  const files: any = await listFilesPromise(dirName);
  return Promise.all(files.map(procFile));
};

Contract.methods.makeDeployment = async function(network, args) {
  const web3 = await Networks.node(network);
  const contract = new web3.eth.Contract(JSON.parse(this.abi));
  const deploy = contract.deploy({
    data: this.bytecode,
    arguments: args
  });
  return {
    transaction: deploy.encodeABI()
  };
  // return deploy
  // .estimateGas()
  // .then(cost => {
  //  return { estimatedGas: cost, transaction: deploy.encodeABI() };
  // });
};

const ContractModel: any = mongoose.model('Contract', Contract);
export default ContractModel;
