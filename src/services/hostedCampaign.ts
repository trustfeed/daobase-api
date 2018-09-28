import { inject, injectable } from 'inversify';
import { MongoDBClient } from '../utils/mongodb/client';
import { MongoDBConnection } from '../utils/mongodb/connection';
import { stringToId } from '../utils/mongodb/stringToId';
import { Contract } from '../models/contract';
import TYPES from '../constant/types';
import { HostedCampaign } from '../models/hostedCampaign';
import { Base64 } from 'js-base64';

const collectionName = 'hostedCampaign';

@injectable()
export class HostedCampaignService {
  private mongoClient: MongoDBClient;

  constructor(
    @inject(TYPES.MongoDBClient) mongoClient: MongoDBClient
  ) {
    this.mongoClient = mongoClient;

    MongoDBConnection.getConnection(result => {
      result.collection(collectionName).createIndex(
        'ownerId',
        { name: 'ownerId' });

      result.collection(collectionName).createIndex(
        'updatedAt',
        { name: 'updatedAt' });
    });
  }

  public insert(hostedCampaign: HostedCampaign): Promise<HostedCampaign> {
    return new Promise<HostedCampaign>((resolve, reject) => {
      this.mongoClient.insert(collectionName, hostedCampaign, (error, data: HostedCampaign) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  public findByOwner(ownerId: string, offset?: string): Promise<any> {
    const pageSize = 20;
    const id = stringToId(ownerId);
    let query: any;
    query = { ownerId : id };
    if (offset != null) {
      query.updatedAt = {
        $lt: new Date(Number(Base64.decode(offset)))
      };
    }

    return new Promise<any>((resolve, reject) => {
      this.mongoClient.db.collection(collectionName)
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(pageSize)
      .toArray((error, data) => {
        if (error) {
          reject(error);
        } else {
          let nextOffset;
          if (data.length === pageSize) {
            nextOffset = Base64.encode(data[data.length - 1].updatedAt.getTime());
          }
          resolve({
            campaigns: data,
            next: nextOffset
          });
        }
      });
    });
  }
}
