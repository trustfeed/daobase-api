import mongoose from 'mongoose';
import Web3 from 'web3';

class ErrorWithType extends Error {
  httpStatus: number;
  type: any;
  data: any;
  constructor(code, message, type?, data?) {
    super(message);
    this.httpStatus = code;
    this.message = message;
    this.type = type;
    this.data = data;
  }
}

export const TypedError = ErrorWithType;

// export const stringToId = id => {
//  try {
//    return mongoose.Types.ObjectId(id);
//  } catch (err) {
//    throw new TypedError(400, 'Invalid Id: ' + id);
//  }
// };

export const stringRoundedOrUndefined = s => {
  try {
    return Math.round(Number(s));
  } catch (err) {
    return undefined;
  }
};

export const stringToBNOrUndefined = s => {
  try {
    return Web3.utils.toBN(s);
  } catch (err) {
    return undefined;
  }
};
