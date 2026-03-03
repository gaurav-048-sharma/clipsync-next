import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Confession from '@/lib/models/confessionModel';
import User from '@/lib/models/authModel';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';

function getUserReaction(reactions: any, userId: string): string | null {
  const uid = userId.toString();
  for (const [type, users] of Object.entries(reactions || {})) {
    if ((users as any[])?.some((u: any) => u.toString() === uid)) return type;
  }
  return null;
}

function getTotalReactions(reactions: any): number {
  return Object.values(reactions || {}).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0);
}

export async function createConfession(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { content, targetColleges, tags } = await req.json();

    if (!content || content.trim().length === 0) return NextResponse.json({ message: 'Confession content is required' }, { status: 400 });
    if (content.length > 1000) return NextResponse.json({ message: 'Confession must be under 1000 characters' }, { status: 400 });

    const user = await User.findById(authUser._id);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const confession = new Confession({
      content: content.trim(), author: authUser._id,
      college: (user as any).college || {}, targetColleges: targetColleges || ['ALL'], tags: tags || ['other'],
    });
    await confession.save();

    return NextResponse.json({
      message: 'Confession posted successfully',
      confession: { _id: confession._id, content: (confession as any).content, college: (confession as any).college, tags: (confession as any).tags, reactions: (confession as any).reactions, comments: [], createdAt: (confession as any).createdAt },
    }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to post confession' }, { status: 500 });
  }
}

export async function getConfessions(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const college = searchParams.get('college');
    const tag = searchParams.get('tag');
    const sort = searchParams.get('sort') || 'recent';

    const user = await User.findById(authUser._id);
    const userCollegeCode = (user as any)?.college?.code;

    const query: any = { status: 'approved', isVisible: true };
    if (userCollegeCode) query.$or = [{ targetColleges: 'ALL' }, { targetColleges: userCollegeCode }];
    if (college && college !== 'all') query['college.code'] = college;
    if (tag && tag !== 'all') query.tags = tag;

    let sortOption: any = {};
    switch (sort) {
      case 'trending': sortOption = { trendingScore: -1 }; break;
      case 'top': sortOption = { 'reactions.heart': -1 }; break;
      default: sortOption = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;
    const confessions = await Confession.find(query).sort(sortOption).skip(skip).limit(limit).lean();
    const total = await Confession.countDocuments(query);

    const confessionsWithUserData = (confessions as any[]).map(c => ({
      ...c,
      userReaction: getUserReaction(c.reactions, authUser._id),
      totalReactions: getTotalReactions(c.reactions),
      commentCount: c.comments?.length || 0,
    }));

    return NextResponse.json({ confessions: confessionsWithUserData, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to fetch confessions' }, { status: 500 });
  }
}

export async function getConfession(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const confession = await Confession.findById(id).populate('comments.author', 'username college').lean() as any;
    if (!confession) return NextResponse.json({ message: 'Confession not found' }, { status: 404 });

    const processedComments = confession.comments?.map((comment: any) => ({
      ...comment, author: comment.isAnonymous ? null : comment.author,
      displayName: comment.isAnonymous ? 'Anonymous' : (comment.author?.username || 'User'),
    }));

    return NextResponse.json({ ...confession, comments: processedComments, userReaction: getUserReaction(confession.reactions, authUser._id), totalReactions: getTotalReactions(confession.reactions) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to fetch confession' }, { status: 500 });
  }
}

export async function reactToConfession(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { reaction } = await req.json();
    const validReactions = ['heart', 'laugh', 'sad', 'fire', 'shock'];
    if (!validReactions.includes(reaction)) return NextResponse.json({ message: 'Invalid reaction type' }, { status: 400 });

    const confession = await Confession.findById(id) as any;
    if (!confession) return NextResponse.json({ message: 'Confession not found' }, { status: 404 });

    validReactions.forEach(r => { confession.reactions[r] = confession.reactions[r].filter((uid: any) => uid.toString() !== authUser._id); });
    const existingReaction = getUserReaction(confession.reactions, authUser._id);
    if (existingReaction !== reaction) confession.reactions[reaction].push(authUser._id);
    await confession.save();

    return NextResponse.json({ message: 'Reaction updated', reactions: confession.reactions, userReaction: getUserReaction(confession.reactions, authUser._id), totalReactions: getTotalReactions(confession.reactions) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to react' }, { status: 500 });
  }
}

export async function addComment(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { content, isAnonymous = true } = await req.json();
    if (!content || content.trim().length === 0) return NextResponse.json({ message: 'Comment content is required' }, { status: 400 });

    const confession = await Confession.findById(id) as any;
    if (!confession) return NextResponse.json({ message: 'Confession not found' }, { status: 404 });

    const user = await User.findById(authUser._id);
    const comment = { content: content.trim(), author: authUser._id, isAnonymous, displayName: isAnonymous ? 'Anonymous' : ((user as any)?.username || 'User'), createdAt: new Date(), likes: [] };
    confession.comments.push(comment);
    await confession.save();

    const newComment = confession.comments[confession.comments.length - 1];
    return NextResponse.json({ message: 'Comment added', comment: { ...newComment.toObject(), author: isAnonymous ? null : { username: (user as any)?.username } } }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to add comment' }, { status: 500 });
  }
}

export async function reportConfession(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const confession = await Confession.findById(id) as any;
    if (!confession) return NextResponse.json({ message: 'Confession not found' }, { status: 404 });
    if (confession.reportedBy.includes(authUser._id)) return NextResponse.json({ message: 'Already reported' }, { status: 400 });

    confession.reportedBy.push(authUser._id);
    confession.reportCount += 1;
    if (confession.reportCount >= 5) { confession.status = 'reported'; confession.isVisible = false; }
    await confession.save();

    return NextResponse.json({ message: 'Confession reported' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to report' }, { status: 500 });
  }
}

export async function deleteConfession(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const confession = await Confession.findById(id) as any;
    if (!confession) return NextResponse.json({ message: 'Confession not found' }, { status: 404 });
    if (confession.author.toString() !== authUser._id) return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
    await confession.deleteOne();
    return NextResponse.json({ message: 'Confession deleted' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to delete' }, { status: 500 });
  }
}
