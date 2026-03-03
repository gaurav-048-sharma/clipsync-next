import mongoose, { Schema } from 'mongoose';
import type { IGroupChat } from '@/types';

const groupChatSchema = new Schema<IGroupChat>({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  description: { type: String, trim: true, maxlength: 200 },
  avatar: { type: String, default: null },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  members: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    nickname: { type: String, trim: true, maxlength: 30 },
    mutedUntil: { type: Date, default: null },
  }],
  lastMessage: {
    content: String,
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    messageType: { type: String, enum: ['text', 'image', 'video', 'emoji', 'system'], default: 'text' },
  },
  settings: {
    onlyAdminsCanMessage: { type: Boolean, default: false },
    onlyAdminsCanEditInfo: { type: Boolean, default: true },
    onlyAdminsCanAddMembers: { type: Boolean, default: false },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

groupChatSchema.index({ 'members.userId': 1 });
groupChatSchema.index({ creator: 1 });
groupChatSchema.index({ updatedAt: -1 });

groupChatSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

groupChatSchema.methods.isMember = function (userId: string) {
  return this.members.some((m: { userId: { toString: () => string } }) => m.userId.toString() === userId.toString());
};

groupChatSchema.methods.isAdmin = function (userId: string) {
  return this.admins.some((a: { toString: () => string }) => a.toString() === userId.toString()) ||
    this.creator.toString() === userId.toString();
};

const GroupChat = mongoose.models.GroupChat || mongoose.model<IGroupChat>('GroupChat', groupChatSchema);

export default GroupChat;
