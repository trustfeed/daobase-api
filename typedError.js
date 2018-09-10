import mongoose from 'mongoose';

export class TypedError extends Error {
  constructor (code, message, type, data) {
    super(message);
    this.httpStatus = code;
    this.message = message;
    this.type = type;
    this.data = data;
  }
}

export function handleError (err, res, code) {
  if (!err.httpStatus) {
    console.log(err);
    res.status(500).send({ message: 'internal error' });
  } else {
    res.status(err.httpStatus).send({ message: err.message, type: err.type, data: err.data });
  }
};

export function stringToId (id) {
  try {
    return mongoose.Types.ObjectId(id);
  } catch (err) {
    throw new TypedError(400, 'Invalid Id: ' + id);
  }
};
