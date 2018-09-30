import { inject, injectable } from 'inversify';
import { MongoDBConnection } from '../utils/mongodb/connection';
import { stringToId } from '../utils/mongodb/stringToId';
import { User } from '../models/user';
import TYPES from '../constant/types';

const collectionName = 'user';

@injectable()
export class UserService {
  private conn;

  constructor() {
    MongoDBConnection.getConnection(conn => {
	    this.conn = conn;
      conn.collection(collectionName).createIndex(
	      'publicAddress',
	      { name: 'publicAddress', unique: true });
    });
  }

  public findByPublicAddress(publicAddress: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.conn.collection(collectionName)
        .findOne({ publicAddress }, (error, data: User) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
    });
  }

  public findById(id: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.conn.collection(collectionName)
        .findOne({ _id: stringToId(id) }, (error, data: User) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
    });
  }

  // TODO: verify the public address is a valid ethereum address
  public create(publicAddress: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      const user = new User(
        publicAddress
      );
      this.conn.collection(collectionName)
        .insert(user, (error, data: User) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
    });
  }

  // TODO: validate the user data
  public update(user: User): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.conn.collection(collectionName)
        .update(
		{ _id: user._id },
		{ $set: user },
		(error, data: User) => {
  if (error) {
    reject(error);
  } else {
    resolve(data);
  }
});
    });
  }
}
