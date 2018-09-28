const TYPES = {
  MongoDBClient: Symbol.for('MongoDBClient'),
  UserService: Symbol.for('UserService'),
  HashToEmailService: Symbol.for('HashToEmailService'),
  ContractService: Symbol.for('ContractService')
};

export default TYPES;
