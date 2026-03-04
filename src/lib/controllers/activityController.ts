import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';
import UserProfile from '@/lib/models/userModel';
import Reel from '@/lib/models/reelModel';
import '@/lib/models/authModel';
import { ensureProfile } from '@/lib/utils/ensureProfile';

// ============ SAVED POSTS ============

export async function savePost(req: NextRequest, postId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);
    const reel = await Reel.findById(postId);

    if (!reel) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    if (userProfile.savedPosts.includes(postId)) {
      return NextResponse.json({ message: 'Post already saved' }, { status: 400 });
    }

    userProfile.savedPosts.push(postId);

    // Log activity
    userProfile.activityLog.push({
      action: 'save',
      targetType: 'reel',
      targetId: postId,
      metadata: { caption: reel.caption?.substring(0, 50) },
    });

    await userProfile.save();

    return NextResponse.json({ message: 'Post saved successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Save Post Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function unsavePost(req: NextRequest, postId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);

    userProfile.savedPosts = userProfile.savedPosts.filter(
      (id: any) => id.toString() !== postId
    );

    // Log activity
    userProfile.activityLog.push({
      action: 'unsave',
      targetType: 'reel',
      targetId: postId,
    });

    await userProfile.save();

    return NextResponse.json({ message: 'Post unsaved successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Unsave Post Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getSavedPosts(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    await ensureProfile(user._id);
    const userProfile = await UserProfile.findOne({ authId: user._id })
      .populate({
        path: 'savedPosts',
        match: { isArchived: false },
        populate: {
          path: 'userId',
          populate: {
            path: 'authId',
            select: 'username name',
          },
          select: 'authId profilePicture',
        },
      });

    const savedPosts = (userProfile!.savedPosts || [])
      .filter((post: any) => post != null)
      .map((post: any) => ({
        _id: post._id,
        media: post.media,
        videoUrl: post.videoUrl,
        caption: post.caption,
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0,
        views: post.views || 0,
        created_at: post.created_at,
        user: {
          username: post.userId?.authId?.username,
          name: post.userId?.authId?.name,
          profilePicture: post.userId?.profilePicture,
        },
      }));

    return NextResponse.json({ savedPosts });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Saved Posts Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getSavedPostIds(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    let userProfile = await ensureProfile(user._id);

    const savedPostIds = (userProfile.savedPosts || []).map((id: any) => id.toString());
    return NextResponse.json({ savedPostIds });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Saved Post IDs Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function isPostSaved(req: NextRequest, postId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);

    const isSaved = userProfile.savedPosts.some((id: any) => id.toString() === postId);
    return NextResponse.json({ isSaved });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Check Saved Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ ARCHIVED POSTS ============

export async function archivePost(req: NextRequest, postId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);
    const reel = await Reel.findById(postId);

    if (!reel) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    if (!reel.userId.equals(userProfile._id)) {
      return NextResponse.json({ message: 'You can only archive your own posts' }, { status: 403 });
    }

    reel.isArchived = true;
    await reel.save();

    if (!userProfile.archivedPosts.includes(postId)) {
      userProfile.archivedPosts.push(postId);
    }

    userProfile.activityLog.push({
      action: 'archive',
      targetType: 'reel',
      targetId: postId,
      metadata: { caption: reel.caption?.substring(0, 50) },
    });

    await userProfile.save();

    return NextResponse.json({ message: 'Post archived successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Archive Post Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function unarchivePost(req: NextRequest, postId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);
    const reel = await Reel.findById(postId);

    if (!reel) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    if (!reel.userId.equals(userProfile._id)) {
      return NextResponse.json({ message: 'You can only unarchive your own posts' }, { status: 403 });
    }

    reel.isArchived = false;
    await reel.save();

    userProfile.archivedPosts = userProfile.archivedPosts.filter(
      (id: any) => !id.equals(postId)
    );

    userProfile.activityLog.push({
      action: 'unarchive',
      targetType: 'reel',
      targetId: postId,
      metadata: { caption: reel.caption?.substring(0, 50) },
    });

    await userProfile.save();

    return NextResponse.json({ message: 'Post unarchived successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Unarchive Post Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getArchivedPosts(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);

    const archivedPosts = await Reel.find({
      userId: userProfile._id,
      isArchived: true,
    }).sort({ created_at: -1 });

    const formattedPosts = archivedPosts.map((post) => ({
      _id: post._id,
      media: post.media,
      videoUrl: post.videoUrl,
      caption: post.caption,
      likes: post.likes.length,
      comments: post.comments.length,
      views: post.views,
      created_at: post.created_at,
      archivedAt: userProfile.activityLog.find(
        (log: any) => log.action === 'archive' && log.targetId.equals(post._id)
      )?.timestamp,
    }));

    return NextResponse.json({ archivedPosts: formattedPosts });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Archived Posts Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ ACTIVITY LOG ============

export async function getActivityLog(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const filter = searchParams.get('filter');

    const userProfile = await ensureProfile(user._id);

    let activities = userProfile.activityLog || [];

    if (filter && filter !== 'all') {
      activities = activities.filter((a: any) => a.action === filter);
    }

    activities = activities.sort(
      (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedActivities = activities.slice(startIndex, endIndex);

    const populatedActivities = await Promise.all(
      paginatedActivities.map(async (activity: any) => {
        let targetDetails = null;

        if (activity.targetType === 'reel') {
          const reel = await Reel.findById(activity.targetId).populate({
            path: 'userId',
            populate: {
              path: 'authId',
              select: 'username name',
            },
            select: 'authId profilePicture',
          });
          if (reel) {
            targetDetails = {
              type: 'reel',
              id: reel._id,
              caption: reel.caption,
              media: reel.media?.[0] || { url: reel.videoUrl, type: 'video' },
              owner: {
                username: reel.userId?.authId?.username,
                profilePicture: reel.userId?.profilePicture,
              },
            };
          }
        } else if (activity.targetType === 'user') {
          const targetUser = await UserProfile.findById(activity.targetId).populate(
            'authId',
            'username name'
          );
          if (targetUser) {
            targetDetails = {
              type: 'user',
              id: targetUser._id,
              username: targetUser.authId?.username,
              name: targetUser.authId?.name,
              profilePicture: targetUser.profilePicture,
            };
          }
        }

        return {
          _id: activity._id,
          action: activity.action,
          targetType: activity.targetType,
          targetDetails,
          metadata: activity.metadata,
          timestamp: activity.timestamp,
        };
      })
    );

    return NextResponse.json({
      activities: populatedActivities,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(activities.length / limit),
        totalItems: activities.length,
        hasMore: endIndex < activities.length,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Activity Log Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getInteractionsSummary(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    await ensureProfile(user._id);
    const userProfile = await UserProfile.findOne({ authId: user._id })
      .populate({
        path: 'likedReels',
        select: 'media videoUrl caption likes comments views created_at userId',
        populate: {
          path: 'userId',
          populate: { path: 'authId', select: 'username name' },
          select: 'authId profilePicture',
        },
      })
      .populate({
        path: 'commentedReels',
        select: 'media videoUrl caption likes comments views created_at userId',
        populate: {
          path: 'userId',
          populate: { path: 'authId', select: 'username name' },
          select: 'authId profilePicture',
        },
      });

    const myPosts = await Reel.find({ userId: userProfile!._id, isArchived: false }).sort({
      created_at: -1,
    });

    const stats = {
      postsCount: myPosts.length,
      likesGiven: userProfile.likedReels?.length || 0,
      commentsGiven: userProfile.commentedReels?.length || 0,
      savedCount: userProfile.savedPosts?.length || 0,
      archivedCount: userProfile.archivedPosts?.length || 0,
      followersCount: userProfile.followers?.length || 0,
      followingCount: userProfile.following?.length || 0,
    };

    const likedPosts = (userProfile.likedReels || []).slice(0, 20).map((post: any) => ({
      _id: post._id,
      media: post.media,
      videoUrl: post.videoUrl,
      caption: post.caption,
      likes: post.likes?.length || 0,
      comments: post.comments?.length || 0,
      created_at: post.created_at,
      user: {
        username: post.userId?.authId?.username,
        profilePicture: post.userId?.profilePicture,
      },
    }));

    const commentedPosts = (userProfile.commentedReels || []).slice(0, 20).map((post: any) => {
      const userComments =
        post.comments?.filter(
          (c: any) => c.userId?.toString() === userProfile._id.toString()
        ) || [];

      return {
        _id: post._id,
        media: post.media,
        videoUrl: post.videoUrl,
        caption: post.caption,
        created_at: post.created_at,
        user: {
          username: post.userId?.authId?.username,
          profilePicture: post.userId?.profilePicture,
        },
        myComments: userComments.map((c: any) => ({
          text: c.text,
          created_at: c.created_at,
        })),
      };
    });

    return NextResponse.json({ stats, likedPosts, commentedPosts });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Interactions Summary Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function clearActivityLog(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter');

    const userProfile = await ensureProfile(user._id);

    if (filter && filter !== 'all') {
      userProfile.activityLog = userProfile.activityLog.filter(
        (a: any) => a.action !== filter
      );
    } else {
      userProfile.activityLog = [];
    }

    await userProfile.save();

    return NextResponse.json({ message: 'Activity log cleared successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Clear Activity Log Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
