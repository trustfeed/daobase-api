import mongoose from 'mongoose';
import sha256 from 'js-sha256';

const Schema = mongoose.Schema;

const HashToEmail = new Schema({
  hash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  address: {
    type: Schema.Types.ObjectId,
    required: true,
  },
});

HashToEmail.statics.create = function (user, address) {
  const hsh = sha256.create();
  hsh.update(user.toString() + address + Math.random());

  const h2e = this({
    hash: hsh.hex(),
    user: user,
    address: address,
  });

  return h2e.save();
};

HashToEmail.statics.findOneByHash = function (hash) {
  return this.findOne({
    hash,
  }).exec();
};

HashToEmail.statics.findAll = function () {
  return this.find().exec();
};

export default mongoose.model('HashToEmail', HashToEmail);
