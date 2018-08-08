const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
  publicAddress: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
  nonce: {
    type: String,
    required: true,
  },
});

User.statics.findOneByPublicAddress = function (publicAddress) {
  return this.findOne({
    publicAddress,
  }).exec();
};

User.statics.create = function (publicAddress) {
  const nonce = Math.floor(Math.random() * 10000).toString();
  const user = this({
    publicAddress,
    nonce,
  });

  return user.save();
};

module.exports = mongoose.model('User', User);
