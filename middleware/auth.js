import config from '../config';
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const token = req.headers['x-access-token'] || req.query.token;

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'not logged in',
    });
  }

  const p = new Promise(
    (resolve, reject) => {
      jwt.verify(token, config.secret, (err, decoded) => {
        if (err) reject(err);
        resolve(decoded);
      });
    }
  );

  const onError = (error) => {
    res.status(403).json({
      success: false,
      message: error.message,
    });
  };

  // process the promise
  p.then((decoded) => {
    req.decoded = decoded;
    next();
  }).catch(onError);
};

module.exports = authMiddleware;
