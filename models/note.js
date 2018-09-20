import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const Note = new Schema({
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  content: String,
  isVisible: {
    type: Boolean,
    required: true,
    default: true,
  },
});

export default Note;
