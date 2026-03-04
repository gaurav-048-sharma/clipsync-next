import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Reel from '@/lib/models/reelModel';
import UserProfile from '@/lib/models/userModel';
import User from '@/lib/models/authModel';
import Notification from '@/lib/models/notificationModel';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';
import { parseFormData, uploadFilesToS3 } from '@/lib/utils/upload';
import { ensureProfile } from '@/lib/utils/ensureProfile';
import { getIO } from '@/lib/utils/socket';

export async function createReel(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { files, fields } = await parseFormData(req);
    await uploadFilesToS3(files);

    if (!files.video && !files.media) return NextResponse.json({ message: 'Media file is required' }, { status: 400 });

    const user = await ensureProfile(authUser._id);

    const postData: any = { userId: user._id, caption: fields.caption, views: 0 };
    if (files.video?.[0]) {
      postData.videoUrl = files.video[0].location;
      postData.media = [{ url: files.video[0].location, type: 'video' }];
    } else if (files.media) {
      postData.media = files.media.map(f => ({ url: f.location, type: f.mediaType }));
    }

    const reel = new Reel(postData);
    await reel.save();
    return NextResponse.json({ message: 'Post created successfully', reel }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getReel(id: string) {
  try {
    await dbConnect();
    const reel = await Reel.findById(id)
      .populate({ path: 'userId', select: 'authId profilePicture', populate: { path: 'authId', select: 'username name' } })
      .populate({ path: 'likes', select: 'authId', populate: { path: 'authId', select: 'username name' } })
      .populate({ path: 'comments.userId', select: 'authId profilePicture', populate: { path: 'authId', select: 'username name' } })
      .populate({ path: 'comments.replies.userId', select: 'authId profilePicture', populate: { path: 'authId', select: 'username name' } });
    if (!reel) return NextResponse.json({ message: 'Reel not found' }, { status: 404 });

    (reel as any).views += 1;
    await reel.save();
    return NextResponse.json(reel);
  } catch { return NextResponse.json({ message: 'Server error' }, { status: 500 }); }
}

export async function getAllPosts(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const posts = await Reel.find({ userId: { $ne: null } })
      .populate({ path: 'userId', select: 'profilePicture authId', populate: { path: 'authId', select: 'username name' } })
      .populate({ path: 'likes', select: '_id' })
      .populate({ path: 'comments.userId', select: 'authId profilePicture', populate: { path: 'authId', select: 'username name' } })
      .populate({ path: 'comments.replies.userId', select: 'authId profilePicture', populate: { path: 'authId', select: 'username name' } })
      .sort({ created_at: -1 }).skip(skip).limit(limit);

    const total = await Reel.countDocuments({ userId: { $ne: null } });
    return NextResponse.json({ posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch { return NextResponse.json({ message: 'Server error' }, { status: 500 }); }
}

export async function getUserReels(username: string) {
  try {
    await dbConnect();
    const auth = await User.findOne({ username });
    if (!auth) return NextResponse.json([]);
    const user = await UserProfile.findOne({ authId: auth._id });
    if (!user) return NextResponse.json([]);

    const reels = await Reel.find({ userId: user._id })
      .populate({ path: 'userId', select: 'profilePicture authId', populate: { path: 'authId', select: 'username name' } })
      .populate({ path: 'likes', select: '_id' })
      .populate({ path: 'comments.userId', select: 'authId', populate: { path: 'authId', select: 'username name' } })
      .sort({ created_at: -1 });
    return NextResponse.json(reels);
  } catch { return NextResponse.json({ message: 'Server error' }, { status: 500 }); }
}

export async function updateReel(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { caption } = await req.json();
    const reel = await Reel.findById(id) as any;
    if (!reel) return NextResponse.json({ message: 'Reel not found' }, { status: 404 });
    const user = await ensureProfile(authUser._id);
    if (!user || !reel.userId.equals(user._id)) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    if (caption !== undefined) reel.caption = caption;
    reel.updated_at = new Date();
    await reel.save();
    return NextResponse.json({ message: 'Reel updated successfully', reel });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function deleteReel(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const reel = await Reel.findById(id) as any;
    if (!reel) return NextResponse.json({ message: 'Reel not found' }, { status: 404 });
    const user = await ensureProfile(authUser._id);
    if (!user || !reel.userId.equals(user._id)) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    await reel.deleteOne();
    return NextResponse.json({ message: 'Reel deleted successfully' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function likeReel(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await ensureProfile(authUser._id) as any;
    const reel = await Reel.findById(id) as any;
    if (!user || !reel) return NextResponse.json({ message: 'User or reel not found' }, { status: 404 });

    const likeIndex = reel.likes.findIndex((id: any) => id.toString() === user._id.toString());
    const isLiking = likeIndex === -1;

    if (isLiking) {
      reel.likes.push(user._id);
      if (!user.likedReels.some((id: any) => id.toString() === reel._id.toString())) user.likedReels.push(reel._id);
      try {
        const postOwner = await UserProfile.findById(reel.userId).populate('authId') as any;
        if (postOwner && postOwner.authId._id.toString() !== authUser._id) {
          const currentAuth = await User.findById(authUser._id) as any;
          const notification = new Notification({ recipient: postOwner.authId._id, sender: authUser._id, type: 'like', message: `${currentAuth.username} liked your post`, postId: reel._id });
          await notification.save();
          const io = getIO();
          (io as any).to(postOwner.authId._id.toString()).emit('newNotification', notification);
        }
      } catch {}
    } else {
      reel.likes.splice(likeIndex, 1);
      const userLikeIndex = user.likedReels.findIndex((id: any) => id.toString() === reel._id.toString());
      if (userLikeIndex !== -1) user.likedReels.splice(userLikeIndex, 1);
    }
    await reel.save();
    await user.save();
    return NextResponse.json({ message: isLiking ? 'Post liked successfully' : 'Post unliked successfully', likesCount: reel.likes.length, isLiked: isLiking });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function commentOnReel(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { text } = await req.json();
    const user = await ensureProfile(authUser._id) as any;
    const reel = await Reel.findById(id) as any;
    if (!user || !reel) return NextResponse.json({ message: 'User or reel not found' }, { status: 404 });
    if (!text || text.length > 1000) return NextResponse.json({ message: 'Comment text is required and must be under 1000 characters' }, { status: 400 });

    reel.comments.push({ userId: user._id, text });
    const newComment = reel.comments[reel.comments.length - 1];
    if (!user.commentedReels.some((id: any) => id.toString() === reel._id.toString())) user.commentedReels.push(reel._id);
    await reel.save();
    await user.save();

    try {
      const postOwner = await UserProfile.findById(reel.userId).populate('authId') as any;
      if (postOwner && postOwner.authId._id.toString() !== authUser._id) {
        const currentAuth = await User.findById(authUser._id) as any;
        const notification = new Notification({ recipient: postOwner.authId._id, sender: authUser._id, type: 'comment', message: `${currentAuth.username} commented on your post`, postId: reel._id, commentId: newComment._id });
        await notification.save();
        const io = getIO();
        (io as any).to(postOwner.authId._id.toString()).emit('newNotification', notification);
      }
    } catch {}

    await reel.populate({ path: 'comments.userId', populate: { path: 'authId', select: 'username name' } });
    return NextResponse.json({ message: 'Comment added successfully', reel, comment: newComment });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function replyToComment(req: NextRequest, reelId: string, commentId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { text } = await req.json();
    const user = await ensureProfile(authUser._id) as any;
    const reel = await Reel.findById(reelId) as any;
    if (!user || !reel) return NextResponse.json({ message: 'User or reel not found' }, { status: 404 });
    const comment = reel.comments.id(commentId);
    if (!comment) return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
    if (!text || text.length > 1000) return NextResponse.json({ message: 'Reply text required, max 1000 chars' }, { status: 400 });

    comment.replies.push({ userId: user._id, text, likes: [], created_at: new Date(), updated_at: new Date() });
    await reel.save();
    const newReply = comment.replies[comment.replies.length - 1];

    try {
      const commentOwner = await UserProfile.findById(comment.userId).populate('authId') as any;
      if (commentOwner && commentOwner.authId._id.toString() !== authUser._id) {
        const currentAuth = await User.findById(authUser._id) as any;
        const notification = new Notification({ recipient: commentOwner.authId._id, sender: authUser._id, type: 'reply', message: `${currentAuth.username} replied to your comment`, postId: reel._id });
        await notification.save();
        const io = getIO();
        (io as any).to(commentOwner.authId._id.toString()).emit('newNotification', notification);
      }
    } catch {}

    return NextResponse.json({ message: 'Reply added successfully', reply: newReply }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function incrementReelView(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const reel = await Reel.findById(id) as any;
    if (!reel) return NextResponse.json({ message: 'Reel not found' }, { status: 404 });

    try {
      const authUser = await verifyAuth(req);
      const user = await ensureProfile(authUser._id);
      if (user) {
        const alreadyViewed = reel.viewedBy?.some((v: any) => v.userId.toString() === user._id.toString());
        if (!alreadyViewed) {
          if (!reel.viewedBy) reel.viewedBy = [];
          reel.viewedBy.push({ userId: user._id, viewedAt: new Date() });
          reel.views = reel.viewedBy.length;
          await reel.save();
        }
        return NextResponse.json({ message: 'View recorded', views: reel.views });
      }
    } catch {
      // Unauthenticated — simple increment
      reel.views += 1;
      await reel.save();
    }
    return NextResponse.json({ message: 'View recorded', views: reel.views });
  } catch { return NextResponse.json({ message: 'Server error' }, { status: 500 }); }
}

export async function saveReel(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await ensureProfile(authUser._id) as any;
    const reel = await Reel.findById(id);
    if (!user || !reel) return NextResponse.json({ message: 'User or reel not found' }, { status: 404 });

    const savedIndex = user.savedPosts.findIndex((sid: any) => sid.toString() === reel._id.toString());
    const isSaving = savedIndex === -1;

    if (isSaving) {
      user.savedPosts.push(reel._id);
    } else {
      user.savedPosts.splice(savedIndex, 1);
    }
    await user.save();
    return NextResponse.json({ message: isSaving ? 'Post saved' : 'Post unsaved', isSaved: isSaving });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// POST /api/reels/[id]/comment/[commentId]/like — toggle like on a comment
export async function likeComment(req: NextRequest, reelId: string, commentId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await ensureProfile(authUser._id) as any;
    const reel = await Reel.findById(reelId) as any;
    if (!user || !reel) return NextResponse.json({ message: 'User or reel not found' }, { status: 404 });

    const comment = reel.comments.id(commentId);
    if (!comment) return NextResponse.json({ message: 'Comment not found' }, { status: 404 });

    const likeIndex = comment.likes.findIndex((id: any) => id.toString() === user._id.toString());
    if (likeIndex === -1) {
      comment.likes.push(user._id);
    } else {
      comment.likes.splice(likeIndex, 1);
    }
    await reel.save();
    return NextResponse.json({ message: likeIndex === -1 ? 'Comment liked' : 'Comment unliked', likesCount: comment.likes.length, isLiked: likeIndex === -1 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/reels/[id]/comment/[commentId] — delete a comment
export async function deleteComment(req: NextRequest, reelId: string, commentId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await ensureProfile(authUser._id) as any;
    const reel = await Reel.findById(reelId) as any;
    if (!user || !reel) return NextResponse.json({ message: 'User or reel not found' }, { status: 404 });

    const comment = reel.comments.id(commentId);
    if (!comment) return NextResponse.json({ message: 'Comment not found' }, { status: 404 });

    // Only comment owner or post owner can delete
    const isCommentOwner = comment.userId.toString() === user._id.toString();
    const isPostOwner = reel.userId.toString() === user._id.toString();
    if (!isCommentOwner && !isPostOwner) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

    reel.comments.pull({ _id: commentId });
    await reel.save();
    return NextResponse.json({ message: 'Comment deleted', commentsCount: reel.comments.length });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// PUT /api/reels/[id]/comment/[commentId] — edit a comment
export async function editComment(req: NextRequest, reelId: string, commentId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { text } = await req.json();
    const user = await ensureProfile(authUser._id) as any;
    const reel = await Reel.findById(reelId) as any;
    if (!user || !reel) return NextResponse.json({ message: 'User or reel not found' }, { status: 404 });

    const comment = reel.comments.id(commentId);
    if (!comment) return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
    if (comment.userId.toString() !== user._id.toString()) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    if (!text || text.length > 1000) return NextResponse.json({ message: 'Text required, max 1000 chars' }, { status: 400 });

    comment.text = text;
    comment.updated_at = new Date();
    await reel.save();
    return NextResponse.json({ message: 'Comment updated', comment });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// POST /api/reels/[id]/comment/[commentId]/reply/[replyId]/like — toggle like on a reply
export async function likeReply(req: NextRequest, reelId: string, commentId: string, replyId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await ensureProfile(authUser._id) as any;
    const reel = await Reel.findById(reelId) as any;
    if (!user || !reel) return NextResponse.json({ message: 'User or reel not found' }, { status: 404 });

    const comment = reel.comments.id(commentId);
    if (!comment) return NextResponse.json({ message: 'Comment not found' }, { status: 404 });

    const reply = comment.replies.id(replyId);
    if (!reply) return NextResponse.json({ message: 'Reply not found' }, { status: 404 });

    const likeIndex = reply.likes.findIndex((id: any) => id.toString() === user._id.toString());
    if (likeIndex === -1) {
      reply.likes.push(user._id);
    } else {
      reply.likes.splice(likeIndex, 1);
    }
    await reel.save();
    return NextResponse.json({ message: likeIndex === -1 ? 'Reply liked' : 'Reply unliked', likesCount: reply.likes.length, isLiked: likeIndex === -1 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/reels/[id]/comment/[commentId]/reply/[replyId] — delete a reply
export async function deleteReply(req: NextRequest, reelId: string, commentId: string, replyId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const user = await ensureProfile(authUser._id) as any;
    const reel = await Reel.findById(reelId) as any;
    if (!user || !reel) return NextResponse.json({ message: 'User or reel not found' }, { status: 404 });

    const comment = reel.comments.id(commentId);
    if (!comment) return NextResponse.json({ message: 'Comment not found' }, { status: 404 });

    const reply = comment.replies.id(replyId);
    if (!reply) return NextResponse.json({ message: 'Reply not found' }, { status: 404 });

    const isReplyOwner = reply.userId.toString() === user._id.toString();
    const isPostOwner = reel.userId.toString() === user._id.toString();
    if (!isReplyOwner && !isPostOwner) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

    comment.replies.pull({ _id: replyId });
    await reel.save();
    return NextResponse.json({ message: 'Reply deleted' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// PUT /api/reels/[id]/comment/[commentId]/reply/[replyId] — edit a reply
export async function editReply(req: NextRequest, reelId: string, commentId: string, replyId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { text } = await req.json();
    const user = await ensureProfile(authUser._id) as any;
    const reel = await Reel.findById(reelId) as any;
    if (!user || !reel) return NextResponse.json({ message: 'User or reel not found' }, { status: 404 });

    const comment = reel.comments.id(commentId);
    if (!comment) return NextResponse.json({ message: 'Comment not found' }, { status: 404 });

    const reply = comment.replies.id(replyId);
    if (!reply) return NextResponse.json({ message: 'Reply not found' }, { status: 404 });
    if (reply.userId.toString() !== user._id.toString()) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    if (!text || text.length > 1000) return NextResponse.json({ message: 'Text required, max 1000 chars' }, { status: 400 });

    reply.text = text;
    reply.updated_at = new Date();
    await reel.save();
    return NextResponse.json({ message: 'Reply updated', reply });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
