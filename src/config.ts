const config = {
  secret: process.env.JWT_PRIVATE_KEY || 'this should be provided as a kuberenetes secret',

  mongoHost: process.env.MONGO_HOST || 'localhost',
  mongoPort: process.env.MONGO_PORT || '27017',
  mongoUser: process.env.MONGO_USERNAME || 'test',
  mongoPass: process.env.MONGO_PASSWORD || 'test',
  mongoDBName: process.env.MONGO_DB_NAME || 'daobase',

  port: process.env.PORT || 8080,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
  infuraURL: process.env.INFURA_HOST || 'wss://rinkeby.infura.io/ws',

  trustfeedWalletAddress: process.env.TRUSTFEED_WALLET_ADDRESS || '0x69322f30F350Ac28c5336a87406C0593f11fFF9a',
  infuraKey: process.env.INFURA_KEY,

  coinPaymentsAddress: process.env.COIN_PAYMENTS_ADDRESS || '0x90af460235cb9fb28956b45e9d80aac3dc3bd74e',
  coinPaymentsPrivateKey: '0x' + process.env.COIN_PAYMENTS_PRIVATE_KEY,

  frontendHost: process.env.FRONTEND_HOST || 'http://localhost:3000',
  backendHost: process.env.BACKEND_HOST || 'http://localhost:8080',

  dev: process.env.NODE_ENV !== 'production',

  coinPaymentsKey: process.env.COIN_PAYMENTS_KEY,
  coinPaymentsSecret: process.env.COIN_PAYMENTS_SECRET,
  coinPaymentsIPNSecret: process.env.COIN_PAYMENTS_IPN_SECRET,
  coinPaymentsMerchantID: process.env.COIN_PAYMENTS_MERCHANT_ID
};

export default config;
