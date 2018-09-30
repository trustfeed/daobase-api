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

  trustfeedAddress: process.env.TRUSTFEED_ADDRESS || '0x3aa9ce734dd21fa5e6962978e2ccc7f4ac513348',
  infuraKey: process.env.INFURA_KEY,

  frontendHost: process.env.FRONTEND_HOST || 'http://localhost:3000',

  dev: process.env.NODE_ENV !== 'production',

  coinPaymentsKey: process.env.COIN_PAYMENTS_KEY,
  coinPaymentsSecret: process.env.COIN_PAYMENTS_SECRET,
  coinPaymentsIPNSecret: process.env.COIN_PAYMENTS_IPN_SECRET,
  coinPaymentsMerchantID: process.env.COIN_PAYMENTS_MERCHANT_ID
};

export default config;
