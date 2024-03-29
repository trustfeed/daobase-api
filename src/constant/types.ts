const TYPES = {
  UserService: Symbol.for('UserService'),
  HashToEmailService: Symbol.for('HashToEmailService'),
  KYCApplicationService: Symbol.for('KYCApplicationService'),
  HostedCampaignService: Symbol.for('HostedCampaignService'),
  Web3Service: Symbol.for('Web3Service'),
  S3Service: Symbol.for('S3Service'),
  CoinPaymentsService: Symbol.for('CoinPaymentsService'),
  InvestmentService: Symbol.for('InvestmentService'),
  InvestmentWatcher: Symbol.for('InvestmentWatcher'),
  MailService: Symbol.for('MailService'),
  WalletWatcher: Symbol.for('WalletWatcher'),
  ConfirmationWatcher: Symbol.for('ConfirmationWatcher'),
  FinalisedWatcher: Symbol.for('FinalisedWatcher')
};

export default TYPES;
