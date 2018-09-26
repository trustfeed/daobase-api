import mongoose from 'mongoose';
import sha256 from 'js-sha256';
import Mailer from './mailer';
import config from '../config';

const Schema = mongoose.Schema;

const HashToEmail = new Schema({
  hash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    type: Schema.Types.ObjectId,
    required: true
  }
});

HashToEmail.statics.create = async function(user, emailObj) {
  const hsh = sha256.create();
  hsh.update(user.toString() + emailObj._id.toString() + Math.random());
  const token = hsh.hex();

  await Mailer.sendEmailVerification(
    emailObj.address,
    user.name,
    `${config.frontendHost}/email-verification?token=${token}`
  );

  const h2e = this({
    hash: token,
    user: user,
    address: emailObj._id
  });
  return h2e.save();
};

HashToEmail.statics.findOneByHash = function(hash) {
  return this.findOne({
    hash
  }).exec();
};

HashToEmail.statics.findAll = function() {
  return this.find().exec();
};

export default mongoose.model('HashToEmail', HashToEmail);
