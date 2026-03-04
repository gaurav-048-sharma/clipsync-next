import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/models/authModel';
import UserProfile from '@/lib/models/userModel';
import Reel from '@/lib/models/reelModel';
import Notification from '@/lib/models/notificationModel';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';
import { parseFormData, uploadFilesToS3 } from '@/lib/utils/upload';
import { ensureProfile } from '@/lib/utils/ensureProfile';
import { getIO } from '@/lib/utils/socket';

// GET /api/users/me — own profile
export async function getOwnProfile(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    let user = await UserProfile.findOne({ authId: authUser._id }).populate('authId', 'username name email college enrollmentId segregation') as any;
    if (!user) {
      // Auto-create profile if auth user exists but profile was deleted
      user = new UserProfile({ authId: authUser._id });
      await user.save();
      user = await UserProfile.findOne({ authId: authUser._id }).populate('authId', 'username name email college enrollmentId segregation') as any;
    }
    
    const auth = await User.findById(authUser._id) as any;
    let department = null;
    try { department = auth?.enrollmentId ? (User as any).getDepartmentFromEnrollmentId(auth.enrollmentId) : null; } catch {}

    return NextResponse.json({ ...user.toObject(), college: auth?.college || null, enrollmentId: auth?.enrollmentId || null, department, segregation: auth?.segregation || null });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// GET /api/users/[username]
export async function getUserProfile(username: string) {
  try {
    await dbConnect();
    const auth = await User.findOne({ username }) as any;
    if (!auth) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    let user = await UserProfile.findOne({ authId: auth._id }).populate('authId', 'username name email college enrollmentId segregation');
    if (!user) {
      user = new UserProfile({ authId: auth._id });
      await user.save();
      user = await UserProfile.findOne({ authId: auth._id }).populate('authId', 'username name email college enrollmentId segregation');
    }

    let department = null;
    try { department = auth.enrollmentId ? (User as any).getDepartmentFromEnrollmentId(auth.enrollmentId) : null; } catch {}

    return NextResponse.json({ ...(user as any).toObject(), college: auth.college || null, enrollmentId: auth.enrollmentId || null, department, segregation: auth.segregation || null });
  } catch (err: any) {
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 });
  }
}

// POST /api/users — create profile
export async function createUserProfile(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const auth = await User.findById(authUser._id);
    if (!auth) return NextResponse.json({ message: 'Auth user not found' }, { status: 404 });

    const existing = await UserProfile.findOne({ authId: authUser._id });
    if (existing) return NextResponse.json({ message: 'Profile already exists for this user' }, { status: 400 });

    const user = new UserProfile({ authId: authUser._id });
    await user.save();
    const populated = await UserProfile.findById(user._id).populate('authId', 'username name');
    return NextResponse.json({ message: 'Profile created', user: populated }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// PUT /api/users — update profile
export async function updateUserProfile(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { files, fields } = await parseFormData(req);
    await uploadFilesToS3(files);

    let user = await UserProfile.findOne({ authId: authUser._id }) as any;
    if (!user) {
      user = new UserProfile({ authId: authUser._id });
      await user.save();
    }

    const auth = await User.findById(authUser._id) as any;
    if (!auth) return NextResponse.json({ message: 'Authentication record not found' }, { status: 404 });

    if (fields.bio !== undefined) user.bio = fields.bio;
    if (files.profilePicture?.[0]?.location) user.profilePicture = files.profilePicture[0].location;
    user.updated_at = new Date();

    if (fields.username !== undefined) {
      if (fields.username.length < 3 || fields.username.length > 30) return NextResponse.json({ message: 'Username must be 3-30 characters' }, { status: 400 });
      const existing = await User.findOne({ username: fields.username });
      if (existing && existing._id.toString() !== auth._id.toString()) return NextResponse.json({ message: 'Username already taken' }, { status: 400 });
      auth.username = fields.username;
    }
    if (fields.name !== undefined) auth.name = fields.name;
    auth.updated_at = new Date();

    await user.save();
    await auth.save();
    const populated = await UserProfile.findById(user._id).populate('authId', 'username name');

    return NextResponse.json({ message: 'Profile updated successfully', user: populated });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/users
export async function deleteUserProfile(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await UserProfile.findOne({ authId: authUser._id });
    if (!user) return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    await (user as any).deleteOne();
    return NextResponse.json({ message: 'Profile deleted' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// POST /api/users/follow/[username]
export async function followUser(req: NextRequest, username: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const follower = await ensureProfile(authUser._id) as any;
    const targetAuth = await User.findOne({ username }) as any;
    if (!targetAuth) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    const target = await ensureProfile(targetAuth._id) as any;
    if (follower._id.equals(target._id)) return NextResponse.json({ message: 'Cannot follow yourself' }, { status: 400 });

    if (!follower.following.some((id: any) => id.equals(target._id))) {
      follower.following.push(target._id);
      target.followers.push(follower._id);
      await follower.save();
      await target.save();

      try {
        const followerAuth = await User.findById(authUser._id) as any;
        const notification = new Notification({
          recipient: targetAuth._id, sender: authUser._id, type: 'follow',
          message: `${followerAuth.username} started following you`,
        });
        await notification.save();
        await notification.populate('sender', 'username name');
        const io = getIO();
        (io as any).to(targetAuth._id.toString()).emit('newNotification', notification);
      } catch {}
    }

    return NextResponse.json({ message: 'Followed successfully', followersCount: target.followers.length, followingCount: follower.following.length });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// POST /api/users/unfollow/[username]
export async function unfollowUser(req: NextRequest, username: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const follower = await ensureProfile(authUser._id) as any;
    const targetAuth = await User.findOne({ username });
    if (!targetAuth) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    const target = await ensureProfile(targetAuth._id) as any;

    follower.following = follower.following.filter((id: any) => !id.equals(target._id));
    target.followers = target.followers.filter((id: any) => !id.equals(follower._id));
    await follower.save();
    await target.save();

    return NextResponse.json({ message: 'Unfollowed successfully', followersCount: target.followers.length, followingCount: follower.following.length });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// GET /api/users/followers/[username]
export async function getFollowers(username: string) {
  try {
    await dbConnect();
    const auth = await User.findOne({ username });
    if (!auth) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    let user = await UserProfile.findOne({ authId: auth._id }).populate({ path: 'followers', populate: { path: 'authId', select: 'username name email' }, select: 'authId profilePicture bio' });
    if (!user) {
      user = new UserProfile({ authId: auth._id });
      await user.save();
    }
    return NextResponse.json({ followers: (user as any).followers || [] });
  } catch { return NextResponse.json({ message: 'Server error' }, { status: 500 }); }
}

// GET /api/users/following/[username]
export async function getFollowing(username: string) {
  try {
    await dbConnect();
    const auth = await User.findOne({ username });
    if (!auth) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    let user = await UserProfile.findOne({ authId: auth._id }).populate({ path: 'following', populate: { path: 'authId', select: 'username name email' }, select: 'authId profilePicture bio' });
    if (!user) {
      user = new UserProfile({ authId: auth._id });
      await user.save();
    }
    return NextResponse.json({ following: (user as any).following || [] });
  } catch { return NextResponse.json({ message: 'Server error' }, { status: 500 }); }
}

// GET /api/users/[username]/analytics
export async function getUserAnalytics(username: string) {
  try {
    await dbConnect();
    const auth = await User.findOne({ username }) as any;
    if (!auth) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    let user = await UserProfile.findOne({ authId: auth._id }) as any;
    if (!user) {
      user = new UserProfile({ authId: auth._id });
      await user.save();
      user = await UserProfile.findOne({ authId: auth._id }) as any;
    }

    const reels = await Reel.find({ userId: user._id }) as any[];
    const totalReels = reels.length;
    const totalViews = reels.reduce((s, r) => s + (r.views || 0), 0);
    const totalLikes = reels.reduce((s, r) => s + r.likes.length, 0);
    const totalComments = reels.reduce((s, r) => s + r.comments.length, 0);

    const topReels = reels
      .sort((a, b) => (b.likes.length * 3 + b.comments.length * 2 + (b.views || 0) * 0.1) - (a.likes.length * 3 + a.comments.length * 2 + (a.views || 0) * 0.1))
      .slice(0, 5)
      .map(r => ({ id: r._id, caption: r.caption, views: r.views || 0, likes: r.likes.length, comments: r.comments.length, mediaUrl: r.media?.[0]?.url || r.videoUrl, created_at: r.created_at }));

    return NextResponse.json({
      username: auth.username,
      analytics: {
        overview: { totalReels, totalViews, totalLikes, totalComments, followers: user.followers?.length || 0, following: user.following?.length || 0 },
        topReels,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 });
  }
}
