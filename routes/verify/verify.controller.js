import User from '../../models/user';
import HashToEmail from '../../models/hashToEmail';
import * as te from '../../typedError';

const daysBetween = (start, end) => {
  const milli = Math.abs(start.getTime() - end.getTime());
  return milli / (1000 * 60 * 60 * 24);
};

export const email = (req, res) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).send({ message: 'missing token', type: 'INVALID_TOKEN' });
    return;
  }

  let hashToEmail;
  HashToEmail.findOneByHash(token)
    .then(h2e => {
      hashToEmail = h2e;
      if (!hashToEmail) {
        throw new te.TypedError(404, 'no such token', 'INVALID_TOKEN');
      } else if (daysBetween(hashToEmail.createdAt, new Date()) > 1) {
        throw new te.TypedError(410).send({ message: 'token expired', type: 'EXPIRED_TOKEN' });
      } else {
        return User.verifyEmail(hashToEmail.user, hashToEmail.address);
      }
    })
    .then(() => res.status(201).send({ message: 'verified', type: 'SUCCESS' }))
    .catch(err => te.handleError(err, res));
};
