import User from '../../models/user';
import HashToEmail from '../../models/hashToEmail';
import * as utils from '../../utils';

const daysBetween = (start, end) => {
  const milli = Math.abs(start.getTime() - end.getTime());
  return milli / (1000 * 60 * 60 * 24);
};

export const email = async (req, res, next) => {
  try {
    const {
      token
    } = req.body;
    if (!token) {
      throw new utils.TypedError(400, 'missing token', 'INVALID_TOKEN');
    }

    const hashToEmail = await HashToEmail.findOneByHash(token);

    if (!hashToEmail) {
      throw new utils.TypedError(404, 'no such token', 'INVALID_TOKEN');
    } else if (daysBetween(hashToEmail.createdAt, new Date()) > 1) {
      throw new utils.TypedError(410, 'token expired', 'EXPIRED_TOKEN');
    }

    await User.verifyEmail(hashToEmail.user, hashToEmail.address);
    res.status(201).send({
      message: 'verified',
      type: 'SUCCESS'
    });
  } catch (err) {
    next(err);
  }
};
