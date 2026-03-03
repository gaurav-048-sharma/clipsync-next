import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Notification from '@/lib/models/notificationModel';
import '@/lib/models/authModel';
import '@/lib/models/reelModel';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';

export async function getNotifications(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const notifications = await Notification.find({ recipient: authUser._id })
      .populate('sender', 'username name')
      .populate('postId', 'media caption')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments({ recipient: authUser._id });
    const unreadCount = await Notification.countDocuments({ recipient: authUser._id, read: false });

    return NextResponse.json({ notifications, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, unreadCount });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    console.error('getNotifications error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function markAsRead(req: NextRequest, id: string) {
  try {
    await dbConnect();
    await verifyAuth(req);
    const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    if (!notification) return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
    return NextResponse.json({ message: 'Notification marked as read', notification });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function markAllAsRead(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    await Notification.updateMany({ recipient: authUser._id, read: false }, { read: true });
    return NextResponse.json({ message: 'All notifications marked as read' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getUnreadCount(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const unreadCount = await Notification.countDocuments({ recipient: authUser._id, read: false });
    return NextResponse.json({ success: true, unreadCount });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to get unread count' }, { status: 500 });
  }
}

export async function deleteNotification(req: NextRequest, id: string) {
  try {
    await dbConnect();
    await verifyAuth(req);
    await Notification.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Notification deleted' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
