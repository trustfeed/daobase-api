import User from '../../models/user';
import utils from '../../utils';

exports.get = async (req, res, next) => {
  try {
    if (!(req.query) || !(req.query.publicAddress)) {
      throw new utils.TypedError(400, 'publicAddress required');
    }
    const user = await User.findOneByPublicAddress(req.query.publicAddress);
    if (!user) {
      throw new utils.TypedError(404, 'publicAddress not found');
    } else {
      res.status(200).send({ nonce: user.nonce });
    }
  } catch (err) {
    console.log('in route', err);
    next(err);
  }
};
