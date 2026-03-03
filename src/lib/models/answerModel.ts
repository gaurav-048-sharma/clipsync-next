import mongoose, { Schema } from 'mongoose';
import type { IAnswer } from '@/types';

const commentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  text: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

const codeSnippetSchema = new Schema({
  language: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'rust', 'typescript', 'html', 'css', 'sql', 'bash', 'other'],
    default: 'javascript',
  },
  code: { type: String, maxlength: 10000 },
});

const answerSchema = new Schema<IAnswer>({
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  isAnonymous: { type: Boolean, default: false },
  anonymousId: { type: String },
  body: { type: String, required: true, maxlength: 10000 },
  codeSnippet: codeSnippetSchema,
  images: [{ type: String }],
  upvotes: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
  downvotes: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
  isAccepted: { type: Boolean, default: false },
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

answerSchema.virtual('voteScore').get(function () {
  return this.upvotes.length - this.downvotes.length;
});

answerSchema.index({ questionId: 1, createdAt: -1 });
answerSchema.index({ author: 1 });
answerSchema.index({ isAccepted: 1 });

answerSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.isAnonymous && !this.anonymousId) {
    const adjectives = ['Helpful', 'Friendly', 'Kind', 'Generous', 'Wise', 'Clever', 'Smart', 'Brilliant'];
    const nouns = ['Helper', 'Guide', 'Mentor', 'Friend', 'Sage', 'Scholar', 'Expert', 'Guru'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 9000) + 1000;
    this.anonymousId = `${adj} ${noun} #${num}`;
  }
  next();
});

const Answer = mongoose.models.Answer || mongoose.model<IAnswer>('Answer', answerSchema);

export default Answer;
