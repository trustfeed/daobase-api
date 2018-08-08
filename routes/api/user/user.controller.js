const User = require('../../../models/user');

exports.get = (req, res) => {
  if (!(req.query) || !(req.query.publicAddress)) {
    res.status(400).json({ message: 'publicAddress required' });
    return;
  }

  User.findOneByPublicAddress(req.query.publicAddress)
    .then((user) => {
      if (!user) {
        res.status(404).json({ 'message': 'public address not found' });
      } else {
        res.status(200).json({ 'nonce': user.nonce });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ 'message': 'internal server error' });
    });
};

exports.post = (req, res) => {
  if (!(req.query) || !(req.query.publicAddress)) {
    res.status(400).json({ 'message': 'publicAddress required' });
  }

  const createUser = (user) => {
    if (!user) {
      return User.create(req.query.publicAddress);
    } else {
      throw new Error('the address is already registered');
    }
  };

  const respond = (user) => {
    res.status(201).json({ 'nonce': user.nonce });
  };

  // check for the public address
  User.findOneByPublicAddress(req.query.publicAddress)
    .then(createUser)
    .then(respond)
    .catch((error) => {
      console.log(error);
      res.status(500).json({ 'message': 'internal server error' });
    });
};
