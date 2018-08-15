import mongoose from 'mongoose';
import sha256 from 'js-sha256';
import sendMail from './mailer';

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

HashToEmail.statics.create = function (user, emailObj) {
  const hsh = sha256.create();
  hsh.update(user.toString() + emailObj._id.toString() + Math.random());
  const token = hsh.hex();

  return sendMail(
    emailObj.address,
    'TrustFeed email verification',
    `Hello,\nIn order to verify this email address with TrustFeed please use the following token ${token}`,
    `Hello,\nIn order to verify this email address with TrustFeed please use the following token ${token}`,
  ).then(() => {
    const h2e = this({
      hash: token,
      user: user,
      address: emailObj._id,
    });

    return h2e.save();
  });
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
