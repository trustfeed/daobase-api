import User from '../../models/user';
import utils from '../../utils';
import authMiddleware from '../../middleware/auth';
import InvestmentListener from '../../models/investmentListener';

// Get the user
exports.get = (req, res, next) => {
  authMiddleware(req, res, async () => {
    try {
      if (!(req.decoded) || !(req.decoded.publicAddress)) {
        throw new utils.TypedError(500, 'publicAddress required in access token');
      }

      const user = await User.findOneByPublicAddress(req.decoded.publicAddress);
      if (!user) {
        throw new utils.TypedError(404, 'publicAddress not found');
      }
      // TODO: make a view for this
      let out = { nonce: user.nonce };
      out.kycStatus = user.kycStatus;
      out.id = user._id.toString();
      out.publicAddress = user.publicAddress;
      out.name = user.name;
      if (user.currentEmail) {
        out.email = {
          address: user.currentEmail.address,
          isVerified: user.currentEmail.verifiedAt !== undefined,
        };
      }
      res.status(200).send(out);
    } catch (err) {
      next(err);
    }
  });
};

exports.post = async (req, res, next) => {
  try {
    const { publicAddress } = req.body;
    if (!publicAddress) {
      throw new utils.TypedError(400, 'publicAddress required');
    }

    let user = await User.findOneByPublicAddress(publicAddress);
    if (user) {
      throw new utils.TypedError(409, 'publicAddress already registered');
    }
    user = await User.create(publicAddress);
    InvestmentListener.addUserAddresses([publicAddress]);
    res.status(201).json({ nonce: user.nonce });
  } catch (err) {
    next(err);
  }
};

exports.put = (req, res, next) => {
  try {
    authMiddleware(req, res, async () => {
      if (!req.decoded.id) {
        throw new utils.TypedError(400, 'missing user id');
      }

      // If there is an email that is not verified for the current user
      // Start varification process
      // TODO: Move this to models/user
      const user = await User.findOneById(req.decoded.id);
      if (!user) {
        throw new utils.TypedError(500, 'user not in database');
      }
      if (req.body.email && (!user.email || req.body.email !== user.email.address)) {
        await user.addEmail(req.body.email);
      }
      if (req.body.name && req.body.name !== user.name) {
        user.name = req.body.name;
        await user.save();
      } else {
        return user;
      }
      res.status(201).send({ message: 'updated' });
    });
  } catch (err) {
    next(err);
  }
};
