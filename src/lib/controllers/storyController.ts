import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Story from '@/lib/models/storyModel';
import UserProfile from '@/lib/models/userModel';
import User from '@/lib/models/authModel';
import Notification from '@/lib/models/notificationModel';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';
import { parseFormData, uploadFilesToS3 } from '@/lib/utils/upload';

const STORY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============ CREATE STORY ============
export async function createStory(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { files, fields } = await parseFormData(req);
    await uploadFilesToS3(files);

    const user = await UserProfile.findOne({ authId: authUser._id });
    if (!user) return NextResponse.json({ message: 'User profile not found' }, { status: 404 });

    const file = files.media?.[0] || files.video?.[0];
    if (!file?.location) return NextResponse.json({ message: 'Media file is required' }, { status: 400 });

    const isVideo = file.mimetype.startsWith('video/');
    const story = new Story({
      userId: user._id,
      mediaUrl: file.location,
      mediaType: isVideo ? 'video' : 'photo',
      caption: fields.caption || '',
      privacy: fields.privacy || 'followers',
      expiresAt: new Date(Date.now() + STORY_DURATION_MS),
    });
    await story.save();

    return NextResponse.json({ message: 'Story created successfully', story }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error('createStory error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ GET STORIES (feed) ============
export async function getStories(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await UserProfile.findOne({ authId: authUser._id }) as any;
    if (!user) return NextResponse.json({ message: 'User profile not found' }, { status: 404 });

    const followingIds = user.following || [];
    const allIds = [...followingIds, user._id];

    // Only get non-expired stories
    const now = new Date();
    const stories = await Story.find({
      userId: { $in: allIds },
      expiresAt: { $gt: now },
      archived: { $ne: true },
    })
      .populate({
        path: 'userId',
        select: 'authId profilePicture',
        populate: { path: 'authId', select: 'username name' },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Group stories by user, compute hasUnviewed per user
    const grouped: Record<string, any> = {};
    const currentUserProfileId = user._id.toString();

    (stories as any[]).forEach(story => {
      if (!story.userId?.authId) return;
      const uid = story.userId._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = {
          userId: story.userId._id,
          username: story.userId.authId.username,
          name: story.userId.authId.name,
          profilePicture: story.userId.profilePicture,
          hasUnviewed: false,
          stories: [],
        };
      }
      // Check if current user has viewed this story
      const hasViewed = story.views.some(
        (v: any) => v.userId?.toString() === currentUserProfileId
      );
      if (!hasViewed) {
        grouped[uid].hasUnviewed = true;
      }
      // Backward compat: old stories have media[{url,type}], new have mediaUrl/mediaType
      const mediaUrl = story.mediaUrl || (story as any).media?.[0]?.url || '';
      const mediaType = story.mediaType || (story as any).media?.[0]?.type || 'photo';

      grouped[uid].stories.push({
        _id: story._id,
        mediaUrl,
        mediaType,
        thumbnail: story.thumbnail,
        caption: story.caption,
        views: Array.isArray(story.views) ? story.views.length : (story.views || 0),
        likes: story.likes?.length || 0,
        reactions: story.reactions || [],
        hasViewed,
        hasLiked: story.likes?.some((id: any) => id.toString() === currentUserProfileId) || false,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
      });
    });

    // Sort: current user's stories first, then unviewed first, then viewed
    const result = Object.values(grouped);
    result.sort((a: any, b: any) => {
      if (a.userId.toString() === currentUserProfileId) return -1;
      if (b.userId.toString() === currentUserProfileId) return 1;
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    return NextResponse.json({ stories: result });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error('getStories error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ GET SINGLE STORY ============
export async function getStoryById(req: NextRequest, id: string) {
  try {
    await dbConnect();
    await verifyAuth(req);
    const story = await Story.findById(id)
      .populate({
        path: 'userId',
        select: 'authId profilePicture',
        populate: { path: 'authId', select: 'username name' },
      });
    if (!story) return NextResponse.json({ message: 'Story not found' }, { status: 404 });
    return NextResponse.json({ story });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ VIEW STORY ============
export async function viewStory(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await UserProfile.findOne({ authId: authUser._id });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const story = await Story.findById(id) as any;
    if (!story) return NextResponse.json({ message: 'Story not found' }, { status: 404 });

    // Don't record own views
    if (story.userId.toString() !== user._id.toString()) {
      // Atomic: only add view if this userId isn't already in the views array
      await Story.updateOne(
        { _id: id, 'views.userId': { $ne: user._id } },
        { $push: { views: { userId: user._id, viewedAt: new Date() } } }
      );
    }

    const updated = await Story.findById(id) as any;
    return NextResponse.json({ message: 'Story viewed', views: updated?.views?.length || 0 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ GET VIEWERS ============
export async function getViewers(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await UserProfile.findOne({ authId: authUser._id });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const story = await Story.findById(id)
      .populate({
        path: 'views.userId',
        select: 'authId profilePicture',
        populate: { path: 'authId', select: 'username name' },
      }) as any;
    if (!story) return NextResponse.json({ message: 'Story not found' }, { status: 404 });

    // Only the owner can see viewers
    if (story.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Deduplicate viewers by userId (keep the earliest view)
    const seen = new Set<string>();
    const viewers = story.views
      .filter((v: any) => v.userId?.authId)
      .filter((v: any) => {
        const uid = v.userId._id.toString();
        if (seen.has(uid)) return false;
        seen.add(uid);
        return true;
      })
      .map((v: any) => ({
        userId: v.userId._id,
        username: v.userId.authId.username,
        name: v.userId.authId.name,
        profilePicture: v.userId.profilePicture,
        viewedAt: v.viewedAt,
      }));

    return NextResponse.json({ viewers, total: viewers.length });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ LIKE/UNLIKE STORY ============
export async function likeStory(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await UserProfile.findOne({ authId: authUser._id });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const story = await Story.findById(id) as any;
    if (!story) return NextResponse.json({ message: 'Story not found' }, { status: 404 });

    const idx = story.likes.findIndex((lid: any) => lid.toString() === user._id.toString());
    const liked = idx === -1;

    if (liked) {
      story.likes.push(user._id);
      // Send notification to story owner (if not self)
      if (story.userId.toString() !== user._id.toString()) {
        const authUserDoc = await User.findById(authUser._id);
        await Notification.create({
          recipient: story.userId,
          sender: authUser._id,
          type: 'like',
          message: `${authUserDoc?.username || 'Someone'} liked your story`,
          postId: story._id,
        });
      }
    } else {
      story.likes.splice(idx, 1);
    }
    await story.save();

    return NextResponse.json({ liked, likes: story.likes.length });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ REACT TO STORY ============
export async function reactToStory(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await UserProfile.findOne({ authId: authUser._id });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const { emoji } = await req.json();
    if (!emoji) return NextResponse.json({ message: 'Emoji is required' }, { status: 400 });

    const story = await Story.findById(id) as any;
    if (!story) return NextResponse.json({ message: 'Story not found' }, { status: 404 });

    // Remove existing reaction from same user, then add new
    story.reactions = story.reactions.filter(
      (r: any) => r.userId.toString() !== user._id.toString()
    );
    story.reactions.push({ userId: user._id, emoji, createdAt: new Date() });
    await story.save();

    // Notification
    if (story.userId.toString() !== user._id.toString()) {
      const authUserDoc = await User.findById(authUser._id);
      await Notification.create({
        recipient: story.userId,
        sender: authUser._id,
        type: 'like',
        message: `${authUserDoc?.username || 'Someone'} reacted ${emoji} to your story`,
        postId: story._id,
      });
    }

    return NextResponse.json({ message: 'Reaction added', reactions: story.reactions });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ REPLY TO STORY ============
export async function replyToStory(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await UserProfile.findOne({ authId: authUser._id });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const { text } = await req.json();
    if (!text?.trim()) return NextResponse.json({ message: 'Reply text is required' }, { status: 400 });

    const story = await Story.findById(id).populate('userId') as any;
    if (!story) return NextResponse.json({ message: 'Story not found' }, { status: 404 });

    // Create notification for story owner
    if (story.userId._id.toString() !== user._id.toString()) {
      const authUserDoc = await User.findById(authUser._id);
      await Notification.create({
        recipient: story.userId._id,
        sender: authUser._id,
        type: 'reply',
        message: `${authUserDoc?.username || 'Someone'} replied to your story: "${text.trim().substring(0, 100)}"`,
        postId: story._id,
      });
    }

    return NextResponse.json({ message: 'Reply sent' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ DELETE STORY ============
export async function deleteStory(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await UserProfile.findOne({ authId: authUser._id });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const story = await Story.findById(id) as any;
    if (!story) return NextResponse.json({ message: 'Story not found' }, { status: 404 });
    if (!story.userId.equals(user._id)) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

    // Archive instead of hard delete
    story.archived = true;
    story.expiresAt = new Date(0); // Expire immediately from public view
    await story.save();

    return NextResponse.json({ message: 'Story deleted successfully' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ GET ARCHIVED STORIES ============
export async function getArchivedStories(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await UserProfile.findOne({ authId: authUser._id });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const stories = await Story.find({
      userId: user._id,
      $or: [
        { archived: true },
        { expiresAt: { $lte: new Date() } },
      ],
    }).sort({ createdAt: -1 });

    return NextResponse.json({ stories });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
