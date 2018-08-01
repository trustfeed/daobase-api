const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const port = process.env.PORT || 8080;

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const jwtPrivateKey = process.env.JWT_PRIVATE_KEY || 'somekey';
app.set('jwt-private-key', jwtPrivateKey);

app.get('/healthz', (req, res) => {
	res.send('ok')
});

app.use('/api', require('./routes/api'))

app.listen(port, () => {
	console.log(`express is running on port ${port}`)
});

mongoose.connect('mongodb://test:test@localhost:27017/crowdsale-api?authSource=admin');
mongoose.Promise = global.Promise
const db = mongoose.connection;
db.on('error', console.error);
db.once('open', () => {
	console.log('connected to db');
});
