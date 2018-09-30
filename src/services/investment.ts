import { inject, injectable } from 'inversify';
import { MongoDBConnection } from '../utils/mongodb/connection';
import { stringToId } from '../utils/mongodb/stringToId';
import { Contract } from '../models/contract';
import TYPES from '../constant/types';
import { HostedCampaign } from '../models/hostedCampaign';
import { Base64 } from 'js-base64';
import { Investment } from '../models/investment';
import { TypedError } from '../utils';

const collectionName = 'investment';
const pageSize = 20;

const makeSort = (order) => {
  switch (order) {
    case 'symbol':
      return { 'tokenSymbol': 1 };
      break;
    case 'name':
      return { 'tokenName': 1 };
      break;
      // TODO: This is lexicographical not numeric
    case 'owned':
      return { 'owned': 1 };
      break;
    default:
      throw new TypedError(401, 'unknown order');
  }
};

const addOffset = (query, order, offset) => {
  switch (order) {
    case 'symbol':
      query.tokenSymbol = { $gt: Base64.decode(offset) };
      break;
    case 'name':
      query.tokenName = { $gt: Base64.decode(offset) };
      break;
    case 'owned':
      query.tokensOwned = { $gt: Base64.decode(offset) };
      break;
    default:
      throw new TypedError(401, 'unknown order');
  }
  return query;
};

const createNextOffset = (data, order) => {
  if (data.length < pageSize) {
    return undefined;
  }
  const d = data[data.length - 1];
  switch (order) {
    case 'symbol':
      return Base64.encode(d.tokenSymbol);
      break;
    case 'name':
      return Base64.encode(d.tokenName);
      break;
    case 'owned':
      return Base64.encode(d.tokensOwned);
      break;
    default:
      throw new TypedError(401, 'unknown order');
  }
};

@injectable()
export class InvestmentService {
  private conn;

  constructor() {
    MongoDBConnection.getConnection(conn => {
      this.conn = conn;
      conn.collection(collectionName).createIndex(
        'ownerId',
        { name: 'ownerId' });
      conn.collection(collectionName).createIndex(
        { 'ownerId': 1, 'campaignId': 1 },
        { name: 'ownerCampaign' });
    });
  }

  public async findByOwner(ownerId: string, order: string, offset?: string): Promise<any> {
    let query: any = { ownerId };
    let sort = makeSort(order);
    // TODO: Deal with name conflicts
    if (offset) {
      query = addOffset(query, order, offset);
    }

    return new Promise<any>((resolve, reject) => {
      this.conn.collection(collectionName)
        .find(query)
        .sort(sort)
        .limit(pageSize)
        .toArray((error, data) => {
          if (error) {
            reject(error);
          } else {
            if (data.length === 0) {
              resolve({ investments: [] });
            } else {
              const nextOffset = createNextOffset(data, order);
              resolve({ investments: data, nextOffset: nextOffset });
            }
          }
        });
    });
  }

  public async upsert(investment: Investment) {
    return new Promise<Investment>((resolve, reject) => {
      this.conn.collection(collectionName)
      .update(
        { ownerId: investment.ownerId, campaignId: investment.campaignId },
        { $set: investment },
        { upsert: true },
        (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        }
      );
    });
    // delete anything with this owner/campaign

  // insert
  }
}
