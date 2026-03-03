// TypeScript type declarations for ClipSync

import { Types, Document } from 'mongoose';

// ============ Auth Model Types ============
export interface ICollegeInfo {
  domain?: string;
  name?: string;
  code?: string;
  city?: string;
}

export interface ISegregation {
  year?: string;
  dept?: string;
  roll?: string;
  type?: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  microsoftId?: string;
  college: ICollegeInfo;
  enrollmentId?: string;
  segregation: ISegregation;
  theme: 'light' | 'dark';
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  is_verified: boolean;
  token?: string; // Virtual, attached at runtime
}

// ============ User Profile Types ============
export interface IActivityLogEntry {
  action: 'like' | 'comment' | 'save' | 'unsave' | 'share' | 'follow' | 'unfollow' | 'post' | 'archive' | 'unarchive';
  targetType: 'reel' | 'user' | 'comment';
  targetId: Types.ObjectId;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface IUserProfile extends Document {
  _id: Types.ObjectId;
  authId: Types.ObjectId | IUser;
  bio: string;
  profilePicture: string;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  likedReels: Types.ObjectId[];
  commentedReels: Types.ObjectId[];
  savedPosts: Types.ObjectId[];
  archivedPosts: Types.ObjectId[];
  activityLog: IActivityLogEntry[];
  created_at: Date;
  updated_at: Date;
}

// ============ Reel/Post Types ============
export interface IReply {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
  likes: Types.ObjectId[];
  created_at: Date;
  updated_at: Date;
}

export interface IComment {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
  likes: Types.ObjectId[];
  replies: IReply[];
  created_at: Date;
  updated_at: Date;
}

export interface IMediaItem {
  url: string;
  type: 'photo' | 'video';
}

export interface IViewEntry {
  userId: Types.ObjectId;
  viewedAt: Date;
}

export interface IReel extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  videoUrl?: string;
  media: IMediaItem[];
  caption: string;
  likes: Types.ObjectId[];
  comments: IComment[];
  views: number;
  viewedBy: IViewEntry[];
  isArchived: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============ Message Types ============
export interface IMessage extends Document {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
  recipient: Types.ObjectId | null;
  groupId: Types.ObjectId | null;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'emoji' | 'link' | 'heart' | 'system';
  mediaUrl?: string;
  mediaThumbnail?: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'seen';
  deliveredAt?: Date;
  seenAt?: Date;
  seenBy: Array<{ userId: Types.ObjectId; seenAt: Date }>;
  read: boolean;
  isEdited: boolean;
  deletedFor: Types.ObjectId[];
  replyTo: Types.ObjectId | null;
  reactions: Array<{ userId: Types.ObjectId; emoji: string }>;
}

// ============ Story Types ============
export interface IStoryReaction {
  userId: Types.ObjectId;
  emoji: string;
  createdAt: Date;
}

export interface IStoryView {
  userId: Types.ObjectId;
  viewedAt: Date;
}

export interface IStory extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  thumbnail?: string;
  caption?: string;
  views: IStoryView[];
  likes: Types.ObjectId[];
  reactions: IStoryReaction[];
  privacy: 'public' | 'followers' | 'close_friends';
  archived: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Notification Types ============
export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  sender: Types.ObjectId;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'story_view' | 'reply';
  message: string;
  postId?: Types.ObjectId;
  commentId?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

// ============ Group Chat Types ============
export interface IGroupMember {
  userId: Types.ObjectId;
  joinedAt: Date;
  role: 'admin' | 'member';
  nickname?: string;
  mutedUntil?: Date;
}

export interface IGroupChat extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  avatar?: string;
  creator: Types.ObjectId;
  admins: Types.ObjectId[];
  members: IGroupMember[];
  lastMessage: {
    content: string;
    sender: Types.ObjectId;
    timestamp: Date;
    messageType: 'text' | 'image' | 'video' | 'emoji' | 'system';
  };
  settings: {
    onlyAdminsCanMessage: boolean;
    onlyAdminsCanEditInfo: boolean;
    onlyAdminsCanAddMembers: boolean;
  };
  isActive: boolean;
}

// ============ Confession Types ============
export interface IConfession extends Document {
  _id: Types.ObjectId;
  content: string;
  author: Types.ObjectId;
  college: ICollegeInfo;
  targetColleges: string[];
  reactions: {
    heart: Types.ObjectId[];
    laugh: Types.ObjectId[];
    sad: Types.ObjectId[];
    fire: Types.ObjectId[];
    shock: Types.ObjectId[];
  };
  comments: Array<{
    _id?: Types.ObjectId;
    content: string;
    author: Types.ObjectId;
    isAnonymous: boolean;
    displayName: string;
    createdAt: Date;
    likes: Types.ObjectId[];
  }>;
  status: 'pending' | 'approved' | 'rejected' | 'reported';
  reportCount: number;
  reportedBy: Types.ObjectId[];
  tags: string[];
  isVisible: boolean;
  trendingScore: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Event Types ============
export interface IEvent extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  organizer: Types.ObjectId;
  organizerCollege: ICollegeInfo;
  clubName?: string;
  category: string;
  startDate: Date;
  endDate: Date;
  venue: {
    name: string;
    address?: string;
    college?: string;
    isOnline: boolean;
    onlineLink?: string;
  };
  coverImage?: string;
  images: string[];
  registrationType: 'free' | 'paid' | 'invite-only';
  ticketPrice: number;
  maxAttendees?: number;
  registrationDeadline?: Date;
  registrationLink?: string;
  attendees: Array<{
    user: Types.ObjectId;
    status: 'going' | 'interested' | 'registered';
    registeredAt: Date;
    ticketCode?: string;
  }>;
  interested: Types.ObjectId[];
  tags: string[];
  targetColleges: string[];
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  isPublic: boolean;
  views: number;
  shares: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Marketplace Types ============
export interface IMarketplaceItem extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  seller: Types.ObjectId;
  sellerCollege: ICollegeInfo;
  category: string;
  price: number;
  originalPrice?: number;
  isNegotiable: boolean;
  isFree: boolean;
  images: string[];
  condition: string;
  status: 'available' | 'reserved' | 'sold' | 'removed';
  savedBy: Types.ObjectId[];
  views: number;
  viewedBy: Types.ObjectId[];
  tags: string[];
  meetupLocations: string[];
  isVisible: boolean;
  reportedBy: Array<{ user: Types.ObjectId; reason: string; createdAt: Date }>;
  reportCount: number;
  interestedBuyers: Array<{ user: Types.ObjectId; message?: string; offeredPrice?: number; createdAt: Date }>;
  buyer?: Types.ObjectId;
  soldAt?: Date;
  soldPrice?: number;
  canDeliver: boolean;
  deliveryCharge: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Q&A Types ============
export interface IQuestion extends Document {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  isAnonymous: boolean;
  anonymousId?: string;
  title: string;
  body: string;
  codeSnippet?: { language: string; code: string };
  images: string[];
  tags: string[];
  subject?: string;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  answerCount: number;
  acceptedAnswer?: Types.ObjectId;
  views: number;
  status: 'open' | 'resolved' | 'closed';
  hotScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnswer extends Document {
  _id: Types.ObjectId;
  questionId: Types.ObjectId;
  author: Types.ObjectId;
  isAnonymous: boolean;
  anonymousId?: string;
  body: string;
  codeSnippet?: { language: string; code: string };
  images: string[];
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  isAccepted: boolean;
  comments: Array<{
    author: Types.ObjectId;
    text: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Study Room Types ============
export interface IStudyRoom extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  subject?: string;
  host: Types.ObjectId;
  participants: Array<{
    user: Types.ObjectId;
    joinedAt: Date;
    studyTime: number;
    isActive: boolean;
    role: 'host' | 'participant';
  }>;
  maxParticipants: number;
  isPrivate: boolean;
  password?: string;
  tags: string[];
  pomodoroState: {
    isEnabled: boolean;
    currentState: 'idle' | 'work' | 'break' | 'longBreak';
    isPaused: boolean;
    startTime?: Date;
    workDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    currentCycle: number;
    cyclesBeforeLongBreak: number;
  };
  chatMessages: Array<{
    sender: Types.ObjectId;
    text: string;
    timestamp: Date;
  }>;
  totalStudyTime: number;
  status: 'active' | 'scheduled' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

// ============ API Response Types ============
export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// ============ Auth Request Types ============
export interface AuthenticatedRequest {
  user: {
    _id: string;
    email?: string;
  };
}

export interface JwtPayload {
  id: string;
  email?: string;
  iat?: number;
  exp?: number;
}
