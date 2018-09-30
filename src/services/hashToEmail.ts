import { inject, injectable } from 'inversify';
import { MongoDBConnection } from '../utils/mongodb/connection';
import { HashToEmail } from '../models/hashToEmail';
import TYPES from '../constant/types';

const collectionName = 'hashToEmail';

@injectable()
export class HashToEmailService {
  private conn;

  constructor() {
    MongoDBConnection.getConnection(conn => {
      this.conn = conn;
      conn.collection(collectionName).createIndex(
        'hash',
        { name: 'hash', unique: true });
    });
  }

  async insert(hash: HashToEmail): Promise<HashToEmail> {
    return new Promise<HashToEmail>((resolve, reject) => {
      this.conn.collection(collectionName)
        .insertOne(hash, (error, data) => {
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
      this.conn.collection(collectionName)
        .findOne({ hash }, (error, data: HashToEmail) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
    });
  }
}
