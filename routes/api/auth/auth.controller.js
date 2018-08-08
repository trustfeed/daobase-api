const ethUtil = require('ethereumjs-util');
const jwt = require('jsonwebtoken');
const User = require('../../../models/user');

exports.post = (req, res) => {
  const { signature, publicAddress } = req.body;
  if (!signature || !publicAddress) {
    return res
      .status(400)
      .json({ message: 'Request should have signature and publicAddress' });
  }

  const secret = 'secret';

  return (
    User.findOneByPublicAddress(publicAddress)
      .then(user => {
        if (!user) {
          return res.status(404).json({ message: 'public address not found' });
        }
        return user;
      })
      .then(user => {
        const msg = `I am signing my one-time nonce: ${user.nonce}`;

        // We now are in possession of msg, publicAddress and signature. We
        // can perform an elliptic curve signature verification with ecrecover
        const msgBuffer = ethUtil.toBuffer(msg);
        const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
        const signatureBuffer = ethUtil.toBuffer(signature);
        const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
        const publicKey = ethUtil.ecrecover(
          msgHash,
          signatureParams.v,
          signatureParams.r,
          signatureParams.s
        );
        const addressBuffer = ethUtil.publicToAddress(publicKey);
        const address = ethUtil.bufferToHex(addressBuffer);

        // The signature verification is successful if the address found with
        // ecrecover matches the initial publicAddress
        if (address.toLowerCase() === publicAddress.toLowerCase()) {
          return user;
        } else {
          return res
            .status(401)
            .send({ error: 'Signature verification failed' });
        }
      })
      /// /////////////////////////////////////////////////
      // Step 3: Generate a new nonce for the user
      /// /////////////////////////////////////////////////
      .then(user => {
        user.nonce = Math.floor(Math.random() * 10000);
        return user.save();
      })
      /// /////////////////////////////////////////////////
      // Step 4: Create JWT
      /// /////////////////////////////////////////////////
      .then(
        user =>
          new Promise((resolve, reject) =>
            jwt.sign(
              {
                payload: {
                  id: user.id,
                  publicAddress,
                },
              },
              secret,
              null,
              (err, token) => {
                if (err) {
                  return reject(err);
                }
                return resolve(token);
              }
            )
          )
      )
      .then(accessToken => res.json({ accessToken }))
      .catch(err => {
        console.log(err);
        res.status(500).json({ message: 'internal error' });
      })
  );
};
