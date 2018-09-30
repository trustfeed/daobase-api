import { inject, injectable } from 'inversify';
import { MongoDBConnection } from '../utils/mongodb/connection';
import { stringToId } from '../utils/mongodb/stringToId';
import { Contract } from '../models/contract';
import TYPES from '../constant/types';
import { KYCApplication } from '../models/kycApplication';

const collectionName = 'kycApplication';

@injectable()
export class KYCApplicationService {
  private conn;

  constructor() {
    MongoDBConnection.getConnection(conn => {
      this.conn = conn;
    });
  }

  async insert(application: KYCApplication): Promise<KYCApplication> {
    return new Promise<KYCApplication>((resolve, reject) => {
      this.conn.collection(collectionName)
        .insert(application, (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
    });
  }

  async update(application: KYCApplication): Promise<KYCApplication> {
    return new Promise<KYCApplication>((resolve, reject) => {
      this.conn.collection(collectionName)
        .update(
	{ _id: application._id },
	{ $set: application },
	(error, data) => {
  if (error) {
    reject(error);
  } else {
    resolve(data);
  }
});
    });
  }
}
