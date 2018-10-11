import { inject, injectable } from 'inversify';
import Web3 from 'web3';
import config from '../../config';

@injectable()
export class Web3Connection {
  private static subscriptions: any[] = [];
  private static isConnected: boolean = false;
  private static web3: any;

  public static getConnection(result: (connection) => void) {
    if (this.isConnected) {
      return result(this.web3);
    } else {
      const webSocketProvider = new Web3.providers.WebsocketProvider(config.infuraURL);

      webSocketProvider.connection.onclose = () => {
        console.log('Web3 socket connection closed');
        this.isConnected = false;
        this.subscriptions.map(s => s.reportError());
        this.onClose();
      };

      this.web3 = new Web3(webSocketProvider);
      this.isConnected = true;
      this.getConnection(result);
    }
  }

  private static onClose() {
    const webSocketProvider = new Web3.providers.WebsocketProvider(config.infuraURL);
    webSocketProvider.connection.onclose = () => {
      console.log('Web3 socket connection closed');
      this.isConnected = false;
      this.subscriptions.map(s => s.reportError());
      setTimeout(() => {
        this.onClose();
      }, 2 * 1000);
    };

    this.web3.setProvider(webSocketProvider);
    this.isConnected = true;
  }

  public static addSubscription(sub) {
    sub.watchEvents();
    this.subscriptions.push(sub);
  }
}

const checkBlockNumber = () => {
  try {
    Web3Connection.getConnection(async w3 => {
      const bn = await w3.eth.getBlockNumber();
      console.log('current block number:', bn);
    });
  } catch (err) {
    console.log(err);
  }
  setTimeout(checkBlockNumber, 1000 * 60 * 2);
};

console.log('start regular web3 checks');
checkBlockNumber();
