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
  } else {
    console.log(err);
    res.send({ message: 'internal error' });
  }
});

// The standard google health check
app.get('/healthz', (req, res) => {
  res.send('ok');
});

// The apis we provide
app.use('/', routes);

// accept requests
app.listen(config.port, () => {
  console.log(`express is running on port ${config.port}`);
});

const options = {
  user: config.mongoUser,
  pass: config.mongoPass,
};

const uri = `mongodb://${config.mongoHost}:${config.mongoPort}/crowdAdmin?authSource=admin`;
console.log(uri);
mongoose.connect(uri, options);
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error);
db.once('open', () => {
  console.log('connected to db');
});