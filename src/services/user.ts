import { inject, injectable } from 'inversify';
import { MongoDBClient } from '../utils/mongodb/client';
import { User } from '../models/user';
import TYPES from '../constant/types';

@injectable()
export class UserService {
  private mongoClient: MongoDBClient;

  constructor(
    @inject(TYPES.MongoDBClient) mongoClient: MongoDBClient
  ) {
    this.mongoClient = mongoClient;
  }

  public findByPublicAddress(publicAddress: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.mongoClient.findOne('user', { publicAddress }, (error, data: User) => {
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
      this.mongoClient.findOne('user', { _id: id }, (error, data: User) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  // TODO: verify the public address is a valid ethereum address
  public newUser(publicAddress: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      const user = new User(
        publicAddress
      );
      this.mongoClient.insert('user', user, (error, data: User) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  // TODO: validate the user data
  public updateUser(user: User): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.mongoClient.update('user', user._id, user, (error, data: User) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }
}
