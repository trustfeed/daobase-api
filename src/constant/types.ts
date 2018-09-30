const TYPES = {
  MongoDBClient: Symbol.for('MongoDBClient'),
  UserService: Symbol.for('UserService'),
  HashToEmailService: Symbol.for('HashToEmailService'),
  KYCApplicationService: Symbol.for('KYCApplicationService'),
  HostedCampaignService: Symbol.for('HostedCampaignService'),
  Web3Service: Symbol.for('Web3Service'),
  CampaignVerifier: Symbol.for('CampaignVerifier')

  // ContractService: Symbol.for('ContractService'),
};

export default TYPES;
