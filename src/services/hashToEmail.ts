import { inject, injectable } from 'inversify';
import { MongoDBClient } from '../utils/mongodb/client';
import { MongoDBConnection } from '../utils/mongodb/connection';
import { HashToEmail } from '../models/hashToEmail';
import TYPES from '../constant/types';

const collectionName = 'hashToEmail';

@injectable()
export class HashToEmailService {
  private mongoClient: MongoDBClient;

  constructor(
    @inject(TYPES.MongoDBClient) mongoClient: MongoDBClient
  ) {
    this.mongoClient = mongoClient;

    MongoDBConnection.getConnection(result => {
      result.collection(collectionName).createIndex(
	      'hash',
	      { name: 'hash', unique: true });
    });
  }

  async insert(hash: HashToEmail): Promise<HashToEmail> {
    return new Promise<HashToEmail>((resolve, reject) => {
      this.mongoClient.insert(collectionName, hash, (error, data: HashToEmail) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  async findByHash(hash: string): Promise<HashToEmail> {
    return new Promise<HashToEmail>((resolve, reject) => {
      this.mongoClient.findOne(collectionName, { hash }, (error, data: HashToEmail) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }
// HashToEmail.statics.findOneByHash = function(hash) {
//  return this.findOne({
//    hash
//  }).exec();
// };

}
