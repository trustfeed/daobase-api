import User from '../../models/user';
import * as te from '../../typedError';

export const get = (req, res) => {
  if (!(req.query) || !(req.query.publicAddress)) {
    return res.status(400).send({ message: 'publicAddress required' });
  }

  User.findOneByPublicAddress(req.query.publicAddress)
    .then((user) => {
      if (!user) {
        res.status(404).send({ message: 'public address not found' });
      } else {
        res.status(200).json({ nonce: user.nonce });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500);
    });
};

export const post = (req, res) => {
  const { publicAddress } = req.body;
  if (!publicAddress) {
    res.status(400).send({ message: 'publicAddress required' });
  }

  User.findOneByPublicAddress(req.query.publicAddress)
    .then(user => {
      if (user) {
        throw new te.TypedError(409, 'publicAddress already registered');
      } else {
        return User.create(req.query.publicAddress);
      }
    })
    .then(user => {
      res.status(201).json({ nonce: user.nonce });
    })
    .catch(err => {
      te.handleError(err, res);
    });
};
