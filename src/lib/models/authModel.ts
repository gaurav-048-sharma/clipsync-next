import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUser } from '@/types';

// Supported Bangalore Colleges
export const COLLEGE_DOMAINS: Record<string, { name: string; code: string; city: string }> = {
  'gcu.edu.in': { name: 'Garden City University', code: 'GCU', city: 'Bangalore' },
  'pes.edu': { name: 'PES University', code: 'PES', city: 'Bangalore' },
  'pesu.pes.edu': { name: 'PES University', code: 'PESU', city: 'Bangalore' },
  'rvce.edu.in': { name: 'RV College of Engineering', code: 'RVCE', city: 'Bangalore' },
  'bmsce.ac.in': { name: 'BMS College of Engineering', code: 'BMSCE', city: 'Bangalore' },
  'msrit.edu': { name: 'Ramaiah Institute of Technology', code: 'MSRIT', city: 'Bangalore' },
  'cmrit.ac.in': { name: 'CMR Institute of Technology', code: 'CMRIT', city: 'Bangalore' },
  'nie.ac.in': { name: 'NIE Institute of Technology', code: 'NIE', city: 'Mysore' },
  'dsce.edu.in': { name: 'Dayananda Sagar College of Engineering', code: 'DSCE', city: 'Bangalore' },
  'sjce.ac.in': { name: 'Sri Jayachamarajendra College of Engineering', code: 'SJCE', city: 'Mysore' },
  'nmit.ac.in': { name: 'Nitte Meenakshi Institute of Technology', code: 'NMIT', city: 'Bangalore' },
  'rnsit.ac.in': { name: 'RNS Institute of Technology', code: 'RNSIT', city: 'Bangalore' },
  'bnmit.in': { name: 'BNM Institute of Technology', code: 'BNMIT', city: 'Bangalore' },
  'christuniversity.in': { name: 'Christ University', code: 'CHRIST', city: 'Bangalore' },
  'jainuniversity.ac.in': { name: 'Jain University', code: 'JAIN', city: 'Bangalore' },
  'reva.edu.in': { name: 'REVA University', code: 'REVA', city: 'Bangalore' },
  'gitam.edu': { name: 'GITAM University', code: 'GITAM', city: 'Bangalore' },
  'presidencyuniversity.in': { name: 'Presidency University', code: 'PU', city: 'Bangalore' },
  'alliance.edu.in': { name: 'Alliance University', code: 'AU', city: 'Bangalore' },
  'mvjce.edu.in': { name: 'MVJ College of Engineering', code: 'MVJCE', city: 'Bangalore' },
  'sirmvit.edu': { name: 'Sir M Visvesvaraya Institute of Technology', code: 'SMVIT', city: 'Bangalore' },
  'bmsit.in': { name: 'BMS Institute of Technology', code: 'BMSIT', city: 'Bangalore' },
};

export const DEPARTMENT_CODES: Record<string, string> = {
  'BTCS': 'Computer Science Engineering',
  'BTIT': 'Information Technology',
  'BTEC': 'Electronics & Communication',
  'BTEE': 'Electrical Engineering',
  'BTME': 'Mechanical Engineering',
  'BTCE': 'Civil Engineering',
  'BTAI': 'Artificial Intelligence',
  'BTML': 'Machine Learning',
  'BTDS': 'Data Science',
  'BTCY': 'Cyber Security',
  'BSCS': 'Computer Science',
  'BSIT': 'Information Technology',
  'BSDS': 'Data Science',
  'BSAI': 'Artificial Intelligence',
  'BSPH': 'Physics',
  'BSCH': 'Chemistry',
  'BSMA': 'Mathematics',
  'BSBT': 'Biotechnology',
  'BCAA': 'Computer Applications',
  'BBAA': 'Business Administration',
  'BBAF': 'Finance',
  'BBAM': 'Marketing',
  'BAEN': 'English',
  'BAPS': 'Psychology',
  'BAJM': 'Journalism & Mass Communication',
  'BACO': 'Commerce',
  'MTCS': 'M.Tech Computer Science',
  'MTAI': 'M.Tech AI & ML',
  'MBAA': 'MBA',
  'MCAA': 'MCA',
  'CS': 'Computer Science',
  'IT': 'Information Technology',
  'EC': 'Electronics',
  'EE': 'Electrical',
  'ME': 'Mechanical',
  'CE': 'Civil',
};

const getDepartmentFromCode = (enrollmentId: string): string | null => {
  if (!enrollmentId) return null;
  const match = enrollmentId.match(/^\d{2}([A-Z]{2,4})/i);
  if (match) {
    const deptCode = match[1].toUpperCase();
    return DEPARTMENT_CODES[deptCode] || deptCode;
  }
  return null;
};

interface IUserMethods {
  // instance methods can go here
}

interface IUserModel extends Model<IUser, object, IUserMethods> {
  segregateUser(username: string): { year?: string; dept?: string; roll?: string; type: string };
  getAllowedDomains(): string[];
  isAllowedDomain(email: string): boolean;
  getCollegeFromEmail(email: string): { name: string; code: string; city: string } | null;
  extractEnrollmentId(email: string): string;
  getDepartmentFromEnrollmentId(enrollmentId: string): string | null;
  COLLEGE_DOMAINS: typeof COLLEGE_DOMAINS;
  DEPARTMENT_CODES: typeof DEPARTMENT_CODES;
}

const userSchema = new Schema<IUser, IUserModel>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  name: {
    type: String,
    default: '',
    trim: true,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: function (this: IUser) {
      return !this.googleId && !this.microsoftId;
    },
    minlength: 6,
  },
  googleId: {
    type: String,
    sparse: true,
    default: undefined,
  },
  microsoftId: {
    type: String,
  },
  college: {
    domain: { type: String },
    name: { type: String },
    code: { type: String },
    city: { type: String },
  },
  enrollmentId: {
    type: String,
    trim: true,
  },
  segregation: {
    year: { type: String },
    dept: { type: String },
    roll: { type: String },
    type: { type: String, default: 'general' },
  },
  theme: {
    type: String,
    default: 'light',
    enum: ['light', 'dark'],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  is_verified: {
    type: Boolean,
    default: false,
  },
});

// Static methods
userSchema.statics.segregateUser = function (username: string) {
  const regex = /^(\d{2})([A-Z]{4})(\d{3})$/;
  const match = username.match(regex);
  if (match) {
    return {
      year: match[1],
      dept: match[2],
      roll: match[3],
      type: 'student',
    };
  }
  return { type: 'general' };
};

userSchema.statics.getAllowedDomains = function () {
  return Object.keys(COLLEGE_DOMAINS);
};

userSchema.statics.isAllowedDomain = function (email: string) {
  const domain = email.split('@')[1]?.toLowerCase();
  return COLLEGE_DOMAINS.hasOwnProperty(domain);
};

userSchema.statics.getCollegeFromEmail = function (email: string) {
  const domain = email.split('@')[1]?.toLowerCase();
  return COLLEGE_DOMAINS[domain] || null;
};

userSchema.statics.extractEnrollmentId = function (email: string) {
  const localPart = email.split('@')[0];
  const enrollmentRegex = /^(\d{2}[A-Z]{2,4}\d{2,4})$/i;
  const match = localPart.toUpperCase().match(enrollmentRegex);
  return match ? match[1] : localPart.toUpperCase();
};

userSchema.statics.getDepartmentFromEnrollmentId = function (enrollmentId: string) {
  return getDepartmentFromCode(enrollmentId);
};

(userSchema.statics as any).COLLEGE_DOMAINS = COLLEGE_DOMAINS;
(userSchema.statics as any).DEPARTMENT_CODES = DEPARTMENT_CODES;

userSchema.pre('save', async function (next) {
  try {
    if (!this.googleId && !this.microsoftId && this.isModified('password') && this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    if (this.isModified('username') || this.isNew) {
      const UserModel = this.constructor as IUserModel;
      this.segregation = UserModel.segregateUser(this.username);
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

const User: IUserModel = (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;
