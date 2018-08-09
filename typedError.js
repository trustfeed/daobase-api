export class TypedError extends Error {
  constructor (code, message) {
    super(message);
    this.httpStatus = code;
    this.message = message;
  }
}

export function handleError (err, res) {
  if (!err.httpStatus) {
    console.log(err);
    res.status(500).send({ message: 'internal error' });
  } else {
    res.status(err.httpStatus).send({ message: err.message });
  }
};
