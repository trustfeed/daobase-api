import { inject, injectable } from 'inversify';
import { MongoDBClient } from '../utils/mongodb/client';
import { MongoDBConnection } from '../utils/mongodb/connection';
import { stringToId } from '../utils/mongodb/stringToId';
import { Contract } from '../models/contract';
import TYPES from '../constant/types';
import { KYCApplication } from '../models/kycApplication';

const collectionName = 'kycApplication';

@injectable()
export class KYCApplicationService {
  private mongoClient: MongoDBClient;

  constructor(
    @inject(TYPES.MongoDBClient) mongoClient: MongoDBClient
  ) {
    this.mongoClient = mongoClient;
  }

  async insert(application: KYCApplication): Promise<KYCApplication> {
    return new Promise<KYCApplication>((resolve, reject) => {
      this.mongoClient.insert(collectionName, application, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  async update(id: string, application: KYCApplication): Promise<KYCApplication> {
    return new Promise<KYCApplication>((resolve, reject) => {
      this.mongoClient.update(collectionName, id, application, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }
}
