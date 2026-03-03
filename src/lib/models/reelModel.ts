import mongoose, { Schema } from 'mongoose';
import type { IReel } from '@/types';

const replySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  text: { type: String, required: true, maxlength: 1000 },
  likes: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const commentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  text: { type: String, required: true, maxlength: 1000 },
  likes: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
  replies: [replySchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const reelSchema = new Schema<IReel>({
  userId: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  videoUrl: { type: String },
  media: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['photo', 'video'], required: true },
  }],
  caption: { type: String, default: '', maxlength: 2200 },
  likes: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
  comments: [commentSchema],
  views: { type: Number, default: 0 },
  viewedBy: [{
    userId: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
    viewedAt: { type: Date, default: Date.now },
  }],
  isArchived: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Reel = mongoose.models.Reel || mongoose.model<IReel>('Reel', reelSchema);

export default Reel;
