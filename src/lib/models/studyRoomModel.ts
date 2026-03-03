import mongoose, { Schema } from 'mongoose';
import type { IStudyRoom } from '@/types';

const participantSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  joinedAt: { type: Date, default: Date.now },
  studyTime: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  role: { type: String, enum: ['host', 'participant'], default: 'participant' },
});

const chatMessageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  text: { type: String, required: true, maxlength: 500 },
  timestamp: { type: Date, default: Date.now },
});

function arrayLimit(val: unknown[]): boolean {
  return val.length <= 100;
}

const studyRoomSchema = new Schema<IStudyRoom>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  subject: { type: String, trim: true, maxlength: 50 },
  host: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  participants: [participantSchema],
  maxParticipants: { type: Number, default: 10, min: 2, max: 50 },
  isPrivate: { type: Boolean, default: false },
  password: { type: String },
  tags: [{ type: String, trim: true, maxlength: 30 }],
  pomodoroState: {
    isEnabled: { type: Boolean, default: false },
    currentState: { type: String, enum: ['idle', 'work', 'break', 'longBreak'], default: 'idle' },
    isPaused: { type: Boolean, default: false },
    startTime: { type: Date },
    workDuration: { type: Number, default: 25 },
    breakDuration: { type: Number, default: 5 },
    longBreakDuration: { type: Number, default: 15 },
    currentCycle: { type: Number, default: 1 },
    cyclesBeforeLongBreak: { type: Number, default: 4 },
  },
  chatMessages: {
    type: [chatMessageSchema],
    validate: [arrayLimit, '{PATH} exceeds the limit of 100'],
  },
  totalStudyTime: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'scheduled', 'closed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

studyRoomSchema.index({ status: 1, createdAt: -1 });
studyRoomSchema.index({ host: 1 });
studyRoomSchema.index({ 'participants.userId': 1 });
studyRoomSchema.index({ tags: 1 });

studyRoomSchema.virtual('participantCount').get(function () {
  return this.participants.filter((p) => p.isActive).length;
});

studyRoomSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const StudyRoom = mongoose.models.StudyRoom || mongoose.model<IStudyRoom>('StudyRoom', studyRoomSchema);

export default StudyRoom;
