// This listens to events and resets itself when needed.
class EventWorker {
  constructor (web3) {
    this.web3 = web3;
  }

  async watchEvents () {
    let w = await this._startWatching();
    w.on('data', (evt) => this._processEvent(evt))
      .on('error', console.error);

    this.isWatchingEvents = true;
  }

  reportError () {
    this.isWatchingEvents = false;
    this.restartWatchEvents();
  }

  restartWatchEvents () {
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
