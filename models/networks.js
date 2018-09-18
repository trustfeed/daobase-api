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
  provider.on('error', e => {
    console.error('WS Error', e);
    updateProvider(network, getProvider());
  });
  provider.on('end', e => {
    console.error('WS End', e);
    updateProvider(network, getProvider());
  });

  return provider;
};

// Initialise all web3 providers
let w3s = {};
w3s.rinkeby = new Web3(getProvider('rinkeby'));

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
};

export default Networks;
