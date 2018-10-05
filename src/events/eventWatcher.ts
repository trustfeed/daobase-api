import Web3 from 'web3';
import config from '../config';
import { Web3Connection } from '../utils/web3/connection';
import TYPES from '../constant/types';

export class EventWatcher {
  protected isWatchingEvents: boolean;
  protected async startWatching(): Promise<any> {
    return { on: () => { return; } };
  }
  protected async processEvent(evt: any): Promise<void> {
    return;
  }
  protected web3;

  constructor() {
    Web3Connection.getConnection(c => {
      this.web3 = c;
    });
  }

  async watchEvents() {
    try {
      let w = await this.startWatching();
      w.on('data', evt => this.processEvent(evt).catch(console.log)).on('error', console.error)
      this.isWatchingEvents = true;
    } catch (error) {
      console.log(error);
    }
  }

  reportError() {
    this.isWatchingEvents = false;
    this.restartWatchEvents();
  }

  restartWatchEvents() {
    if (this.isWatchingEvents) return;

    if (this.web3._provider.connected) {
      this.watchEvents();
    } else {
      console.log('Delay restartWatchEvents');
      setTimeout(this.restartWatchEvents.bind(this), 60 * 1000);
    }
  }
}
