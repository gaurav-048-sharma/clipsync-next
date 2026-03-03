import mongoose, { Schema } from 'mongoose';
import type { IQuestion } from '@/types';

const codeSnippetSchema = new Schema({
  language: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'rust', 'typescript', 'html', 'css', 'sql', 'bash', 'other'],
    default: 'javascript',
  },
  code: { type: String, maxlength: 10000 },
});

const questionSchema = new Schema<IQuestion>({
  author: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  isAnonymous: { type: Boolean, default: false },
  anonymousId: { type: String },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  body: { type: String, required: true, maxlength: 10000 },
  codeSnippet: codeSnippetSchema,
  images: [{ type: String }],
  tags: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
  subject: { type: String, trim: true, maxlength: 50 },
  upvotes: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
  downvotes: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
  answerCount: { type: Number, default: 0 },
  acceptedAnswer: { type: Schema.Types.ObjectId, ref: 'Answer' },
  views: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'resolved', 'closed'], default: 'open' },
  hotScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

questionSchema.virtual('voteScore').get(function () {
  return this.upvotes.length - this.downvotes.length;
});

questionSchema.index({ createdAt: -1 });
questionSchema.index({ hotScore: -1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ author: 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ title: 'text', body: 'text' });

questionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  const ageInHours = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
  const voteScore = this.upvotes.length - this.downvotes.length;
  const order = Math.log10(Math.max(Math.abs(voteScore), 1));
  const sign = voteScore > 0 ? 1 : voteScore < 0 ? -1 : 0;
  this.hotScore = sign * order - ageInHours / 12;

  if (this.isAnonymous && !this.anonymousId) {
    const adjectives = ['Curious', 'Clever', 'Wise', 'Bright', 'Quick', 'Sharp', 'Keen', 'Smart'];
    const nouns = ['Cat', 'Owl', 'Fox', 'Bear', 'Wolf', 'Eagle', 'Hawk', 'Lion'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 9000) + 1000;
    this.anonymousId = `${adj} ${noun} #${num}`;
  }
  next();
});

const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', questionSchema);

export default Question;
