const config = {
  secret: process.env.JWT_PRIVATE_KEY || 'this should be provided as a kuberenetes secret',
  mongoHost: process.env.MONGO_HOST || 'localhost',
  mongoPort: process.env.MONGO_PORT || '27017',
  mongoUser: process.env.MONGO_USERNAME || 'test',
  mongoPass: process.env.MONGO_PASSWORD || 'test',
  port: process.env.PORT || 8080,
};

export default config;
