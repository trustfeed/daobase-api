import { inject, injectable } from 'inversify';
import { MongoDBConnection } from '../utils/mongodb/connection';
import { stringToId } from '../utils/mongodb/stringToId';
import TYPES from '../constant/types';
import { KYCApplication, KYC_STATUS_PENDING } from '../models/kycApplication';
import { Base64 } from 'js-base64';

const collectionName = 'kycApplication';

@injectable()
export class KYCApplicationService {
  private conn;

  constructor() {
    MongoDBConnection.getConnection(conn => {
      this.conn = conn;
    });
  }

  async findById(idString: string): Promise<KYCApplication> {
    const id = stringToId(idString);
    return new Promise<KYCApplication>((resolve, reject) => {
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

  async toReview(offset?: string): Promise<any> {
    const pageSize = 20;
    const query: any = { status: KYC_STATUS_PENDING };
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
    resolve({ nextOffset, kycs: data });
  }
});
    });
  }
}
