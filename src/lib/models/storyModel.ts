import mongoose, { Schema } from 'mongoose';
import type { IStory } from '@/types';

const storySchema = new Schema<IStory>({
  userId: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true, index: true },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['photo', 'video'], required: true },
  thumbnail: { type: String },
  caption: { type: String, trim: true, maxlength: 500 },
  views: [{
    userId: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
    viewedAt: { type: Date, default: Date.now },
  }],
  likes: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
  reactions: [{
    userId: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  privacy: { type: String, enum: ['public', 'followers', 'close_friends'], default: 'followers' },
  archived: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Don't auto-delete — we keep expired stories as archived
storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 });

// Force schema refresh in dev (hot reload caches old model)
if (mongoose.models.Story) {
  delete mongoose.models.Story;
}
const Story = mongoose.model<IStory>('Story', storySchema);

export default Story;
