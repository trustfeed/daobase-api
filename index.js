import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import config from './config';
import routes from './routes';
import mongoose from 'mongoose';
import VerifyCampaign from './models/verifyCampaign';

const app = express();

// Global middleware
app.use(bodyParser.json());
app.use(cors());

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send({ 'message': 'unautherised' });
  } else if (err.statusCode) {
    res.status(err.statusCode);
    if (err.expose) {
      res.send({ message: err.message });
    } else {
      res.send({ message: 'error' });
    }
  } else {
    console.log(err);
    res.status(500).send({ message: 'internal error' });
  }
});

// The standard google health check
app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

// The apis we provide
app.use('/', routes);

// accept requests
app.listen(
  config.port,
  () => console.log(`express is running on port ${config.port}`))
  .on('error', (err) => {
    console.log(err);
    process.exit(1);
  });

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
db.once('open', () => {
  console.log('connected to db');
});

const Contract = require('./models/contract');
Contract.migrateAll()
  .then(() => {
    return VerifyCampaign.listen();
  })
  .catch(() => {});

// const addTON = () => {
//  const Campaign = require('./models/campaign');
//  return Campaign.createExternalCampaign(
//    mongoose.Types.ObjectId('5b8618e6d72ba764e9f2de1c'),
//    {
//      name: 'Telegram Open Network',
//      symbol: 'TON',
//      description: 'Launching in 2018, this cryptocurrency will be based on multi-blockchain Proof-of-Stake system - TON (Telegram Open Network, after 2021 The Open Network) - designed to host a new generation of cryptocurrencies and decentralized applications.',
//      companyURL: 'https://telegram.org',
//      whitePaperURL: 'https://drive.google.com/file/d/1oaKoJDWvhtlvtQEuqxgfkUHcI5np1t5Q/view',
//      location: 'Russia',
//      links: [ { type: 'twitter', url: 'https://twitter.com/telegram' } ],
//      team: [
//        {
//          name: 'Nikolai Durov',
//          role: 'Co-founder, CTO',
//        },
//        {
//          name: 'Pavel Durov',
//          role: 'Co-founder, CEO',
//          links: [
//            {
//              type: 'facebook',
//              url: 'https://www.facebook.com/durov',
//            },
//            {
//              type: 'linkedin',
//              url: 'https://www.linkedin.com/in/pavel-durov-80174366/',
//            }],
//        },
//      ],
//    }
//  );
// };

// addTON().then(console.log).catch(console.log);
