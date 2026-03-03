import mongoose, { Schema } from 'mongoose';
import type { INotification } from '@/types';

const notificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'mention', 'story_view', 'reply'],
    required: true,
  },
  message: { type: String, required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Reel', default: null },
  commentId: { type: Schema.Types.ObjectId, default: null },
  read: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
