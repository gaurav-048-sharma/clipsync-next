import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/models/authModel';
import UserProfile from '@/lib/models/userModel';
import BlacklistedToken from '@/lib/models/blacklistedToken';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';
import { checkBlacklist } from '@/lib/middleware/checkBlacklist';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/signup
export async function signup(req: NextRequest) {
  try {
    await dbConnect();
    const { username, name, email, password } = await req.json();

    if (!password) return NextResponse.json({ message: 'Password is required for email signup' }, { status: 400 });
    if (username.length < 3 || username.length > 30) return NextResponse.json({ message: 'Username must be 3-30 characters' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });

    const existingAuth = await User.findOne({ $or: [{ username }, { email }] });
    if (existingAuth) {
      return NextResponse.json({
        message: (existingAuth as any).username === username ? 'Username already taken' : 'Email already exists',
      }, { status: 400 });
    }

    const user = new User({ username, name, email, password });
    await user.save();

    const userProfile = new UserProfile({ authId: user._id });
    await userProfile.save();

    return NextResponse.json({ message: 'User created successfully', user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}

// POST /api/auth/login
export async function login(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ message: 'User does not exist' }, { status: 400 });
    if ((user as any).googleId) return NextResponse.json({ message: 'This account uses Google authentication. Please log in with Google.' }, { status: 400 });
    if (!(user as any).password) return NextResponse.json({ message: 'No password set for this account' }, { status: 400 });

    const isMatch = await bcrypt.compare(password, (user as any).password);
    if (!isMatch) return NextResponse.json({ message: 'Incorrect password' }, { status: 400 });

    const token = jwt.sign({ id: user._id, email: (user as any).email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    return NextResponse.json({ message: 'Login successful', token, segregation: (user as any).segregation });
  } catch (err: any) {
    return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 });
  }
}

// POST /api/auth/google-login
export async function googleLogin(req: NextRequest) {
  try {
    await dbConnect();
    const { token } = await req.json();
    if (!token) return NextResponse.json({ message: 'Token is required' }, { status: 400 });

    const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID || '' });
    const payload = ticket.getPayload()!;
    const { email, name, sub: googleId } = payload;

    const collegeInfo = (User as any).getCollegeFromEmail(email);
    const enrollmentId = collegeInfo ? (User as any).extractEnrollmentId(email) : null;
    const username = email!.split('@')[0].replace(/\s+/g, '').toUpperCase();

    let auth = await User.findOne({ email });
    if (!auth) {
      auth = new User({
        email, name, googleId, username, enrollmentId,
        college: collegeInfo ? {
          domain: email!.split('@')[1].toLowerCase(),
          name: collegeInfo.name, code: collegeInfo.code, city: collegeInfo.city,
        } : undefined,
      });
      await auth.save();
      const userProfile = new UserProfile({ authId: auth._id });
      await userProfile.save();
    } else {
      let needsUpdate = false;
      if (!(auth as any).googleId) { (auth as any).googleId = googleId; needsUpdate = true; }
      if (!(auth as any).college?.code && collegeInfo) {
        (auth as any).college = { domain: email!.split('@')[1].toLowerCase(), name: collegeInfo.name, code: collegeInfo.code, city: collegeInfo.city };
        needsUpdate = true;
      }
      if (needsUpdate) await auth.save();
    }

    const tokenJwt = jwt.sign({ id: auth._id, email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    const department = (auth as any).enrollmentId ? (User as any).getDepartmentFromEnrollmentId((auth as any).enrollmentId) : null;

    return NextResponse.json({ token: tokenJwt, college: (auth as any).college, enrollmentId: (auth as any).enrollmentId, department });
  } catch (err: any) {
    return NextResponse.json({ message: 'Google authentication failed', error: err.message }, { status: 500 });
  }
}

// POST /api/auth/microsoft-login
export async function microsoftLogin(req: NextRequest) {
  try {
    await dbConnect();
    const { token } = await req.json();
    if (!token) return NextResponse.json({ message: 'Token is required' }, { status: 400 });

    const graphResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { mail, displayName, userPrincipalName } = graphResponse.data;
    const email = mail || userPrincipalName;
    if (!email) throw new Error('No email found in Graph API response');

    if (!(User as any).isAllowedDomain(email)) {
      const allowedColleges = Object.values((User as any).COLLEGE_DOMAINS).map((c: any) => c.name).slice(0, 5).join(', ');
      return NextResponse.json({ message: 'Access denied: Only registered college email addresses are allowed', hint: `Supported colleges include: ${allowedColleges}, and more.` }, { status: 403 });
    }

    const collegeInfo = (User as any).getCollegeFromEmail(email);
    const enrollmentId = (User as any).extractEnrollmentId(email);

    let auth = await User.findOne({ email });
    if (!auth) {
      const username = userPrincipalName.split('@')[0].toUpperCase();
      auth = new User({
        email, name: displayName || 'Unknown', microsoftId: userPrincipalName, username, enrollmentId,
        college: collegeInfo ? { domain: email.split('@')[1].toLowerCase(), name: collegeInfo.name, code: collegeInfo.code, city: collegeInfo.city } : undefined,
      });
      await auth.save();
      const userProfile = new UserProfile({ authId: auth._id });
      await userProfile.save();
    } else {
      let needsUpdate = false;
      if (!(auth as any).microsoftId) { (auth as any).microsoftId = userPrincipalName; needsUpdate = true; }
      if (!(auth as any).college?.code && collegeInfo) {
        (auth as any).college = { domain: email.split('@')[1].toLowerCase(), name: collegeInfo.name, code: collegeInfo.code, city: collegeInfo.city };
        needsUpdate = true;
      }
      if (!(auth as any).enrollmentId) { (auth as any).enrollmentId = enrollmentId; needsUpdate = true; }
      if (needsUpdate) await auth.save();
    }

    const tokenJwt = jwt.sign({ id: auth._id, email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    const department = (auth as any).enrollmentId ? (User as any).getDepartmentFromEnrollmentId((auth as any).enrollmentId) : null;

    return NextResponse.json({ token: tokenJwt, segregation: (auth as any).segregation, college: (auth as any).college, enrollmentId: (auth as any).enrollmentId, department });
  } catch (err: any) {
    return NextResponse.json({ message: 'Microsoft authentication failed', error: err.message }, { status: 500 });
  }
}

// POST /api/auth/logout
export async function logout(req: NextRequest) {
  try {
    await dbConnect();
    const blacklistResult = await checkBlacklist(req);
    if (blacklistResult) return blacklistResult;

    const token = req.headers.get('authorization')!.split(' ')[1];
    const blacklistedToken = new BlacklistedToken({ token });
    await blacklistedToken.save();
    return NextResponse.json({ message: 'Logout successful' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// GET /api/auth/all
export async function getAllUsers() {
  try {
    await dbConnect();
    const users = await User.find({}, 'username name segregation').lean();
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// GET /api/auth/search?q=&college=&department=&year=&limit=
export async function searchUsers(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const college = searchParams.get('college');
    const department = searchParams.get('department');
    const year = searchParams.get('year');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!q && !college && !department && !year) {
      return NextResponse.json({ message: 'At least one search parameter is required' }, { status: 400 });
    }

    const orConditions: Record<string, any>[] = [];
    const searchQuery: Record<string, any> = {};

    if (q?.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      orConditions.push(
        { username: searchRegex }, { name: searchRegex }, { email: searchRegex },
        { 'college.name': searchRegex }, { 'college.code': searchRegex }, { enrollmentId: searchRegex }
      );
    }
    if (college) { searchQuery['college.name'] = new RegExp(college.trim(), 'i'); }
    if (department) { searchQuery['segregation.dept'] = new RegExp(department.trim(), 'i'); }
    if (year) { searchQuery['segregation.year'] = year; }

    let finalQuery: Record<string, any> = {};
    if (orConditions.length > 0) finalQuery.$or = orConditions;
    finalQuery = { ...finalQuery, ...searchQuery };

    const users = await User.find(finalQuery).select('username name email college segregation enrollmentId').limit(limit).lean() as any[];
    const userIds = users.map(u => u._id);
    const profiles = await UserProfile.find({ authId: { $in: userIds } }).select('authId profilePicture bio').lean() as any[];
    const profileMap: Record<string, any> = {};
    profiles.forEach(p => { profileMap[p.authId.toString()] = p; });

    const results = users.map(user => {
      const profile = profileMap[user._id.toString()] || {};
      const dept = user.enrollmentId ? (User as any).getDepartmentFromEnrollmentId(user.enrollmentId) : null;
      return {
        _id: user._id, username: user.username, name: user.name || '', email: user.email,
        profilePicture: profile.profilePicture || '/default-avatar.svg', bio: profile.bio || '',
        college: user.college || null, department: dept, year: user.segregation?.year || null, enrollmentId: user.enrollmentId || null,
      };
    });

    return NextResponse.json({ count: results.length, users: results });
  } catch (err: any) {
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 });
  }
}

// GET /api/auth/colleges
export async function getSupportedColleges() {
  try {
    const colleges = Object.entries((User as any).COLLEGE_DOMAINS).map(([domain, info]: [string, any]) => ({ domain, ...info }));
    return NextResponse.json({ count: colleges.length, colleges });
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// GET /api/auth/user/[username]
export async function getUser(username: string) {
  try {
    await dbConnect();
    const auth = await User.findOne({ username });
    if (!auth) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const user = await UserProfile.findOne({ authId: auth._id });
    if (!user) return NextResponse.json({ message: 'User profile not found' }, { status: 404 });

    return NextResponse.json({
      _id: auth._id,
      authId: { username: (auth as any).username, name: (auth as any).name },
      profilePicture: (user as any).profilePicture, bio: (user as any).bio,
      segregation: (user as any).segregation,
      college: (auth as any).college || null, enrollmentId: (auth as any).enrollmentId || null,
      department: (auth as any).enrollmentId ? (User as any).getDepartmentFromEnrollmentId((auth as any).enrollmentId) : null,
    });
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// GET /api/auth/userById/[id]
export async function getUserById(req: NextRequest, id: string) {
  try {
    await dbConnect();
    await verifyAuth(req);

    const auth = await User.findById(id);
    if (!auth) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const user = await UserProfile.findOne({ authId: auth._id });
    if (!user) return NextResponse.json({ message: 'User profile not found' }, { status: 404 });

    return NextResponse.json({
      _id: auth._id,
      authId: { username: (auth as any).username, name: (auth as any).name },
      profilePicture: (user as any).profilePicture, bio: (user as any).bio,
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// GET /api/auth/profile
export async function getOwnProfile(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const auth = await User.findById(authUser._id).select('-password -googleId');
    if (!auth) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    return NextResponse.json(auth);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// PUT /api/auth/profile
export async function updateProfile(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { username, name, password } = await req.json();
    const auth = await User.findById(authUser._id) as any;
    if (!auth) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    if (username && username !== auth.username) {
      if (username.length < 3 || username.length > 30) return NextResponse.json({ message: 'Username must be 3-30 characters' }, { status: 400 });
      const existing = await User.findOne({ username });
      if (existing) return NextResponse.json({ message: 'Username already taken' }, { status: 400 });
      auth.username = username;
    }
    if (name !== undefined) auth.name = name;
    if (password) {
      if (password.length < 6) return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
      auth.password = password;
    }
    auth.updated_at = new Date();
    await auth.save();

    return NextResponse.json({ message: 'Profile updated', auth });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/auth/profile
export async function deleteAccount(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const auth = await User.findById(authUser._id);
    if (!auth) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    await UserProfile.findOneAndDelete({ authId: auth._id });
    await (auth as any).deleteOne();

    return NextResponse.json({ message: 'Account and profile deleted successfully' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
