const moment = require('moment');

const checkString = function (name) {
  return function (input) {
    return new Promise(function (resolve, reject) {
      if (!(name in input)) {
        reject(Error(`missing ${name}`));
      } else if (typeof input[name] !== 'string') {
        reject(Error(`${name} not a string`));
      } else if (input[name].length === 0) {
        reject(Error(`${name} is empty`));
      } else {
        resolve(input);
      }
    });
  };
};

const checkDate = function (nm) {
  return function (input) {
    return new Promise(function (resolve, reject) {
      if (!(nm in input)) {
        reject(Error(`missing ${nm}`));
      } else if (typeof input[nm] !== 'number') {
        reject(Error(`${nm} not a number`));
      } else {
        const mnt = moment.unix(input[nm]);
        input[nm] = mnt;
        resolve(input);
      }
    });
  };
};

const checkInterval = function (input) {
  return new Promise(function (resolve, reject) {
    const minDuration = 24 * 60 * 60 * 1000;
    if ((input.endDate - input.startDate) < minDuration) {
      reject(Error('duration is invalid'));
    } else {
      resolve(input);
    }
  });
};

const validate = function (input) {
  return Promise.resolve(input)
    .then(checkString('tokenName'))
    .then(checkString('tokenSymbol'))
    .then(checkDate('startDate'))
    .then(checkDate('endDate'))
    .then(checkInterval)
    .catch((e) =>
      console.log(e));
};

exports.get = (req, res) => {
  res.send(req.params);
};

exports.post = (req, res) => {
  validate(req.body);
  res.send(req.params);
};

exports.put = (req, res) => {
  validate(req.body);
  res.send(req.params);
};
