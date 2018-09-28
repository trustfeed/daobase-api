import { inject, injectable } from 'inversify';
import { MongoDBClient } from '../utils/mongodb/client';
import { MongoDBConnection } from '../utils/mongodb/connection';
import { stringToId } from '../utils/mongodb/stringToId';
import { Contract } from '../models/contract';
import TYPES from '../constant/types';

const collectionName = 'contract';

@injectable()
export class ContractService {
  private mongoClient: MongoDBClient;

  constructor(
    @inject(TYPES.MongoDBClient) mongoClient: MongoDBClient
  ) {
    this.mongoClient = mongoClient;

    MongoDBConnection.getConnection(async result => {
      result.collection(collectionName).createIndex(
	      { 'name' : 1, 'version': 1 },
	      { name: 'nameVersion', unique: true });

      console.log('reading the files');
      try {
        const cs = await Contract.loadAllFiles();
        await Promise.all(cs.map(this.upsert)).catch(console.log);
        console.log('got all the files');
      } catch (err) {
        console.log(err);
      }
    });
  }

  async findByNameVersion(name: string, version: string): Promise<Contract> {
    return new Promise<Contract>((resolve, reject) => {
      this.mongoClient.findOne(collectionName, { name, version }, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  async upsert(contract: Contract): Promise<Contract> {
    const existing = await this.findByNameVersion(contract.name, contract.version);
    if (existing == null) {
      return new Promise<Contract>((resolve, reject) => {
        this.mongoClient.insert(collectionName, contract, (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
      });
    } else if (existing.bytecode !== contract.bytecode) {
      return new Promise<Contract>((resolve, reject) => {
        this.mongoClient.update(collectionName, existing._id, contract, (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
      });
    } else {
      return existing;
    }
  }
}
