const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const port = process.env.PORT || 8080;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const jwtPrivateKey = process.env.JWT_PRIVATE_KEY || 'somekey';
app.set('jwt-private-key', jwtPrivateKey);

app.get('/healthz', (req, res) => {
  res.send('ok');
});

app.use('/api', require('./routes/api'));

app.listen(port, () => {
  console.log(`express is running on port ${port}`);
});

const mongoHost = process.env.MONGO_HOST || 'localhost';
const mongoPort = process.env.MONGO_PORT || '27017';
const options = {
  user: process.env.MONGO_USERNAME || 'test',
  pass: process.env.MONGO_PASSWORD || 'test',
  useMongoClient: true,
};
mongoose.connect('mongodb://' + mongoHost + ':' + mongoPort + '/crowdsale-api?authSource=admin', options);
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error);
db.once('open', () => {
  console.log('connected to db');
});
