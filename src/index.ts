import 'reflect-metadata';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import config from './config';
import morgan from 'morgan';
import error from './middleware/error';
import { Container } from 'inversify';
import TYPES from './constant/types';
import { InversifyExpressServer } from 'inversify-express-utils';

import { UserService } from './services/user';
import { HashToEmailService } from './services/hashToEmail';
import { KYCApplicationService } from './services/kycApplication';
import { HostedCampaignService } from './services/hostedCampaign';
import { Web3Service } from './services/web3';
import { S3Service } from './services/s3';
import { CoinPaymentsService } from './services/coinPayments';
import { InvestmentService } from './services/investment';
import { MailService } from './services/mail';
import './controllers/healthz';
import './controllers/nonce';
import './controllers/users';
import './controllers/auth';
import './controllers/verify';
import './controllers/kyc';
import './controllers/admin';
import './controllers/campaigns';
import './controllers/investments';
import './controllers/coinPayments';
import './controllers/trustfeed';
import { CampaignVerifier } from './events/campaignVerifier';
import { InvestmentWatcher } from './events/investmentWatcher';
import { WalletWatcher, WalletAdd, WalletRemove } from './events/walletWatcher';
import { ConfirmationWatcher } from './events/confirmationWatcher';
import { Web3Connection } from './utils/web3/connection';

const container = new Container();

container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<HashToEmailService>(TYPES.HashToEmailService).to(HashToEmailService);
container.bind<KYCApplicationService>(TYPES.KYCApplicationService).to(KYCApplicationService);
container.bind<HostedCampaignService>(TYPES.HostedCampaignService).to(HostedCampaignService);
container.bind<Web3Service>(TYPES.Web3Service).to(Web3Service);
container.bind<S3Service>(TYPES.S3Service).to(S3Service);
container.bind<CoinPaymentsService>(TYPES.CoinPaymentsService).to(CoinPaymentsService);
container.bind<InvestmentService>(TYPES.InvestmentService).to(InvestmentService);
container.bind<MailService>(TYPES.MailService).to(MailService);

const confirmationWatcher = new ConfirmationWatcher(
  container.get<Web3Service>(TYPES.Web3Service),
  container.get<HostedCampaignService>(TYPES.HostedCampaignService)
 );
Web3Connection.addSubscription(confirmationWatcher);

const investmentWatcher = new InvestmentWatcher(
  container.get<Web3Service>(TYPES.Web3Service),
  container.get<UserService>(TYPES.UserService),
  container.get<HostedCampaignService>(TYPES.HostedCampaignService),
  container.get<InvestmentService>(TYPES.InvestmentService)
 );
Web3Connection.addSubscription(investmentWatcher);
container.bind<InvestmentWatcher>(TYPES.InvestmentWatcher).toConstantValue(investmentWatcher);

const campaignVerifier = new CampaignVerifier(
 container.get<Web3Service>(TYPES.Web3Service),
 container.get<UserService>(TYPES.UserService),
 container.get<HostedCampaignService>(TYPES.HostedCampaignService),
 container.get<InvestmentWatcher>(TYPES.InvestmentWatcher)
 );
Web3Connection.addSubscription(campaignVerifier);

const walletWatcher = new WalletAdd(
  container.get<Web3Service>(TYPES.Web3Service)
);
Web3Connection.addSubscription(walletWatcher);
container.bind<WalletWatcher>(TYPES.WalletWatcher).toConstantValue(walletWatcher);

const walletRemove = new WalletRemove(
  container.get<Web3Service>(TYPES.Web3Service)
);
Web3Connection.addSubscription(walletRemove);

const server = new InversifyExpressServer(container);
server.setConfig((app) => {
  app.use(morgan('common'));
  app.use(
    bodyParser.json({
      type: 'application/json'
    })
  );
  app.use(
    bodyParser.urlencoded({
      extended: true,
      type: 'application/x-www-form-urlencoded'
    })
  );
  app.use(cors());
});
server.setErrorConfig((app) => {
  app.use(error);
});

const app = server.build();
app.listen(config.port);

exports = module.exports = app;
