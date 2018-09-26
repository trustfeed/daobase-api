import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const PeriodSchema = new Schema({
  openingTime: Date,
  closingTime: Date,
});

const LinkSchema = new Schema({
  type: {
    type: String,
    required: true,
  },
});

const TeamMemberSchema = new Schema({
  name: String,
  role: String,
  description: String,
  links: [LinkSchema],
});

const ExternalCampaign = new Schema({
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
  },
  name: String,
  symbol: String,
  summary: String,
  description: String,
  companyURL: String,
  whitePaperURL: String,
  coverImageURL: String,
  preICO: PeriodSchema,
  ico: PeriodSchema,
  links: [LinkSchema],
  location: String,
  team: [TeamMemberSchema],
});

export default ExternalCampaign;
