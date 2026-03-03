import mongoose, { Schema } from 'mongoose';
import type { IConfession } from '@/types';

const confessionSchema = new Schema<IConfession>({
  content: { type: String, required: true, maxlength: 1000, trim: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  college: {
    code: { type: String },
    name: { type: String },
    city: { type: String },
  },
  targetColleges: [{ type: String }],
  reactions: {
    heart: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    laugh: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    sad: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    fire: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    shock: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  comments: [{
    content: { type: String, required: true, maxlength: 500 },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    isAnonymous: { type: Boolean, default: true },
    displayName: { type: String, default: 'Anonymous' },
    createdAt: { type: Date, default: Date.now },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reported'],
    default: 'approved',
  },
  reportCount: { type: Number, default: 0 },
  reportedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  tags: [{
    type: String,
    enum: ['crush', 'rant', 'advice', 'funny', 'sad', 'question', 'appreciation', 'other'],
  }],
  isVisible: { type: Boolean, default: true },
  trendingScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

confessionSchema.virtual('totalReactions').get(function () {
  return (
    (this.reactions?.heart?.length || 0) +
    (this.reactions?.laugh?.length || 0) +
    (this.reactions?.sad?.length || 0) +
    (this.reactions?.fire?.length || 0) +
    (this.reactions?.shock?.length || 0)
  );
});

confessionSchema.methods.calculateTrendingScore = function () {
  const hoursSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
  const totalReactions = (this.reactions?.heart?.length || 0) + (this.reactions?.laugh?.length || 0) +
    (this.reactions?.sad?.length || 0) + (this.reactions?.fire?.length || 0) + (this.reactions?.shock?.length || 0);
  const comments = this.comments?.length || 0;
  const decayFactor = Math.pow(0.95, hoursSinceCreation);
  this.trendingScore = (totalReactions * 2 + comments * 3) * decayFactor;
  return this.trendingScore;
};

confessionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  (this as any).calculateTrendingScore();
  next();
});

confessionSchema.index({ status: 1, createdAt: -1 });
confessionSchema.index({ 'college.code': 1, createdAt: -1 });
confessionSchema.index({ trendingScore: -1 });
confessionSchema.index({ targetColleges: 1 });

const Confession = mongoose.models.Confession || mongoose.model<IConfession>('Confession', confessionSchema);

export default Confession;
