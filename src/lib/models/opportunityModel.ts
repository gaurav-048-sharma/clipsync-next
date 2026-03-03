import mongoose, { Schema, Document, Model } from 'mongoose';

// ============ TYPES ============
export interface IInternshipExperience extends Document {
  userId: mongoose.Types.ObjectId;
  company: string;
  role: string;
  department?: string;
  location: 'remote' | 'onsite' | 'hybrid';
  city?: string;
  duration: { months: number; type: 'summer' | 'winter' | '6-month' | 'full-time' };
  year: number;
  compensation: {
    isAnonymous: boolean;
    stipend?: number;
    hasHousing: boolean;
    housingAllowance?: number;
    hasTravelAllowance: boolean;
    travelAllowance?: number;
    otherPerks: string[];
  };
  ratings: {
    overall?: number;
    learning?: number;
    culture?: number;
    mentorship?: number;
    workLifeBalance?: number;
  };
  interviewProcess: {
    rounds: Array<{
      roundNumber: number;
      type: 'online-test' | 'technical' | 'hr' | 'managerial' | 'group-discussion' | 'case-study';
      description: string;
      difficulty: 'easy' | 'medium' | 'hard';
    }>;
    totalDuration?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    questionsAsked: string[];
  };
  experience?: string;
  tips?: string;
  pros: string[];
  cons: string[];
  wouldRecommend: boolean;
  gotPPO: boolean;
  isVerified: boolean;
  likes: mongoose.Types.ObjectId[];
  comments: Array<{
    userId: mongoose.Types.ObjectId;
    text: string;
    isAnonymous: boolean;
    created_at: Date;
  }>;
  views: number;
  created_at: Date;
  updated_at: Date;
}

export interface IReferral extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'request' | 'offer';
  company: string;
  role: string;
  jobLink?: string;
  profileSummary?: string;
  skills: string[];
  cgpa?: number;
  resumeUrl?: string;
  whyGoodFit?: string;
  slotsAvailable: number;
  criteria: {
    minCgpa?: number;
    branches: string[];
    skills: string[];
    batch?: string;
  };
  deadline?: Date;
  status: 'open' | 'in-progress' | 'closed' | 'fulfilled';
  applications: Array<{
    userId: mongoose.Types.ObjectId;
    message?: string;
    resumeUrl?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'referred';
    appliedAt: Date;
  }>;
  successfulReferrals: Array<{
    userId: mongoose.Types.ObjectId;
    outcome: 'interview' | 'offer' | 'joined';
    date: Date;
  }>;
  created_at: Date;
  updated_at: Date;
}

export interface IResumeReview extends Document {
  userId: mongoose.Types.ObjectId;
  resumeUrl: string;
  targetRole: string;
  targetCompanies: string[];
  reviewType: 'quick' | 'detailed';
  preferAlumniFrom?: string;
  currentStatus: 'pending' | 'in-review' | 'reviewed';
  reviews: Array<{
    reviewerId: mongoose.Types.ObjectId;
    isAlumni: boolean;
    alumniCompany?: string;
    overallScore?: number;
    sectionFeedback: {
      education?: { score: number; feedback: string };
      experience?: { score: number; feedback: string };
      projects?: { score: number; feedback: string };
      skills?: { score: number; feedback: string };
      formatting?: { score: number; feedback: string };
    };
    strengths: string[];
    improvements: string[];
    generalFeedback?: string;
    atsScore?: number;
    created_at: Date;
  }>;
  reviewKarmaUsed: number;
  created_at: Date;
  updated_at: Date;
}

export interface IPrepGroup extends Document {
  name: string;
  description?: string;
  type: 'company-specific' | 'role-specific' | 'general' | 'topic-specific';
  targetCompany?: string;
  targetRole?: string;
  topics: string[];
  createdBy: mongoose.Types.ObjectId;
  admins: mongoose.Types.ObjectId[];
  members: Array<{
    userId: mongoose.Types.ObjectId;
    role: 'member' | 'moderator';
    joinedAt: Date;
  }>;
  maxMembers: number;
  isPrivate: boolean;
  joinRequests: Array<{
    userId: mongoose.Types.ObjectId;
    message?: string;
    requestedAt: Date;
  }>;
  resources: Array<{
    title?: string;
    description?: string;
    url?: string;
    type: 'link' | 'document' | 'video' | 'article';
    addedBy: mongoose.Types.ObjectId;
    likes: mongoose.Types.ObjectId[];
    created_at: Date;
  }>;
  questions: Array<{
    question?: string;
    answer?: string;
    company?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    type: 'technical' | 'behavioral' | 'dsa' | 'system-design' | 'hr';
    addedBy: mongoose.Types.ObjectId;
    likes: mongoose.Types.ObjectId[];
    created_at: Date;
  }>;
  dailyChallenges: Array<{
    title?: string;
    description?: string;
    link?: string;
    date?: Date;
    completedBy: mongoose.Types.ObjectId[];
  }>;
  created_at: Date;
  updated_at: Date;
}

export interface IMockInterview extends Document {
  groupId?: mongoose.Types.ObjectId;
  interviewer: mongoose.Types.ObjectId;
  interviewee: mongoose.Types.ObjectId;
  type: 'technical' | 'behavioral' | 'dsa' | 'system-design' | 'hr' | 'mixed';
  targetCompany?: string;
  targetRole?: string;
  scheduledAt: Date;
  duration: number;
  meetingLink?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  feedback: {
    overallScore?: number;
    communication?: number;
    technicalSkills?: number;
    problemSolving?: number;
    confidence?: number;
    strengths: string[];
    areasToImprove: string[];
    detailedFeedback?: string;
    questionsAsked: string[];
    wouldHire?: boolean;
  };
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IUserKarma extends Document {
  userId: mongoose.Types.ObjectId;
  referralKarma: number;
  reviewKarma: number;
  interviewKarma: number;
  totalKarma: number;
  badges: Array<{ name: string; earnedAt: Date }>;
  referralsGiven: number;
  referralsReceived: number;
  resumesReviewed: number;
  mockInterviewsConducted: number;
  mockInterviewsAttended: number;
  questionsContributed: number;
  isVerifiedAlumni: boolean;
  alumniCompany?: string;
  created_at: Date;
  updated_at: Date;
}

// ============ INTERNSHIP EXPERIENCE SCHEMA ============
const internshipExperienceSchema = new Schema<IInternshipExperience>({
  userId: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  company: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  department: { type: String, trim: true },
  location: { type: String, enum: ['remote', 'onsite', 'hybrid'], default: 'onsite' },
  city: { type: String, trim: true },
  duration: {
    months: { type: Number, required: true },
    type: { type: String, enum: ['summer', 'winter', '6-month', 'full-time'], default: 'summer' },
  },
  year: { type: Number, required: true },
  compensation: {
    isAnonymous: { type: Boolean, default: true },
    stipend: { type: Number },
    hasHousing: { type: Boolean, default: false },
    housingAllowance: { type: Number },
    hasTravelAllowance: { type: Boolean, default: false },
    travelAllowance: { type: Number },
    otherPerks: [{ type: String }],
  },
  ratings: {
    overall: { type: Number, min: 1, max: 5 },
    learning: { type: Number, min: 1, max: 5 },
    culture: { type: Number, min: 1, max: 5 },
    mentorship: { type: Number, min: 1, max: 5 },
    workLifeBalance: { type: Number, min: 1, max: 5 },
  },
  interviewProcess: {
    rounds: [{
      roundNumber: Number,
      type: { type: String, enum: ['online-test', 'technical', 'hr', 'managerial', 'group-discussion', 'case-study'] },
      description: String,
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    }],
    totalDuration: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    questionsAsked: [{ type: String }],
  },
  experience: { type: String, maxlength: 5000 },
  tips: { type: String, maxlength: 2000 },
  pros: [{ type: String }],
  cons: [{ type: String }],
  wouldRecommend: { type: Boolean, default: true },
  gotPPO: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  likes: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
  comments: [{
    userId: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
    text: { type: String, maxlength: 1000 },
    isAnonymous: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  }],
  views: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// ============ REFERRAL SCHEMA ============
const referralSchema = new Schema<IReferral>({
  userId: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  type: { type: String, enum: ['request', 'offer'], required: true },
  company: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  jobLink: { type: String, trim: true },
  profileSummary: { type: String, maxlength: 1000 },
  skills: [{ type: String }],
  cgpa: { type: Number, min: 0, max: 10 },
  resumeUrl: { type: String },
  whyGoodFit: { type: String, maxlength: 1000 },
  slotsAvailable: { type: Number, default: 1 },
  criteria: {
    minCgpa: { type: Number },
    branches: [{ type: String }],
    skills: [{ type: String }],
    batch: { type: String },
  },
  deadline: { type: Date },
  status: { type: String, enum: ['open', 'in-progress', 'closed', 'fulfilled'], default: 'open' },
  applications: [{
    userId: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
    message: { type: String },
    resumeUrl: { type: String },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'referred'], default: 'pending' },
    appliedAt: { type: Date, default: Date.now },
  }],
  successfulReferrals: [{
    userId: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
    outcome: { type: String, enum: ['interview', 'offer', 'joined'] },
    date: { type: Date },
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// ============ RESUME REVIEW SCHEMA ============
const resumeReviewSchema = new Schema<IResumeReview>({
  userId: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  resumeUrl: { type: String, required: true },
  targetRole: { type: String, required: true },
  targetCompanies: [{ type: String }],
  reviewType: { type: String, enum: ['quick', 'detailed'], default: 'quick' },
  preferAlumniFrom: { type: String },
  currentStatus: { type: String, enum: ['pending', 'in-review', 'reviewed'], default: 'pending' },
  reviews: [{
    reviewerId: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
    isAlumni: { type: Boolean, default: false },
    alumniCompany: { type: String },
    overallScore: { type: Number, min: 1, max: 10 },
    sectionFeedback: {
      education: { score: Number, feedback: String },
      experience: { score: Number, feedback: String },
      projects: { score: Number, feedback: String },
      skills: { score: Number, feedback: String },
      formatting: { score: Number, feedback: String },
    },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    generalFeedback: { type: String, maxlength: 2000 },
    atsScore: { type: Number },
    created_at: { type: Date, default: Date.now },
  }],
  reviewKarmaUsed: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// ============ PREP GROUP SCHEMA ============
const prepGroupSchema = new Schema<IPrepGroup>({
  name: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 1000 },
  type: { type: String, enum: ['company-specific', 'role-specific', 'general', 'topic-specific'], required: true },
  targetCompany: { type: String },
  targetRole: { type: String },
  topics: [{ type: String }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  admins: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
  members: [{
    userId: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
    role: { type: String, enum: ['member', 'moderator'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  }],
  maxMembers: { type: Number, default: 50 },
  isPrivate: { type: Boolean, default: false },
  joinRequests: [{
    userId: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
    message: { type: String },
    requestedAt: { type: Date, default: Date.now },
  }],
  resources: [{
    title: { type: String },
    description: { type: String },
    url: { type: String },
    type: { type: String, enum: ['link', 'document', 'video', 'article'] },
    addedBy: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
    likes: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
    created_at: { type: Date, default: Date.now },
  }],
  questions: [{
    question: { type: String },
    answer: { type: String },
    company: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    type: { type: String, enum: ['technical', 'behavioral', 'dsa', 'system-design', 'hr'] },
    addedBy: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
    likes: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
    created_at: { type: Date, default: Date.now },
  }],
  dailyChallenges: [{
    title: { type: String },
    description: { type: String },
    link: { type: String },
    date: { type: Date },
    completedBy: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }],
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// ============ MOCK INTERVIEW SCHEMA ============
const mockInterviewSchema = new Schema<IMockInterview>({
  groupId: { type: Schema.Types.ObjectId, ref: 'PrepGroup' },
  interviewer: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  interviewee: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  type: { type: String, enum: ['technical', 'behavioral', 'dsa', 'system-design', 'hr', 'mixed'], required: true },
  targetCompany: { type: String },
  targetRole: { type: String },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 45 },
  meetingLink: { type: String },
  status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'], default: 'scheduled' },
  feedback: {
    overallScore: { type: Number, min: 1, max: 10 },
    communication: { type: Number, min: 1, max: 5 },
    technicalSkills: { type: Number, min: 1, max: 5 },
    problemSolving: { type: Number, min: 1, max: 5 },
    confidence: { type: Number, min: 1, max: 5 },
    strengths: [{ type: String }],
    areasToImprove: [{ type: String }],
    detailedFeedback: { type: String, maxlength: 2000 },
    questionsAsked: [{ type: String }],
    wouldHire: { type: Boolean },
  },
  notes: { type: String, maxlength: 2000 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// ============ USER KARMA SCHEMA ============
const userKarmaSchema = new Schema<IUserKarma>({
  userId: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true, unique: true },
  referralKarma: { type: Number, default: 0 },
  reviewKarma: { type: Number, default: 0 },
  interviewKarma: { type: Number, default: 0 },
  totalKarma: { type: Number, default: 0 },
  badges: [{ name: { type: String }, earnedAt: { type: Date, default: Date.now } }],
  referralsGiven: { type: Number, default: 0 },
  referralsReceived: { type: Number, default: 0 },
  resumesReviewed: { type: Number, default: 0 },
  mockInterviewsConducted: { type: Number, default: 0 },
  mockInterviewsAttended: { type: Number, default: 0 },
  questionsContributed: { type: Number, default: 0 },
  isVerifiedAlumni: { type: Boolean, default: false },
  alumniCompany: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// ============ CREATE MODELS ============
const InternshipExperience =
  (mongoose.models.InternshipExperience as Model<IInternshipExperience>) ||
  mongoose.model<IInternshipExperience>('InternshipExperience', internshipExperienceSchema);

const Referral =
  (mongoose.models.Referral as Model<IReferral>) ||
  mongoose.model<IReferral>('Referral', referralSchema);

const ResumeReview =
  (mongoose.models.ResumeReview as Model<IResumeReview>) ||
  mongoose.model<IResumeReview>('ResumeReview', resumeReviewSchema);

const PrepGroup =
  (mongoose.models.PrepGroup as Model<IPrepGroup>) ||
  mongoose.model<IPrepGroup>('PrepGroup', prepGroupSchema);

const MockInterview =
  (mongoose.models.MockInterview as Model<IMockInterview>) ||
  mongoose.model<IMockInterview>('MockInterview', mockInterviewSchema);

const UserKarma =
  (mongoose.models.UserKarma as Model<IUserKarma>) ||
  mongoose.model<IUserKarma>('UserKarma', userKarmaSchema);

export { InternshipExperience, Referral, ResumeReview, PrepGroup, MockInterview, UserKarma };
