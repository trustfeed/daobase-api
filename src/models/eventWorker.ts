// This listens to events and resets itself when needed.
class EventWorker {
  web3: any;
  protected isWatchingEvents: boolean;
  protected async startWatching(): Promise<any> {
    return { on: () => { return; } };
  }
  protected async processEvent(evt: any): Promise<void> {
    return;
  }

  // TODO: remove any types
  constructor(web3) {
    this.web3 = web3;
  }

  async watchEvents() {
    try {
      let w = await this.startWatching();
      w.on('data', evt => this.processEvent(evt)).on('error', console.error);
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

export default EventWorker;
