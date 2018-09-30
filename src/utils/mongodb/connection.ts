import { Db, MongoClient } from 'mongodb';
import config from '../../config';

const uri = `mongodb://${config.mongoUser}:${config.mongoPass}@${config.mongoHost}:${config.mongoPort}/${config.mongoDBName}?authSource=admin`;
const dbName = config.mongoDBName;

export class MongoDBConnection {
  private static _isConnected: boolean = false;
  private static db: Db;

  public static getConnection(result: (connection) => void) {
    if (this._isConnected) {
      return result(this.db);
    } else {
      this.connect((error, db: Db) => {
        return result(this.db);
      });
    }
  }

  public static isConnected(): boolean { return this._isConnected; }

  private static connect(result: (error, db: Db) => void) {
    MongoClient.connect(uri, (err, client) => {
      this.db = client.db(dbName);
      this._isConnected = true;
      return result(err, this.db);
    });
  }
}
