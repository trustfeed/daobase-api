import config from '../config';

const trustfeedAddress = (req, res, next) => {
  if (!req.decoded || !req.decoded.publicAddress) {
    return res.status(400).send({ message: 'missing public address' });
  } else if (req.decoded.publicAddress !== config.trustfeedAddress) {
    return res.status(403).send({ message: 'only trustfeed can access these pages' });
  } else {
    next();
  }
};

module.exports = trustfeedAddress;
