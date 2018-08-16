import mongoose from 'mongoose';
import fs from 'fs';
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

module.exports = mongoose.model('Contract', Contract);
