import Web3 from 'web3';

// The URL for each provider
const getProviderURL = (network) => {
  switch (network) {
  case 'rinkeby':
    return 'wss://rinkeby.infura.io/ws';
  default:
    throw new Error('unknown network');
  }
};

// Update web3 provider
const updateProvider = (network, provider) => {
  if (!w3s[network]) {
    throw new Error('unknown network');
  } else {
    w3s[network].setProvider(provider);
  }
};

// Create a provider
const getProvider = (network) => {
  const provider = new Web3.providers.WebsocketProvider(getProviderURL(network));

  provider.on('connect', () => console.log('WS Connected'));
  provider.on('end', () => {
    console.error('WS End');
    subscriptions[network].map(s => s.reportError());
    setTimeout(() => {
      updateProvider(network, getProvider(network));
    }, 5 * 1000);
  });

  return provider;
};

// Initialise all web3 providers
let w3s = {};
w3s.rinkeby = new Web3(getProvider('rinkeby'));

let subscriptions = { 'rinkeby': [] };

const Networks = {
  // The networks we support
  supported: ['rinkeby'],

  registry: (network) => {
    switch (network) {
    case 'rinkeby':
      return '0xB900F568D3F54b5DE594B7968e68181fC45fCAc6';
    default:
      throw new Error('unknown network');
    }
  },

  // Get a connection to a full node on the given network
  node: (network) => {
    return w3s[network];
  },

  // Add this as a subscription
  addSubscription: (network, sub) => {
    subscriptions[network].push(sub);
  },
};

// This should not be needed but the above code doesn't always catch the error
const periodicCheck = () => {
  Networks.supported.map(async network => {
    try {
      await w3s.rinkeby.eth.getBlockNumber();
    } catch (err) {
      updateProvider(network, getProvider(network));
    }
  });
  setTimeout(periodicCheck, 5 * 60 * 1000);
};

periodicCheck();

export default Networks;
