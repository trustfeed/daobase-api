import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import config from './config';
import controllers from './controllers';
import startCampainVerifier from './models/verifyCampaign';
import mongoose from 'mongoose';
import InvestmentListener from './models/investmentListener';
import Contract from './models/contract';
import morgan from 'morgan';
import error from './middleware/error';

const app = express();

// Global middleware
app.use(morgan('common'));
app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true, type: 'application/x-www-form-urlencoded' }));
app.use(cors());

// The standard google health check
app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

// The apis we provide
app.use('/', controllers);
app.use(error);

// accept requests
app.listen(
  config.port,
  () => console.log(`express is running on port ${config.port}`))
  .on('error', (err) => {
    console.log(err);
    process.exit(1);
  });

// Initialise the database
const options = {
  user: config.mongoUser,
  pass: config.mongoPass,
};

const uri = `mongodb://${config.mongoHost}:${config.mongoPort}/crowdAdmin?authSource=admin`;
mongoose.connect(uri, options);
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', err => {
  console.error(err);
  process.exit(1);
});

db.once('open', async () => {
  await Contract.migrateAll().catch(console.log);
  await startCampainVerifier();
  await InvestmentListener.startListner().catch(console.log);
}).catch(err => {
  console.log('initialisation failed:', err);
  process.exit(1);
});
