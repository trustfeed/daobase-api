const TYPES = {
  MongoDBClient: Symbol.for('MongoDBClient'),
  UserService: Symbol.for('UserService'),
  HashToEmailService: Symbol.for('HashToEmailService'),
  KYCApplicationService: Symbol.for('KYCApplicationService'),
  HostedCampaignService: Symbol.for('HostedCampaignService')

  // ContractService: Symbol.for('ContractService'),
};

export default TYPES;
