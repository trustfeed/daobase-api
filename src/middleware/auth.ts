import config from '../config';
import jwt from 'jsonwebtoken';
import { TypedError } from '../utils';

export const authMiddleware = (req, res, next) => {
  req.decoded = decodeToken(req);
  next();
};

export const decodeToken = (req) => {
  const token = req.headers['x-access-token'] || req.query.token;

  if (!token) {
    throw new TypedError(403, {
      message: 'not logged in'
    });
  }

  try {
    return jwt.verify(token, config.secret);
  } catch (err) {
    throw new TypedError(403, {
      message: 'not logged in'
    });
  }
};
