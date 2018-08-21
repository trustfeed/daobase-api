import ethUtil from 'ethereumjs-util';
import jwt from 'jsonwebtoken';

import config from '../../config';
import User from '../../models/user';
import * as te from '../../typedError';

export function post (req, res) {
  const { signature, publicAddress } = req.body;
  if (!signature || !publicAddress) {
    return res
      .status(400)
      .json({ message: 'Request should have signature and publicAddress' });
  }

  User.findOneByPublicAddress(publicAddress)
    .then(user => {
      if (!user) {
        throw new te.TypedError(404, 'public address not found');
      }
   
      try {
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
          throw new te.TypedError(401, 'signature verification failed');
        }
      } catch (err) {
        throw new te.TypedError(401, 'signature verification failed');
      }
    })
    .then(user => {
      user.nonce = Math.floor(Math.random() * 10000);
      return user.save();
    })
    .then(
      user =>
        new Promise((resolve, reject) =>
          jwt.sign(
            {
              id: user.id,
              publicAddress,
            },
            config.secret,
            { expiresIn: '1d' },
            (err, token) => {
              if (err) {
                return reject(err);
              }
              return resolve(token);
            }
          )
        )
    )
    .then(accessToken => res.status(201).send({ accessToken }))
    .catch(err => {
      te.handleError(err, res);
    });
};
