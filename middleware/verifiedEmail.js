import User from '../models/user';

const verifiedEmail = async (req, res, next) => {
  if (!req.decoded || !req.decoded.publicAddress) {
    return res.status(400).send({ message: 'missing public address' });
  }
  const user = await User.findOneById(req.decoded.id);
  if (!user) {
    return res.status(404).send({ message: 'unknown user id' });
  } else if (!user.currentEmail || !user.currentEmail.verifiedAt) {
    return res.status(403).send({ message: 'verified email address required' });
  } else {
    next();
  }
};

module.exports = verifiedEmail;
