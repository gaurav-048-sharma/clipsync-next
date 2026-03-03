import mongoose, { Schema } from 'mongoose';
import type { IMessage } from '@/types';

const messageSchema = new Schema<IMessage>({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  groupId: { type: Schema.Types.ObjectId, ref: 'GroupChat', default: null },
  content: { type: String, trim: true },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'emoji', 'link', 'heart', 'system'],
    default: 'text',
  },
  mediaUrl: { type: String, trim: true },
  mediaThumbnail: { type: String, trim: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
  deliveredAt: { type: Date },
  seenAt: { type: Date },
  seenBy: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    seenAt: { type: Date, default: Date.now },
  }],
  read: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  replyTo: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
  reactions: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, maxlength: 10 },
  }],
}, { timestamps: true });

messageSchema.index({ sender: 1, recipient: 1, timestamp: -1 });
messageSchema.index({ recipient: 1, status: 1 });
messageSchema.index({ groupId: 1, timestamp: -1 });

const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);

export default Message;
