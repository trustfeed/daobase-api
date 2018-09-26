import ethUtil from 'ethereumjs-util';
import jwt from 'jsonwebtoken';

import config from '../../config';
import User from '../../models/user';
import utils from '../../utils';

const sign = (user, signature) => {
  try {
    const msg = `I am signing my one-time nonce: ${user.nonce}`;
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
    return ethUtil.bufferToHex(addressBuffer);
  } catch (err) {
    throw new utils.TypedError(401, 'signature verification failed: ' + err.message);
  }
};

const generateToken = async (payload) => {
  return new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      config.secret,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) {
          return reject(err);
        }
        return resolve(token);
      }
    )
  );
};

export const post = async (req, res, next) => {
  try {
    const { signature, publicAddress } = req.body;
    if (!signature || !publicAddress) {
      throw new utils.TypedError(400, 'Request should have signature and publicAddress');
    }

    let user = await User.findOneByPublicAddress(publicAddress);
    if (!user) {
      throw new utils.TypedError(404, 'public address not found');
    }
    const signedAddress = sign(user, signature);
    if (signedAddress.toLowerCase() !== publicAddress.toLowerCase()) {
      throw new utils.TypedError(401, 'signature verification failed');
    }
    user.nonce = Math.floor(Math.random() * 10000);
    await user.save();
    const accessToken = await generateToken({
      id: user.id,
      publicAddress,
    });
    res.status(201).send({ accessToken });
  } catch (err) {
    next(err);
  }
};
