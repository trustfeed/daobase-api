import User from '../../models/user';

exports.get = (req, res) => {
  if (!(req.query) || !(req.query.publicAddress)) {
    return res.status(400).send({ message: 'publicAddress required' });
  }
  User.findOneByPublicAddress(req.query.publicAddress)
    .then((user) => {
      if (!user) {
        res.status(404).send({ message: 'public address not found' });
      } else {
        res.status(200).send({ nonce: user.nonce });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send({ message: 'internal error' });
    });
};
