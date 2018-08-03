const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');

const salt = process.env.salt || 'somesalt';

const User = new Schema({
  username: {
    type: String,
    index: true,
    unique: true,
  },
  password: String,
  campaigns: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
  },
});

User.statics.create = function (username, password) {
  const encrypted = crypto.createHmac('sha1', salt)
    .update(password)
    .digest('base64');

  const user = new this({
    username,
    password: encrypted,
  });

  return user.save();
};

User.statics.findOneByUsername = function (username) {
  return this.findOne({
    username,
  }).exec();
};

User.methods.verify = function (password) {
  const encrypted = crypto.createHmac('sha1', salt)
    .update(password)
    .digest('base64');
  console.log(this.password === encrypted);

  return this.password === encrypted;
};

User.methods.assignAdmin = function () {
  this.admin = true;
  return this.save();
};

module.exports = mongoose.model('User', User);
