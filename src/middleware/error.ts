const error = async (err, req, res, next) => {
  console.log(err);
  // TODO: emails/logging
  if (!err.httpStatus) {
    res.status(500).send({
      message: 'internal error'
    });
    console.log(err);
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
