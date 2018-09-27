const error = async (err, req, res, next) => {
  // TODO: emails/logging
  if (!err.httpStatus) {
    res.status(500).send({
      message: 'internal error'
    });
  } else {
    res.status(err.httpStatus).send({
      message: err.message,
      type: err.type,
      data: err.data
    });
  }
  // next(err);
};

export default error;
