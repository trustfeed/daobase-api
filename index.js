import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import config from './config';
import routes from './routes';
import mongoose from 'mongoose';

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
Contract.migrateAll().catch(() => {});

// setTimeout(() => {
//  const x = require('./models/networks');
//  x.default('rinkeby')
//    .then(web3 => { return web3.eth.getBlockNumber(); })
//    .then(n => console.log('~~~~~BLOCK NUMBER: ' + n + '~~~~~~~~~~~'))
//    .catch(err => console.log('~~~~~~ERR: ' + err + '~~~~~~~~~~~~'));
// }, 1000 * 5);
