import User from '../../models/user';
import * as te from '../../typedError';
import authMiddleware from '../../middleware/auth';
import InvestmentListener from '../../models/investmentListener';

exports.get = (req, res) => {
  authMiddleware(req, res, () => {
    if (!(req.decoded) || !(req.decoded.publicAddress)) {
      return res.status(500).send({ message: 'publicAddress required in access token' });
    }

    User.findOneByPublicAddress(req.decoded.publicAddress)
      .then((user) => {
        if (!user) {
          res.status(404).send({ message: 'public address not found' });
        } else {
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
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({ message: 'internal error' });
      });
  });
};

exports.post = async (req, res) => {
  try {
    const { publicAddress } = req.body;
    if (!publicAddress) {
      throw new te.TypedError(400, 'publicAddress required');
    }

    let user = await User.findOneByPublicAddress(publicAddress);
    if (user) {
      throw new te.TypedError(409, 'publicAddress already registered');
    }
    user = await User.create(publicAddress);
    InvestmentListener.addUserAddresses([publicAddress]);
    res.status(201).json({ nonce: user.nonce });
  } catch (err) {
    te.handleError(err, res);
  }
};

exports.put = (req, res) => {
  authMiddleware(req, res, () => {
    if (!req.decoded.id) {
      res.status(400).send({ message: 'missing user id' });
      return;
    }

    // If there is an email that is not verified for the current user
    // Start varification process
    // Move this to models/user
    User.findOneById(req.decoded.id)
      .then(user => {
        if (!user) {
          throw new te.TypedError(500, 'user not in database');
        }
        if (req.body.email && (!user.email || req.body.email !== user.email.address)) {
          return user.addEmail(req.body.email);
        }
      }).then(user => {
        if (req.body.name && req.body.name !== user.name) {
          user.name = req.body.name;
          return user.save();
        } else {
          return user;
        }
      })
      .then(user =>
        res.status(201).send({ message: 'updated' })
      )
      .catch(err => te.handleError(err, res));
  });
};
