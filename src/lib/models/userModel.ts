import mongoose, { Schema } from 'mongoose';
import type { IUserProfile } from '@/types';

const userProfileSchema = new Schema<IUserProfile>({
  authId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  bio: {
    type: String,
    default: '',
    maxlength: 150,
  },
  profilePicture: {
    type: String,
    default: 'default-profile-pic.jpg',
  },
  followers: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
  likedReels: [{ type: Schema.Types.ObjectId, ref: 'Reel' }],
  commentedReels: [{ type: Schema.Types.ObjectId, ref: 'Reel' }],
  savedPosts: [{ type: Schema.Types.ObjectId, ref: 'Reel' }],
  archivedPosts: [{ type: Schema.Types.ObjectId, ref: 'Reel' }],
  activityLog: [{
    action: {
      type: String,
      enum: ['like', 'comment', 'save', 'unsave', 'share', 'follow', 'unfollow', 'post', 'archive', 'unarchive'],
      required: true,
    },
    targetType: {
      type: String,
      enum: ['reel', 'user', 'comment'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const UserProfile = mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', userProfileSchema);

export default UserProfile;
