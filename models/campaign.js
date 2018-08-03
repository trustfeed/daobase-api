const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Campaign = new Schema({
  tokenName: String,
  tokenSymbol: String,
  isMintable: Boolean,
  startDate: Date,
  endDate: Date,
});

Campaign.statics.create = function (tokenName, tokenSymbol, isMintable, startDate, endDate, softCap, hardCap) {
  const campaign = new this({
    tokenName,
    tokenSymbol,
    isMintable,
    startDate,
    endDate,
    softCap,
    hardCap,
  });

  return campaign.save();
};
