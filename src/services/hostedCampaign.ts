import { inject, injectable } from 'inversify';
import { MongoDBConnection } from '../utils/mongodb/connection';
import { stringToId } from '../utils/mongodb/stringToId';
import TYPES from '../constant/types';
import { HostedCampaign,
	HOSTED_CAMPAIGN_STATUS_DEPLOYED,
	HOSTED_CAMPAIGN_STATUS_PENDING_OFF_CHAIN_REVIEW,
        HOSTED_CAMPAIGN_STATUS_PENDING_REVIEW } from '../models/hostedCampaign';
import { Base64 } from 'js-base64';

const collectionName = 'hostedCampaign';

@injectable()
export class HostedCampaignService {
  private conn;

  constructor() {
    MongoDBConnection.getConnection(conn => {
      this.conn = conn;
      conn.collection(collectionName).createIndex(
        'ownerId',
        { name: 'ownerId' });

      conn.collection(collectionName).createIndex(
        'updatedAt',
        { name: 'updatedAt' });
    });
  }

  public insert(hostedCampaign: HostedCampaign): Promise<HostedCampaign> {
    return new Promise<HostedCampaign>((resolve, reject) => {
      this.conn.collection(collectionName)
        .insert(hostedCampaign, (error, data: HostedCampaign) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
    });
  }

  public update(hostedCampaign: HostedCampaign): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.conn.collection(collectionName)
        .update(
          { _id: stringToId(hostedCampaign._id) },
          { $set: hostedCampaign },
	  (error, data) => {
    if (error) {
      reject(error);
    } else {
      resolve(data);
    }
  });
    });
  }

  public findById(idString: string): Promise<HostedCampaign> {
    const id = stringToId(idString);
    return new Promise<HostedCampaign>((resolve, reject) => {
      this.conn.collection(collectionName)
        .findOne({ _id: id }, (error, data) => {
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
      this.conn.collection(collectionName)
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

  public async findAllPublic(offset?: string): Promise<any> {
    const pageSize = 20;
    let query: any = {
      $or: [
        {
          'campaignStatus': HOSTED_CAMPAIGN_STATUS_DEPLOYED
        },
        {
          'campaignStatus': HOSTED_CAMPAIGN_STATUS_PENDING_OFF_CHAIN_REVIEW
        }
      ]};
    if (offset) {
      query.updatedAt = {
        $lt: new Date(Number(Base64.decode(offset)))
      };
    }
    return new Promise<any>((resolve, reject) => {
      this.conn.collection(collectionName)
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

  public async toReview(offset?: string): Promise<any> {
    const pageSize = 20;
    const query: any = { $or: [
	    { campaignStatus: HOSTED_CAMPAIGN_STATUS_PENDING_REVIEW },
	    { campaignStatus: HOSTED_CAMPAIGN_STATUS_PENDING_OFF_CHAIN_REVIEW } ]};
    if (offset) {
      query._id = { $gt: Base64.decode(offset) };
    }

    return new Promise<any>((resolve, reject) => {
      this.conn.collection(collectionName)
        .find(query)
	.sort({ _id: 1 })
	.limit(pageSize)
	.toArray((error, data) => {
  if (error) {
    reject(error);
  } else {
    let nextOffset;
    if (data.length === pageSize) {
      nextOffset = Base64.encode(data[data.length - 1]._id.toString());
    }
    resolve({ nextOffset, campaigns: data });
  }
});
    });
  }

  public forEach(func) {
    if (MongoDBConnection.isConnected()) {
      this.conn.collection(collectionName)
      .find()
      .forEach(func);
    } else {
      setTimeout(() => this.forEach(func), 1000);
    }
  }
}
