import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';
import StudyRoom from '@/lib/models/studyRoomModel';
import UserProfile from '@/lib/models/userModel';
import { ensureProfile } from '@/lib/utils/ensureProfile';
import mongoose from 'mongoose';

// ==================== ROOM CRUD ====================

export async function getAllRooms(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const subject = searchParams.get('subject');
    const tags = searchParams.get('tags');

    const filter: Record<string, any> = { status: 'active' };

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (tags) filter.tags = { $in: tags.split(',').map((t: string) => t.trim()) };

    const rooms = await StudyRoom.find(filter)
      .populate({
        path: 'host',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      })
      .select('-chatMessages')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await StudyRoom.countDocuments(filter);

    const roomsWithCount = rooms.map((room) => ({
      ...room.toObject(),
      participantCount: room.participants.filter((p: any) => p.status === 'active').length,
    }));

    return NextResponse.json({
      rooms: roomsWithCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get All Rooms Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getRoom(req: NextRequest, roomId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const room = await StudyRoom.findById(roomId)
      .populate({
        path: 'host',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      })
      .populate({
        path: 'participants.userId',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      })
      .populate({
        path: 'chatMessages.userId',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      });

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Room Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function createRoom(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);

    const room = new StudyRoom({
      ...body,
      host: userProfile._id,
      participants: [
        {
          userId: userProfile._id,
          role: 'host',
          status: 'active',
          joinedAt: new Date(),
        },
      ],
      pomodoro: {
        workDuration: body.pomodoroWork || 25,
        breakDuration: body.pomodoroBreak || 5,
        longBreakDuration: body.pomodoroLongBreak || 15,
        cyclesBeforeLongBreak: body.pomodoroCycles || 4,
        state: 'idle',
        currentCycle: 0,
      },
    });

    await room.save();

    const populated = await StudyRoom.findById(room._id)
      .populate({
        path: 'host',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      });

    return NextResponse.json(
      { message: 'Study room created successfully', room: populated },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Create Room Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function updateRoom(req: NextRequest, roomId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);
    const room = await StudyRoom.findById(roomId);

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    if (room.host.toString() !== userProfile?._id.toString()) {
      return NextResponse.json({ message: 'Only the host can update the room' }, { status: 403 });
    }

    const updatedRoom = await StudyRoom.findByIdAndUpdate(roomId, body, { new: true })
      .populate({
        path: 'host',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      });

    return NextResponse.json({ message: 'Room updated successfully', room: updatedRoom });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Update Room Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function deleteRoom(req: NextRequest, roomId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);
    const room = await StudyRoom.findById(roomId);

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    if (room.host.toString() !== userProfile?._id.toString()) {
      return NextResponse.json({ message: 'Only the host can delete the room' }, { status: 403 });
    }

    room.status = 'closed';
    await room.save();

    return NextResponse.json({ message: 'Room closed successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Delete Room Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ==================== PARTICIPANT MANAGEMENT ====================

export async function joinRoom(req: NextRequest, roomId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);
    const room = await StudyRoom.findById(roomId);

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    if (room.status !== 'active') {
      return NextResponse.json({ message: 'Room is not active' }, { status: 400 });
    }

    // Check if already a participant
    const existingParticipant = room.participants.find(
      (p: any) => p.userId.toString() === userProfile?._id.toString()
    );

    if (existingParticipant) {
      if (existingParticipant.status === 'active') {
        return NextResponse.json({ message: 'Already in this room' }, { status: 400 });
      }
      // Rejoin
      existingParticipant.status = 'active';
      existingParticipant.joinedAt = new Date();
      await room.save();
      return NextResponse.json({ message: 'Rejoined room successfully' });
    }

    // Check capacity
    const activeCount = room.participants.filter((p: any) => p.status === 'active').length;
    if (activeCount >= room.maxParticipants) {
      return NextResponse.json({ message: 'Room is full' }, { status: 400 });
    }

    room.participants.push({
      userId: userProfile?._id,
      role: 'participant',
      status: 'active',
      joinedAt: new Date(),
    });

    await room.save();

    return NextResponse.json({ message: 'Joined room successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Join Room Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function leaveRoom(req: NextRequest, roomId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);
    const room = await StudyRoom.findById(roomId);

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    const participant = room.participants.find(
      (p: any) => p.userId.toString() === userProfile?._id.toString() && p.status === 'active'
    );

    if (!participant) {
      return NextResponse.json({ message: 'Not in this room' }, { status: 400 });
    }

    participant.status = 'left';
    participant.leftAt = new Date();

    // Calculate study time in minutes
    if (participant.joinedAt) {
      const studyTime = Math.round(
        (new Date().getTime() - new Date(participant.joinedAt).getTime()) / 60000
      );
      participant.studyTime = (participant.studyTime || 0) + studyTime;
    }

    await room.save();

    return NextResponse.json({ message: 'Left room successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Leave Room Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function kickParticipant(req: NextRequest, roomId: string, participantId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);
    const room = await StudyRoom.findById(roomId);

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    if (room.host.toString() !== userProfile?._id.toString()) {
      return NextResponse.json({ message: 'Only the host can kick participants' }, { status: 403 });
    }

    const participant = room.participants.find(
      (p: any) => p.userId.toString() === participantId && p.status === 'active'
    );

    if (!participant) {
      return NextResponse.json({ message: 'Participant not found in room' }, { status: 404 });
    }

    participant.status = 'kicked';
    participant.leftAt = new Date();

    await room.save();

    return NextResponse.json({ message: 'Participant kicked successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Kick Participant Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ==================== POMODORO ====================

export async function startPomodoro(req: NextRequest, roomId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);
    const room = await StudyRoom.findById(roomId);

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    if (room.host.toString() !== userProfile?._id.toString()) {
      return NextResponse.json({ message: 'Only the host can control the timer' }, { status: 403 });
    }

    room.pomodoro.state = 'work';
    room.pomodoro.startedAt = new Date();
    room.pomodoro.isPaused = false;
    await room.save();

    return NextResponse.json({ message: 'Pomodoro started', pomodoro: room.pomodoro });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Start Pomodoro Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function pausePomodoro(req: NextRequest, roomId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);
    const room = await StudyRoom.findById(roomId);

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    if (room.host.toString() !== userProfile?._id.toString()) {
      return NextResponse.json({ message: 'Only the host can control the timer' }, { status: 403 });
    }

    room.pomodoro.isPaused = !room.pomodoro.isPaused;
    room.pomodoro.pausedAt = room.pomodoro.isPaused ? new Date() : undefined;
    await room.save();

    return NextResponse.json({
      message: room.pomodoro.isPaused ? 'Pomodoro paused' : 'Pomodoro resumed',
      pomodoro: room.pomodoro,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Pause Pomodoro Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function resetPomodoro(req: NextRequest, roomId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);
    const room = await StudyRoom.findById(roomId);

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    if (room.host.toString() !== userProfile?._id.toString()) {
      return NextResponse.json({ message: 'Only the host can control the timer' }, { status: 403 });
    }

    room.pomodoro.state = 'idle';
    room.pomodoro.currentCycle = 0;
    room.pomodoro.isPaused = false;
    room.pomodoro.startedAt = undefined;
    room.pomodoro.pausedAt = undefined;
    await room.save();

    return NextResponse.json({ message: 'Pomodoro reset', pomodoro: room.pomodoro });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Reset Pomodoro Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function togglePomodoroState(req: NextRequest, roomId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);
    const room = await StudyRoom.findById(roomId);

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    if (room.host.toString() !== userProfile?._id.toString()) {
      return NextResponse.json({ message: 'Only the host can control the timer' }, { status: 403 });
    }

    const pomodoro = room.pomodoro;

    if (pomodoro.state === 'work') {
      pomodoro.currentCycle += 1;
      if (pomodoro.currentCycle >= pomodoro.cyclesBeforeLongBreak) {
        pomodoro.state = 'longBreak';
        pomodoro.currentCycle = 0;
      } else {
        pomodoro.state = 'break';
      }
    } else if (pomodoro.state === 'break' || pomodoro.state === 'longBreak') {
      pomodoro.state = 'work';
    } else {
      pomodoro.state = 'work';
    }

    pomodoro.startedAt = new Date();
    pomodoro.isPaused = false;
    await room.save();

    return NextResponse.json({ message: `Switched to ${pomodoro.state}`, pomodoro });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Toggle Pomodoro Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getPomodoroStatus(req: NextRequest, roomId: string) {
  try {
    await dbConnect();
    await verifyAuth(req);

    const room = await StudyRoom.findById(roomId).select('pomodoro');

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ pomodoro: room.pomodoro });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Pomodoro Status Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function updatePomodoroSettings(req: NextRequest, roomId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);
    const room = await StudyRoom.findById(roomId);

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    if (room.host.toString() !== userProfile?._id.toString()) {
      return NextResponse.json({ message: 'Only the host can update settings' }, { status: 403 });
    }

    if (body.workDuration) room.pomodoro.workDuration = body.workDuration;
    if (body.breakDuration) room.pomodoro.breakDuration = body.breakDuration;
    if (body.longBreakDuration) room.pomodoro.longBreakDuration = body.longBreakDuration;
    if (body.cyclesBeforeLongBreak) room.pomodoro.cyclesBeforeLongBreak = body.cyclesBeforeLongBreak;

    await room.save();

    return NextResponse.json({ message: 'Pomodoro settings updated', pomodoro: room.pomodoro });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Update Pomodoro Settings Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ==================== CHAT ====================

export async function sendChatMessage(req: NextRequest, roomId: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);
    const room = await StudyRoom.findById(roomId);

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    const isParticipant = room.participants.some(
      (p: any) => p.userId.toString() === userProfile?._id.toString() && p.status === 'active'
    );

    if (!isParticipant) {
      return NextResponse.json({ message: 'Must be in the room to chat' }, { status: 403 });
    }

    room.chatMessages.push({
      userId: userProfile?._id,
      message: body.message,
      timestamp: new Date(),
    });

    // Keep only last 200 messages
    if (room.chatMessages.length > 200) {
      room.chatMessages = room.chatMessages.slice(-200);
    }

    await room.save();

    return NextResponse.json({ message: 'Message sent' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Send Chat Message Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getChatMessages(req: NextRequest, roomId: string) {
  try {
    await dbConnect();
    await verifyAuth(req);

    const room = await StudyRoom.findById(roomId)
      .select('chatMessages')
      .populate({
        path: 'chatMessages.userId',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      });

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ messages: room.chatMessages });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Chat Messages Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ==================== STATS ====================

export async function getMyStats(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);

    const rooms = await StudyRoom.find({
      'participants.userId': userProfile._id,
    });

    let totalStudyTime = 0;
    let roomsJoined = 0;
    const subjectBreakdown: Record<string, number> = {};

    rooms.forEach((room) => {
      const participation = room.participants.filter(
        (p: any) => p.userId.toString() === userProfile._id.toString()
      );

      participation.forEach((p: any) => {
        if (p.studyTime) {
          totalStudyTime += p.studyTime;
          const subject = room.subject || 'General';
          subjectBreakdown[subject] = (subjectBreakdown[subject] || 0) + p.studyTime;
        }
      });

      roomsJoined++;
    });

    return NextResponse.json({
      stats: {
        totalStudyTime,
        roomsJoined,
        subjectBreakdown,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get My Stats Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getLeaderboard(req: NextRequest) {
  try {
    await dbConnect();
    await verifyAuth(req);

    const leaderboard = await StudyRoom.aggregate([
      { $unwind: '$participants' },
      {
        $group: {
          _id: '$participants.userId',
          totalStudyTime: { $sum: '$participants.studyTime' },
          roomsJoined: { $sum: 1 },
        },
      },
      { $sort: { totalStudyTime: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'userprofiles',
          localField: '_id',
          foreignField: '_id',
          as: 'userProfile',
        },
      },
      { $unwind: '$userProfile' },
      {
        $lookup: {
          from: 'auths',
          localField: 'userProfile.authId',
          foreignField: '_id',
          as: 'auth',
        },
      },
      { $unwind: '$auth' },
      {
        $project: {
          username: '$auth.username',
          name: '$auth.name',
          profilePicture: '$userProfile.profilePicture',
          totalStudyTime: 1,
          roomsJoined: 1,
        },
      },
    ]);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Leaderboard Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getMyRooms(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);

    const rooms = await StudyRoom.find({
      $or: [
        { host: userProfile._id },
        {
          'participants.userId': userProfile._id,
          'participants.status': 'active',
        },
      ],
      status: 'active',
    })
      .populate({
        path: 'host',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      })
      .select('-chatMessages')
      .sort({ created_at: -1 });

    const roomsWithCount = rooms.map((room) => ({
      ...room.toObject(),
      participantCount: room.participants.filter((p: any) => p.status === 'active').length,
      isHost: room.host._id.toString() === userProfile._id.toString(),
    }));

    return NextResponse.json({ rooms: roomsWithCount });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get My Rooms Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
