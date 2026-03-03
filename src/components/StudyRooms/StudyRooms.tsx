'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Clock, Users, Play, Pause, RotateCcw, Plus, MessageSquare, Trophy, LogOut, X,
  Sparkles, Brain, Target, Coffee, Timer, BookOpen, Zap, Send, Lock, Settings,
} from 'lucide-react';
import { toast } from 'sonner';

/* ---------- types ---------- */
interface Participant {
  user?: { _id?: string; username?: string; name?: string };
  isActive?: boolean;
  studyTime?: number;
  role?: string;
}

interface PomodoroState {
  isEnabled?: boolean;
  currentState?: string;
  startTime?: string;
  isPaused?: boolean;
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
}

interface Room {
  _id: string;
  name: string;
  subject: string;
  description?: string;
  tags?: string[];
  isPrivate?: boolean;
  maxParticipants: number;
  participants?: Participant[];
  pomodoroState?: PomodoroState;
  host?: { _id: string } | string;
}

interface ChatMessage {
  sender?: { username?: string; name?: string };
  text: string;
  timestamp?: string;
}

interface LeaderboardUser {
  fullName: string;
  username: string;
  totalStudyTime: number;
}

interface CreateRoomFormData {
  name: string;
  description: string;
  subject: string;
  isPrivate: boolean;
  maxParticipants: number;
  tags: string;
  pomodoroEnabled: boolean;
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
}

/* ---------- main component ---------- */
const StudyRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [pomodoroTime, setPomodoroTime] = useState(0);
  const [filter, setFilter] = useState({ subject: '', tags: '', search: '' });
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const axiosConfig = () => ({
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  /* ---------- fetch current user ---------- */
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await axios.get('/api/profile', axiosConfig());
        setCurrentUserId(data._id);
      } catch {
        console.error('Failed to fetch current user');
      }
    };
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchMyRooms();
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- pomodoro timer ---------- */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeRoom?.pomodoroState?.startTime && !activeRoom.pomodoroState.isPaused) {
      interval = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - new Date(activeRoom.pomodoroState!.startTime!).getTime()) / 1000,
        );
        const state = activeRoom.pomodoroState!;
        const duration =
          state.currentState === 'work'
            ? state.workDuration * 60
            : state.currentState === 'break'
              ? state.breakDuration * 60
              : state.longBreakDuration * 60;
        setPomodoroTime(Math.max(0, duration - elapsed));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeRoom]);

  /* ---------- API helpers ---------- */
  const fetchRooms = async () => {
    try {
      const { data } = await axios.get('/api/study-rooms', axiosConfig());
      setRooms(data.rooms);
    } catch {
      toast.error('Failed to load rooms');
    }
  };

  const fetchMyRooms = async () => {
    try {
      const { data } = await axios.get('/api/study-rooms/my-rooms', axiosConfig());
      setMyRooms(data.rooms);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data } = await axios.get('/api/study-rooms/leaderboard', axiosConfig());
      setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error(error);
    }
  };

  const createRoom = async (formData: Record<string, any>) => {
    try {
      await axios.post('/api/study-rooms', formData, axiosConfig());
      toast.success('🎉 Room created successfully');
      setShowCreateModal(false);
      fetchRooms();
      fetchMyRooms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create room');
      console.error(error);
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const { data } = await axios.post(`/api/study-rooms/${roomId}/join`, {}, axiosConfig());
      setActiveRoom(data.room);
      setShowRoomModal(true);
      fetchChatMessages(roomId);
      toast.success('✨ Joined room');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join room');
    }
  };

  const openRoom = async (roomId: string) => {
    try {
      const { data } = await axios.post(`/api/study-rooms/${roomId}/join`, {}, axiosConfig());
      setActiveRoom(data.room);
      setShowRoomModal(true);
      fetchChatMessages(roomId);
    } catch (error: any) {
      if (error.response?.status === 400) {
        try {
          const { data } = await axios.get(`/api/study-rooms/${roomId}`, axiosConfig());
          setActiveRoom(data.room);
          setShowRoomModal(true);
          fetchChatMessages(roomId);
        } catch {
          toast.error('Failed to open room');
        }
      } else {
        toast.error('Failed to open room');
      }
    }
  };

  const leaveRoom = async () => {
    try {
      await axios.post(`/api/study-rooms/${activeRoom!._id}/leave`, {}, axiosConfig());
      setActiveRoom(null);
      setShowRoomModal(false);
      fetchRooms();
      toast.success('Left room');
    } catch {
      toast.error('Failed to leave room');
    }
  };

  const fetchChatMessages = async (roomId: string) => {
    try {
      const { data } = await axios.get(`/api/study-rooms/${roomId}/chat`, axiosConfig());
      setChatMessages(data.messages);
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;
    try {
      const { data } = await axios.post(
        `/api/study-rooms/${activeRoom!._id}/chat`,
        { text: chatMessage },
        axiosConfig(),
      );
      setChatMessages([...chatMessages, data.message]);
      setChatMessage('');
    } catch {
      toast.error('Failed to send message');
    }
  };

  const controlPomodoro = async (action: string) => {
    try {
      await axios.post(`/api/study-rooms/${activeRoom!._id}/pomodoro/${action}`, {}, axiosConfig());
      const { data } = await axios.get(`/api/study-rooms/${activeRoom!._id}`, axiosConfig());
      setActiveRoom(data.room);
      toast.success(`Pomodoro ${action}ed`);
    } catch {
      toast.error(`Failed to ${action} pomodoro`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSubjectIcon = (subject: string) => {
    const icons: Record<string, string> = {
      Mathematics: '🔢', Science: '🔬', Programming: '💻', Literature: '📚',
      History: '📜', Language: '🌍', Physics: '⚛️', Chemistry: '⚗️', Biology: '🧬',
    };
    return icons[subject] || '📖';
  };

  const getGradientForSubject = (subject: string) => {
    const gradients: Record<string, string> = {
      Mathematics: 'from-blue-500 via-purple-500 to-pink-500',
      Science: 'from-green-400 via-teal-500 to-blue-500',
      Programming: 'from-yellow-400 via-orange-500 to-red-500',
      Literature: 'from-purple-400 via-pink-500 to-red-400',
      History: 'from-amber-500 via-orange-500 to-red-600',
      Language: 'from-cyan-400 via-blue-500 to-purple-500',
      Physics: 'from-indigo-500 via-purple-600 to-pink-600',
      Chemistry: 'from-emerald-400 via-teal-500 to-cyan-600',
      Biology: 'from-lime-400 via-green-500 to-emerald-600',
    };
    return gradients[subject] || 'from-gray-500 via-gray-600 to-gray-700';
  };

  /* ---------- JSX ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 text-white p-6">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 backdrop-blur-xl border border-purple-500/30 p-8 md:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-12 h-12 text-purple-400" />
              <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Study Rooms
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl">
              Join collaborative study sessions with peers. Use Pomodoro timers, chat in real-time, and climb the leaderboard! 🚀
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl font-semibold flex items-center gap-3 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-purple-500/50"
              >
                <Plus className="w-5 h-5" />
                Create Study Room
              </button>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/50 rounded-2xl font-semibold flex items-center gap-3 transform hover:scale-105 transition-all duration-200"
              >
                <Trophy className="w-5 h-5 text-yellow-400" />
                Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* My Active Rooms */}
      {myRooms.length > 0 && (
        <div className="max-w-7xl mx-auto mb-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Target className="w-7 h-7 text-green-400" />
            My Active Rooms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myRooms.map((room) => (
              <RoomCard key={room._id} room={room} onJoin={openRoom} isMyRoom getSubjectIcon={getSubjectIcon} getGradientForSubject={getGradientForSubject} />
            ))}
          </div>
        </div>
      )}

      {/* All Available Rooms */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-blue-400" />
          Available Study Rooms
        </h2>

        {rooms.filter((r) => !myRooms.find((mr) => mr._id === r._id)).length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800">
            <BookOpen className="w-20 h-20 mx-auto text-gray-600 mb-4" />
            <p className="text-2xl text-gray-500 mb-4">No rooms available yet</p>
            <p className="text-gray-600">Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.filter((r) => !myRooms.find((mr) => mr._id === r._id)).map((room) => (
              <RoomCard key={room._id} room={room} onJoin={joinRoom} getSubjectIcon={getSubjectIcon} getGradientForSubject={getGradientForSubject} />
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && <CreateRoomModal onClose={() => setShowCreateModal(false)} onCreate={createRoom} />}

      {/* Room Modal */}
      {showRoomModal && activeRoom && (
        <RoomModal
          room={activeRoom}
          onClose={() => { setShowRoomModal(false); setActiveRoom(null); }}
          onLeave={leaveRoom}
          chatMessages={chatMessages}
          chatMessage={chatMessage}
          setChatMessage={setChatMessage}
          sendMessage={sendMessage}
          controlPomodoro={controlPomodoro}
          pomodoroTime={pomodoroTime}
          formatTime={formatTime}
          currentUserId={currentUserId}
        />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && <LeaderboardModal leaderboard={leaderboard} onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
};

/* ---------- RoomCard ---------- */
interface RoomCardProps {
  room: Room;
  onJoin: (roomId: string) => void;
  isMyRoom?: boolean;
  getSubjectIcon: (subject: string) => string;
  getGradientForSubject: (subject: string) => string;
}

const RoomCard = ({ room, onJoin, isMyRoom, getSubjectIcon, getGradientForSubject }: RoomCardProps) => {
  const activeUsers = room.participants?.filter((p) => p.isActive).length || 0;

  return (
    <div
      onClick={() => onJoin(room._id)}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 hover:border-purple-500/50 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradientForSubject(room.subject)} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{getSubjectIcon(room.subject)}</div>
            <div>
              <h3 className="font-bold text-xl group-hover:text-purple-400 transition-colors">{room.name}</h3>
              <p className="text-sm text-gray-400">{room.subject}</p>
            </div>
          </div>
          {room.isPrivate && <Lock className="w-5 h-5 text-yellow-400" />}
        </div>

        {room.description && <p className="text-gray-400 text-sm mb-4 line-clamp-2">{room.description}</p>}

        <div className="flex flex-wrap gap-2 mb-4">
          {room.tags?.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <Users className="w-4 h-4" />
              <span>{activeUsers}/{room.maxParticipants}</span>
            </div>
            {room.pomodoroState?.isEnabled && (
              <div className="flex items-center gap-2 text-orange-400">
                <Timer className="w-4 h-4" />
                <span>Pomodoro</span>
              </div>
            )}
          </div>
          {isMyRoom && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold border border-green-500/40">
              ACTIVE
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- CreateRoomModal ---------- */
interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (formData: Record<string, any>) => void;
}

const CreateRoomModal = ({ onClose, onCreate }: CreateRoomModalProps) => {
  const [formData, setFormData] = useState<CreateRoomFormData>({
    name: '',
    description: '',
    subject: 'Mathematics',
    isPrivate: false,
    maxParticipants: 50,
    tags: '',
    pomodoroEnabled: true,
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
  });

  const subjects = ['Mathematics', 'Science', 'Programming', 'Literature', 'History', 'Language', 'Physics', 'Chemistry', 'Biology'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-purple-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border-b border-purple-500/30 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-purple-400" />
            <h2 className="text-2xl font-bold">Create Study Room</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Room Name */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Room Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Advanced Calculus Study Group"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Subject *</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={3}
              placeholder="What will you be studying?"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., exam, midterm, group study"
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">Max Participants</label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                min={2}
                max={50}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl w-full cursor-pointer hover:bg-gray-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  className="w-5 h-5 rounded accent-purple-600"
                />
                <span className="text-sm font-medium">Private Room</span>
              </label>
            </div>
          </div>

          {/* Pomodoro Settings */}
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Timer className="w-6 h-6 text-orange-400" />
              <h3 className="font-bold text-lg">Pomodoro Timer</h3>
            </div>

            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pomodoroEnabled}
                onChange={(e) => setFormData({ ...formData, pomodoroEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-orange-600"
              />
              <span className="text-sm font-medium">Enable Pomodoro Timer</span>
            </label>

            {formData.pomodoroEnabled && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">Work (min)</label>
                  <input
                    type="number"
                    value={formData.workDuration}
                    onChange={(e) => setFormData({ ...formData, workDuration: parseInt(e.target.value) })}
                    min={1}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">Break (min)</label>
                  <input
                    type="number"
                    value={formData.breakDuration}
                    onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) })}
                    min={1}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">Long Break (min)</label>
                  <input
                    type="number"
                    value={formData.longBreakDuration}
                    onChange={(e) => setFormData({ ...formData, longBreakDuration: parseInt(e.target.value) })}
                    min={1}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl font-bold text-lg transform hover:scale-105 transition-all duration-200 shadow-lg shadow-purple-500/30"
          >
            🚀 Create Room
          </button>
        </form>
      </div>
    </div>
  );
};

/* ---------- RoomModal ---------- */
interface RoomModalProps {
  room: Room;
  onClose: () => void;
  onLeave: () => void;
  chatMessages: ChatMessage[];
  chatMessage: string;
  setChatMessage: (msg: string) => void;
  sendMessage: () => void;
  controlPomodoro: (action: string) => void;
  pomodoroTime: number;
  formatTime: (seconds: number) => string;
  currentUserId: string | null;
}

const RoomModal = ({
  room, onClose, onLeave, chatMessages, chatMessage, setChatMessage,
  sendMessage, controlPomodoro, pomodoroTime, formatTime, currentUserId,
}: RoomModalProps) => {
  const isPomodoroActive = room.pomodoroState?.currentState !== 'idle';
  const isPaused = room.pomodoroState?.isPaused;
  const activeParticipants = room.participants?.filter((p) => p.isActive) || [];
  const hostId = typeof room.host === 'string' ? room.host : room.host?._id;
  const isHost = hostId === currentUserId;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 border border-purple-500/20 rounded-2xl md:rounded-3xl w-full max-w-6xl h-[95vh] md:h-[90vh] flex flex-col shadow-2xl shadow-purple-500/10">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-gray-800 px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl md:text-2xl">
              💻
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-white">{room.name}</h2>
              <p className="text-xs md:text-sm text-gray-400">{room.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onLeave} className="px-3 md:px-5 py-2 md:py-2.5 bg-gray-800 hover:bg-red-600/80 text-gray-300 hover:text-white rounded-lg md:rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
            <button onClick={onClose} className="p-2 md:p-2.5 hover:bg-gray-800 rounded-lg md:rounded-xl transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Timer & Participants */}
          <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col shrink-0">
            {/* Pomodoro Timer */}
            {room.pomodoroState?.isEnabled && (
              <div className="p-4 md:p-5 border-b border-gray-800">
                <div className="bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-orange-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-5 h-5 text-orange-400" />
                      <span className="font-semibold text-sm text-orange-300">Pomodoro</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full uppercase">
                      {room.pomodoroState.currentState || 'idle'}
                    </span>
                  </div>

                  <div className="text-center py-3">
                    <div className="text-4xl md:text-5xl font-mono font-bold text-orange-400">{formatTime(pomodoroTime)}</div>
                  </div>

                  {isHost ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => controlPomodoro(isPomodoroActive && !isPaused ? 'pause' : 'start')}
                        className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors text-white"
                      >
                        {isPomodoroActive && !isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPomodoroActive && !isPaused ? 'Pause' : 'Start'}
                      </button>
                      <button onClick={() => controlPomodoro('reset')} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center">Only the host can control the timer</p>
                  )}
                </div>
              </div>
            )}

            {/* Participants */}
            <div className="flex-1 p-4 md:p-5 overflow-y-auto">
              <h3 className="font-semibold text-sm text-gray-400 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" />
                Participants ({activeParticipants.length})
              </h3>
              <div className="space-y-2">
                {activeParticipants.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">
                      {p.user?.username?.[0]?.toUpperCase() || p.user?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white truncate">
                        {p.user?.username || p.user?.name || 'Anonymous'}
                      </div>
                      <div className="text-xs text-gray-500">{p.studyTime || 0} min</div>
                    </div>
                    {p.role === 'host' && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">HOST</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Chat */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 md:px-5 py-3 border-b border-gray-800 shrink-0">
              <h3 className="font-semibold text-sm text-gray-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Chat
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs text-gray-600">Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className="flex gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {msg.sender?.username?.[0]?.toUpperCase() || msg.sender?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-purple-300">
                          {msg.sender?.username || msg.sender?.name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-600">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-200 mt-0.5 break-words">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 md:p-5 border-t border-gray-800 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatMessage.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- LeaderboardModal ---------- */
interface LeaderboardModalProps {
  leaderboard: LeaderboardUser[];
  onClose: () => void;
}

const LeaderboardModal = ({ leaderboard, onClose }: LeaderboardModalProps) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-yellow-500/30 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-xl border-b border-yellow-500/30 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <h2 className="text-3xl font-bold">🏆 Leaderboard</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
        <div className="space-y-4">
          {leaderboard.map((user, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 p-4 rounded-2xl border ${
                i === 0
                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50'
                  : i === 1
                    ? 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-500/30'
                    : i === 2
                      ? 'bg-gradient-to-r from-amber-700/10 to-orange-900/10 border-amber-700/30'
                      : 'bg-gray-900/50 border-gray-800'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl ${
                  i === 0
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                    : i === 1
                      ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                      : i === 2
                        ? 'bg-gradient-to-br from-amber-600 to-orange-800'
                        : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}
              >
                {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">{user.fullName}</div>
                <div className="text-sm text-gray-400">@{user.username}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">{user.totalStudyTime}</div>
                <div className="text-xs text-gray-400">minutes</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default StudyRooms;
