import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import GroupChat from '@/lib/models/groupChatModel';
import Message from '@/lib/models/messageModel';
import User from '@/lib/models/authModel';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';
import { getIO } from '@/lib/utils/socket';

export async function createGroup(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { name, description, memberIds } = await req.json();
    if (!name || name.trim().length === 0) return NextResponse.json({ message: 'Group name is required' }, { status: 400 });
    if (!memberIds || memberIds.length === 0) return NextResponse.json({ message: 'At least one member is required' }, { status: 400 });

    const members = [{ userId: authUser._id, role: 'admin', joinedAt: new Date() }, ...memberIds.map((id: string) => ({ userId: id, role: 'member', joinedAt: new Date() }))];
    const groupChat = new GroupChat({ name: name.trim(), description: description?.trim() || '', creator: authUser._id, admins: [authUser._id], members, isActive: true });
    await groupChat.save();
    await groupChat.populate('creator', 'username name');
    await groupChat.populate('members.userId', 'username name');

    const systemMessage = new Message({ sender: authUser._id, groupId: groupChat._id, content: `Group "${name}" was created`, messageType: 'system', status: 'delivered' });
    await systemMessage.save();
    (groupChat as any).lastMessage = { content: systemMessage.content, sender: authUser._id, timestamp: new Date(), messageType: 'system' };
    await groupChat.save();

    const io = getIO();
    memberIds.forEach((memberId: string) => io.to(memberId).emit('newGroup', { group: groupChat, message: systemMessage }));

    return NextResponse.json({ success: true, message: 'Group created successfully', group: groupChat }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to create group' }, { status: 500 });
  }
}

export async function getMyGroups(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const groups = await GroupChat.find({ 'members.userId': authUser._id, isActive: true })
      .populate('creator', 'username name').populate('members.userId', 'username name')
      .populate('lastMessage.sender', 'username name').sort({ updatedAt: -1 });

    const groupsWithUnread = await Promise.all((groups as any[]).map(async (group) => {
      const unreadCount = await Message.countDocuments({ groupId: group._id, sender: { $ne: authUser._id }, 'seenBy.userId': { $ne: authUser._id } });
      return { ...group.toObject(), unreadCount };
    }));

    return NextResponse.json({ success: true, groups: groupsWithUnread });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function getGroupDetails(req: NextRequest, groupId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const group = await GroupChat.findById(groupId).populate('creator', 'username name').populate('members.userId', 'username name').populate('admins', 'username name') as any;
    if (!group) return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    if (!group.isMember(authUser._id)) return NextResponse.json({ message: 'You are not a member of this group' }, { status: 403 });
    return NextResponse.json({ success: true, group });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to fetch group details' }, { status: 500 });
  }
}

export async function getGroupMessages(req: NextRequest, groupId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const group = await GroupChat.findById(groupId) as any;
    if (!group || !group.isMember(authUser._id)) return NextResponse.json({ message: 'Access denied' }, { status: 403 });

    const messages = await Message.find({ groupId, deletedFor: { $ne: authUser._id } })
      .populate('sender', 'username name').populate('replyTo')
      .sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit);

    await Message.updateMany({ groupId, sender: { $ne: authUser._id }, 'seenBy.userId': { $ne: authUser._id } }, { $addToSet: { seenBy: { userId: authUser._id, seenAt: new Date() } } });

    return NextResponse.json({ success: true, messages: (messages as any[]).reverse() });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function sendGroupMessage(req: NextRequest, groupId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { content, messageType = 'text', mediaUrl, replyTo } = await req.json();
    const group = await GroupChat.findById(groupId) as any;
    if (!group || !group.isMember(authUser._id)) return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    if (group.settings?.onlyAdminsCanMessage && !group.isAdmin(authUser._id)) return NextResponse.json({ message: 'Only admins can send messages' }, { status: 403 });

    const message = new Message({ sender: authUser._id, groupId, content: content || '', messageType, mediaUrl, replyTo, status: 'delivered', seenBy: [{ userId: authUser._id, seenAt: new Date() }] });
    await message.save();
    await message.populate('sender', 'username name');
    if (replyTo) await message.populate('replyTo');

    group.lastMessage = { content: content || (mediaUrl ? '📷 Media' : ''), sender: authUser._id, timestamp: new Date(), messageType };
    await group.save();

    const io = getIO();
    io.to(`group_${groupId}`).emit('groupMessage', { groupId, message });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
  }
}

export async function addMembers(req: NextRequest, groupId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { memberIds } = await req.json();
    const group = await GroupChat.findById(groupId) as any;
    if (!group) return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    if (group.settings?.onlyAdminsCanAddMembers && !group.isAdmin(authUser._id)) return NextResponse.json({ message: 'Only admins can add members' }, { status: 403 });
    if (!group.isMember(authUser._id)) return NextResponse.json({ message: 'You are not a member' }, { status: 403 });

    const newMembers: string[] = [];
    for (const memberId of memberIds) {
      if (!group.isMember(memberId)) { group.members.push({ userId: memberId, role: 'member', joinedAt: new Date() }); newMembers.push(memberId); }
    }
    if (newMembers.length === 0) return NextResponse.json({ message: 'All users are already members' }, { status: 400 });
    await group.save();

    const adder = await User.findById(authUser._id).select('username') as any;
    const usernames = await User.find({ _id: { $in: newMembers } }).select('username');
    const usernameList = (usernames as any[]).map(u => u.username).join(', ');
    const systemMessage = new Message({ sender: authUser._id, groupId, content: `${adder?.username} added ${usernameList} to the group`, messageType: 'system', status: 'delivered' });
    await systemMessage.save();
    group.lastMessage = { content: (systemMessage as any).content, sender: authUser._id, timestamp: new Date(), messageType: 'system' };
    await group.save();

    return NextResponse.json({ success: true, message: 'Members added successfully', addedCount: newMembers.length });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to add members' }, { status: 500 });
  }
}

export async function removeMember(req: NextRequest, groupId: string, memberId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const group = await GroupChat.findById(groupId) as any;
    if (!group) return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    if (memberId !== authUser._id && !group.isAdmin(authUser._id)) return NextResponse.json({ message: 'Only admins can remove members' }, { status: 403 });
    if (memberId === group.creator.toString()) return NextResponse.json({ message: 'Cannot remove the group creator' }, { status: 403 });

    group.members = group.members.filter((m: any) => m.userId.toString() !== memberId);
    group.admins = group.admins.filter((a: any) => a.toString() !== memberId);
    await group.save();

    return NextResponse.json({ success: true, message: 'Member removed successfully' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to remove member' }, { status: 500 });
  }
}

export async function leaveGroup(req: NextRequest, groupId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const group = await GroupChat.findById(groupId) as any;
    if (!group) return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    if (!group.isMember(authUser._id)) return NextResponse.json({ message: 'You are not a member' }, { status: 400 });

    if (group.creator.toString() === authUser._id) {
      const otherAdmins = group.admins.filter((a: any) => a.toString() !== authUser._id);
      if (otherAdmins.length > 0) group.creator = otherAdmins[0];
      else {
        const otherMembers = group.members.filter((m: any) => m.userId.toString() !== authUser._id);
        if (otherMembers.length > 0) { group.creator = otherMembers[0].userId; group.admins.push(otherMembers[0].userId); }
        else group.isActive = false;
      }
    }
    group.members = group.members.filter((m: any) => m.userId.toString() !== authUser._id);
    group.admins = group.admins.filter((a: any) => a.toString() !== authUser._id);
    await group.save();

    return NextResponse.json({ success: true, message: 'Left group successfully' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to leave group' }, { status: 500 });
  }
}

export async function updateGroup(req: NextRequest, groupId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { name, description, avatar } = await req.json();
    const group = await GroupChat.findById(groupId) as any;
    if (!group) return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    if (group.settings?.onlyAdminsCanEditInfo && !group.isAdmin(authUser._id)) return NextResponse.json({ message: 'Only admins can edit group info' }, { status: 403 });

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (avatar !== undefined) group.avatar = avatar;
    await group.save();

    return NextResponse.json({ success: true, message: 'Group updated successfully', group });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to update group' }, { status: 500 });
  }
}

export async function makeAdmin(req: NextRequest, groupId: string, memberId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const group = await GroupChat.findById(groupId) as any;
    if (!group) return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    if (!group.isAdmin(authUser._id)) return NextResponse.json({ message: 'Only admins can promote members' }, { status: 403 });
    if (!group.isMember(memberId)) return NextResponse.json({ message: 'User is not a member' }, { status: 400 });
    if (group.admins.some((a: any) => a.toString() === memberId)) return NextResponse.json({ message: 'User is already an admin' }, { status: 400 });

    group.admins.push(memberId);
    const memberIndex = group.members.findIndex((m: any) => m.userId.toString() === memberId);
    if (memberIndex !== -1) group.members[memberIndex].role = 'admin';
    await group.save();

    return NextResponse.json({ success: true, message: 'Member promoted to admin' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ message: 'Failed to promote member' }, { status: 500 });
  }
}
