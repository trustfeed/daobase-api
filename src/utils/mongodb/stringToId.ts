import { ObjectID } from 'mongodb';
import { TypedError } from '../../utils';

export const stringToId = (str: string): any => {
  try {
    return new ObjectID(str);
  } catch (err) {
    throw new TypedError(400, 'invalid object ID');
  }
};
