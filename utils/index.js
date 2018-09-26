import mongoose from 'mongoose';

class TypedError extends Error {
  constructor (code, message, type, data) {
    super(message);
    this.httpStatus = code;
    this.message = message;
    this.type = type;
    this.data = data;
  }
}

exports.TypedError = TypedError;

exports.stringToId = id => {
  try {
    return mongoose.Types.ObjectId(id);
  } catch (err) {
    throw new TypedError(400, 'Invalid Id: ' + id);
  }
};
