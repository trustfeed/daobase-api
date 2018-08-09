export class TypedError extends Error {
  constructor (code, message) {
    super(message);
    this.code = code;
    this.message = message;
  }
}

export function handleError (err, res) {
  if (!err.code) {
    console.log(err);
    res.status(500).send({ message: 'internal error' });
  } else {
    res.status(err.code).send({ message: err.message });
  }
};
