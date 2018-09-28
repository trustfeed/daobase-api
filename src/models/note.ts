import { injectable } from 'inversify';

@injectable()
export class Note {
  public content: string;
  public isVisible: boolean;
  public createdAt: Date;

  constructor(
    content: string
  ) {
    this.content = content;
    this.isVisible = true;
    this.createdAt = new Date();
  }
}

// import mongoose from 'mongoose';
// const Schema = mongoose.Schema;
//
// const Note = new Schema({
//  createdAt: {
//    type: Date,
//    required: true,
//    default: Date.now
//  },
//  content: String,
//  isVisible: {
//    type: Boolean,
//    required: true,
//    default: true
//  }
// });
//
// export default Note;
