import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Message from '@/lib/models/messageModel';
import User from '@/lib/models/authModel';
import UserProfile from '@/lib/models/userModel';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';
import mongoose from 'mongoose';

export async function sendMessage(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { recipientId, content, messageType = 'text', mediaUrl } = await req.json();
    if (!recipientId || (!content && !mediaUrl)) return NextResponse.json({ message: 'Recipient ID and content/media are required' }, { status: 400 });

    const message = new Message({ sender: authUser._id, recipient: recipientId, content: content || '', messageType, mediaUrl, status: 'sent' });
    await message.save();
    await message.populate('sender', 'username name');
    await message.populate('recipient', 'username name');
    return NextResponse.json({ message: 'Message sent successfully', data: message }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
  }
}

export async function getConversation(req: NextRequest, recipientId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const messages = await Message.find({
      $or: [
        { sender: authUser._id, recipient: recipientId },
        { sender: recipientId, recipient: authUser._id },
      ],
      deletedFor: { $ne: authUser._id },
    })
      .populate('sender', 'username name')
      .populate('recipient', 'username name')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({ messages: messages.reverse() });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to fetch conversation' }, { status: 500 });
  }
}

export async function getConversations(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const userId = new (mongoose.Types.ObjectId as any)(String(authUser._id));

    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { recipient: userId }], deletedFor: { $ne: userId } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: { $cond: [{ $eq: ['$sender', userId] }, '$recipient', '$sender'] },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ['$recipient', userId] }, { $ne: ['$status', 'seen'] }] }, 1, 0] } },
        },
      },
      { $sort: { 'lastMessage.timestamp': -1 } },
    ]);

    const validConversations = conversations.filter(c => c._id != null);
    const userIds = validConversations.map(c => c._id);
    const users = await User.find({ _id: { $in: userIds } }).select('username name').lean();
    const profiles = await UserProfile.find({ authId: { $in: userIds } }).select('authId profilePicture').lean();

    const userMap: Record<string, any> = {};
    (users as any[]).forEach(u => { userMap[u._id.toString()] = u; });
    const profileMap: Record<string, any> = {};
    (profiles as any[]).forEach(p => { profileMap[p.authId.toString()] = p; });

    const result = validConversations.map(conv => ({
      user: {
        _id: conv._id,
        username: userMap[conv._id.toString()]?.username || 'Unknown',
        name: userMap[conv._id.toString()]?.name || 'Unknown',
        profilePicture: profileMap[conv._id.toString()]?.profilePicture || 'default-profile-pic.jpg',
      },
      lastMessage: { content: conv.lastMessage.content, timestamp: conv.lastMessage.timestamp, status: conv.lastMessage.status, messageType: conv.lastMessage.messageType },
      unreadCount: conv.unreadCount,
    }));

    return NextResponse.json({ conversations: result });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function getUnreadCount(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const unreadCount = await Message.countDocuments({ recipient: authUser._id, status: { $ne: 'seen' } });
    return NextResponse.json({ unreadCount });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to get unread count' }, { status: 500 });
  }
}

export async function markAsRead(req: NextRequest, recipientId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    await Message.updateMany(
      { sender: recipientId, recipient: authUser._id, status: { $ne: 'seen' } },
      { $set: { status: 'seen', seenAt: new Date() } }
    );
    return NextResponse.json({ message: 'Messages marked as read' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function updateMessage(req: NextRequest, messageId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { content } = await req.json();
    if (!content) return NextResponse.json({ message: 'Content is required' }, { status: 400 });

    const message = await Message.findById(messageId) as any;
    if (!message) return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    if (message.sender.toString() !== authUser._id) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

    message.content = content;
    message.isEdited = true;
    await message.save();
    await message.populate('sender', 'username name');
    await message.populate('recipient', 'username name');
    return NextResponse.json({ message: 'Message updated', data: message });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to update message' }, { status: 500 });
  }
}

export async function deleteMessage(req: NextRequest, messageId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const message = await Message.findById(messageId) as any;
    if (!message) return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    if (message.sender.toString() !== authUser._id) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    if (!message.deletedFor) message.deletedFor = [];
    message.deletedFor.push(authUser._id);
    await message.save();
    return NextResponse.json({ message: 'Message deleted' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
