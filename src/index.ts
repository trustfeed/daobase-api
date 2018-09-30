import 'reflect-metadata';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import config from './config';
import controllers from './controllers';
// import startCampainVerifier from './models/verifyCampaign';
// import mongoose from 'mongoose';
// import InvestmentListener from './models/investmentListener';
// import Contract from './models/contract';
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
import { MongoDBClient } from './utils/mongodb/client';
import './controllers/healthz';
import './controllers/nonce';
import './controllers/users';
import './controllers/auth';
import './controllers/verify';
import './controllers/kyc';
import './controllers/admin';
import { CampaignVerifier } from './services/campaignVerifier';

const container = new Container();

container.bind<MongoDBClient>(TYPES.MongoDBClient).to(MongoDBClient);
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<HashToEmailService>(TYPES.HashToEmailService).to(HashToEmailService);
container.bind<KYCApplicationService>(TYPES.KYCApplicationService).to(KYCApplicationService);
container.bind<HostedCampaignService>(TYPES.HostedCampaignService).to(HostedCampaignService);
container.bind<Web3Service>(TYPES.Web3Service).to(Web3Service);
container.bind<CampaignVerifier>(TYPES.CampaignVerifier).to(CampaignVerifier);

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
// const app = express();
//
//// Global middleware
// app.use(morgan('common'));
// app.use(
//  bodyParser.json({
//    type: 'application/json'
//  })
// );
// app.use(
//  bodyParser.urlencoded({
//    extended: true,
//    type: 'application/x-www-form-urlencoded'
//  })
// );
// app.use(cors());
//
//// The standard google health check
// app.get('/healthz', (req, res) => {
//  res.status(200).send('ok');
// });
//
//// The apis we provide
// app.use('/', controllers);
// app.use(error);
//
//// accept requests
// app
//  .listen(config.port, () => console.log(`express is running on port ${config.port}`))
//  .on('error', err => {
//    console.log(err);
//    process.exit(1);
//  });
//
////// Initialise the database
//// const options = {
////  user: config.mongoUser,
////  pass: config.mongoPass
//// };
////
//// const uri = `mongodb://${config.mongoHost}:${config.mongoPort}/crowdAdmin?authSource=admin`;
//// mongoose.connect(
////  uri,
////  options
//// );
//// mongoose.Promise = global.Promise;
//// const db = mongoose.connection;
//// db.on('error', err => {
////  console.error(err);
////  process.exit(1);
//// });
//
//// db.once('open', async () => {
////  try {
////    await Contract.migrateAll().catch(console.log);
////    // await startCampainVerifier();
////    await InvestmentListener.startListner().catch(console.log);
////  } catch (error) {
////    console.log('initialisation failed:', error);
////    process.exit(1);
////  }
//// });
