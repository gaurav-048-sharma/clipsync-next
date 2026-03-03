import mongoose, { Schema } from 'mongoose';
import type { IEvent } from '@/types';

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true, maxlength: 200, trim: true },
  description: { type: String, required: true, maxlength: 5000 },
  organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  organizerCollege: {
    code: { type: String },
    name: { type: String },
    city: { type: String },
  },
  clubName: { type: String, maxlength: 100 },
  category: {
    type: String,
    enum: ['fest', 'hackathon', 'workshop', 'seminar', 'sports', 'cultural', 'party', 'meetup', 'other'],
    required: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  venue: {
    name: { type: String, required: true },
    address: { type: String },
    college: { type: String },
    isOnline: { type: Boolean, default: false },
    onlineLink: { type: String },
  },
  coverImage: { type: String },
  images: [{ type: String }],
  registrationType: { type: String, enum: ['free', 'paid', 'invite-only'], default: 'free' },
  ticketPrice: { type: Number, default: 0 },
  maxAttendees: { type: Number, default: null },
  registrationDeadline: { type: Date },
  registrationLink: { type: String },
  attendees: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['going', 'interested', 'registered'], default: 'interested' },
    registeredAt: { type: Date, default: Date.now },
    ticketCode: { type: String },
  }],
  interested: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  tags: [{ type: String, lowercase: true }],
  targetColleges: [{ type: String }],
  status: { type: String, enum: ['draft', 'published', 'cancelled', 'completed'], default: 'published' },
  isPublic: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

eventSchema.virtual('attendeeCount').get(function () {
  return this.attendees?.filter((a) => a.status === 'going' || a.status === 'registered').length || 0;
});

eventSchema.virtual('interestedCount').get(function () {
  return this.interested?.length || 0;
});

eventSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ 'organizerCollege.code': 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ targetColleges: 1, startDate: 1 });
eventSchema.index({ tags: 1 });

const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);

export default Event;
