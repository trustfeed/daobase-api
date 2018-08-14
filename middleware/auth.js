import config from '../config';
import jwt from 'jsonwebtoken';

const decodeToken = (token) => {
  return new Promise(
    (resolve, reject) => {
      jwt.verify(token, config.secret, (err, decoded) => {
        if (err) reject(err);
        resolve(decoded);
      });
    }
  );
};

const authMiddleware = async (req, res, next) => {
  const token = req.headers['x-access-token'] || req.query.token;

  if (!token) {
    return res.status(403).json({
      message: 'not logged in',
    });
  }

  try {
    await decodeToken(token)
      .then((decoded) => {
        req.decoded = decoded;
      });
    next();
  } catch (err) {
    res.status(403).json({
      message: err.message,
    });
  }
};

module.exports = authMiddleware;
