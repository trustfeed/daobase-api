import { inject, injectable } from 'inversify';
import { MongoDBConnection } from '../utils/mongodb/connection';
import { stringToId } from '../utils/mongodb/stringToId';
import TYPES from '../constant/types';
import * as hc from '../models/hostedCampaign';
import { Base64 } from 'js-base64';
import { Web3Service } from 'web3';

const collectionName = 'hostedCampaign';

@injectable()
export class HostedCampaignService {
  private conn;

  constructor(
    @inject(TYPES.Web3Service) private web3Service: Web3Service
  ) {
    MongoDBConnection.getConnection(conn => {
      this.conn = conn;
      conn.collection(collectionName).createIndex(
        'ownerId',
        { name: 'ownerId' });

      conn.collection(collectionName).createIndex(
        'updatedAt',
        { name: 'updatedAt' });

      conn.collection(collectionName).createIndex(
        'campaignStatus',
        { name: 'campaignStatus' });
    });
  }

  public insert(hostedCampaign: hc.HostedCampaign): Promise<hc.HostedCampaign> {
    return new Promise<hc.HostedCampaign>((resolve, reject) => {
      this.conn.collection(collectionName)
        .insert(hostedCampaign, (error, data: hc.HostedCampaign) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
    });
  }

  public update(hostedCampaign: hc.HostedCampaign): Promise<any> {
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

  public findById(idString: string): Promise<hc.HostedCampaign> {
    const id = stringToId(idString);
    return (new Promise<hc.HostedCampaign>((resolve, reject) => {
      this.conn.collection(collectionName)
        .findOne({ _id: id }, (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
    })).then(campaign => {
      if (campaign) {
        hc.periodicUpdate(campaign, this.web3Service, this).catch(e => {
          console.log('periodic update failed:', e.message);
        });
      }
      return campaign;
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
    }).then(out => {
      Promise.all(out.campaigns.map(campaign => {
        return hc.periodicUpdate(campaign, this.web3Service, this);
      })).catch(e => {
        console.log('periodic update failed:', e.message);
      });
      return out;
    });
  }

  public async findAllPublic(offset?: string): Promise<any> {
    const pageSize = 20;
    let query: any = {
      'campaignStatus': { $in: [
        hc.HOSTED_CAMPAIGN_STATUS_DEPLOYED,
        hc.HOSTED_CAMPAIGN_STATUS_PENDING_OFF_CHAIN_REVIEW,
        hc.HOSTED_CAMPAIGN_STATUS_PENDING_FINALISATION_SUBMISSION,
        hc.HOSTED_CAMPAIGN_STATUS_PENDING_FINALISATION_CONFIRMATION,
        hc.HOSTED_CAMPAIGN_STATUS_PENDING_FINALISATION_EXECUTION,
        hc.HOSTED_CAMPAIGN_STATUS_FINALISED
      ]}};
    if (offset) {
      query.updatedAt = {
        $lt: new Date(Number(Base64.decode(offset)))
      };
    }
    return (new Promise<any>((resolve, reject) => {
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
    })).then(out => {
      Promise.all(out.campaigns.map(campaign => {
        hc.periodicUpdate(campaign, this.web3Service, this);
      })).catch(e => {
        console.log('periodic update failed:', e.message);
      });
      return out;
    });
  }

  public async toReview(offset ?: string): Promise < any > {
    const pageSize = 20;
    let query: any = {
      'campaignStatus': { $in: [
        hc.HOSTED_CAMPAIGN_STATUS_PENDING_REVIEW,
        hc.HOSTED_CAMPAIGN_STATUS_PENDING_OFF_CHAIN_REVIEW
      ]}};
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

  public async toFinalise(offset ?: string): Promise < any > {
    const pageSize = 20;
    const query: any = { campaignStatus: hc.HOSTED_CAMPAIGN_STATUS_PENDING_FINALISATION_CONFIRMATION };
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
