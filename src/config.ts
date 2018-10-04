const config = {
  secret: process.env.JWT_PRIVATE_KEY || 'this should be provided as a kuberenetes secret',

  mongoHost: process.env.MONGO_HOST || 'localhost',
  mongoPort: process.env.MONGO_PORT || '27017',
  mongoUser: process.env.MONGO_USERNAME || 'test',
  mongoPass: process.env.MONGO_PASSWORD || 'test',
  mongoDBName: process.env.MONGO_DB_NAME || 'daobase-dev',

  port: process.env.PORT || 8080,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  mailgunApiKey: process.env.MAILGUN_API_KEY,
  mailgunDomain: process.env.MAILGUN_DOMAIN || 'mg.trustfeed.io',
  infuraURL: process.env.INFURA_HOST || 'wss://rinkeby.infura.io/ws',

  trustfeedWalletAddress: process.env.TRUSTFEED_WALLET_ADDRESS || '0x40776a2cEC264c7762A4f58ef50Dd5A4B06916F5',
  infuraKey: process.env.INFURA_KEY,

  coinPaymentsAccount: process.env.COINPAYMENTS_ACCOUNT || '0x90af460235cb9fb28956b45e9d80aac3dc3bd74e',
  coinPaymentsPrivateKey: process.env.COINPAYMENTS_PRIVATE_KEY,

  frontendHost: process.env.FRONTEND_HOST || 'http://localhost:3000',
  backendHost: process.env.BACKEND_HOST || 'http://localhost:8080',

  dev: process.env.NODE_ENV !== 'production',

  coinPaymentsKey: process.env.COIN_PAYMENTS_KEY,
  coinPaymentsSecret: process.env.COIN_PAYMENTS_SECRET,
  coinPaymentsIPNSecret: process.env.COIN_PAYMENTS_IPN_SECRET,
  coinPaymentsMerchantID: process.env.COIN_PAYMENTS_MERCHANT_ID
};

export default config;
