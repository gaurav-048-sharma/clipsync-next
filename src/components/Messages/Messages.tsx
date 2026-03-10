'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import Navbar from '../Dashboard/Navbar';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatHeader from './ChatHeader';
import ConversationItem from './ConversationItem';
import GroupChatView from './GroupChatView';
import CreateGroupModal from './CreateGroupModal';
import { MessageCircle, Users, Plus } from 'lucide-react';

/* ───────────── types ───────────── */

interface ConversationUser {
  userId: string;
  username: string;
  profilePicture?: string;
  lastMessage?: { content: string; timestamp: string };
  unreadCount?: number;
  isOnline?: boolean;
  lastSeen?: string;
}

interface MessageData {
  _id: string;
  content: string;
  sender: { _id: string; username?: string } | string;
  recipient: { _id: string } | string;
  timestamp?: string;
  createdAt?: string;
  status?: string;
  deliveredAt?: string;
  seenAt?: string;
  read?: boolean;
  isEdited?: boolean;
  messageType?: string;
  mediaUrl?: string;
}

interface GroupData {
  _id: string;
  name: string;
  avatar?: string;
  members?: any[];
  admins?: any[];
  creator?: string | { _id: string };
  lastMessage?: { content: string; timestamp: string };
  unreadCount?: number;
}

interface NotificationData {
  username: string;
  content: string;
  userId: string;
}

/* ───────────── component ───────────── */

const InstagramMessages = () => {
  const [conversations, setConversations] = useState<ConversationUser[]>([]);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<{
    userId: string;
    username: string;
    profilePicture?: string;
  } | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [error, setError] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [typingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers] = useState<
    Record<string, { isOnline: boolean; lastSeen?: string }>
  >({});
  const [notification, setNotification] = useState<NotificationData | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const conversationsPollingRef = useRef<NodeJS.Timeout | null>(null);
  const messagesPollingRef = useRef<NodeJS.Timeout | null>(null);
  const selectedConversationRef = useRef(selectedConversation);

  // Keep ref in sync so polling callbacks can access latest state
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  /* ───── Clear conversation selection & URL params ───── */
  const clearSelectedConversation = useCallback(() => {
    setSelectedConversation(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('userId');
    url.searchParams.delete('username');
    window.history.replaceState({}, '', url.toString());
  }, []);

  /* ───── Mark messages as seen ───── */
  const markMessagesAsSeen = useCallback(async (senderId: string) => {
    try {
      const token = getToken();
      await axios.put(
        `/api/messages/seen/${senderId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Mark as seen error:', err);
    }
  }, []);

  /* ───── Update conversations list helper ───── */
  const updateConversationsList = useCallback(
    (message: MessageData) => {
      setConversations((prev) => {
        const senderObj =
          typeof message.sender === 'object' ? message.sender : { _id: message.sender };
        const recipientObj =
          typeof message.recipient === 'object' ? message.recipient : { _id: message.recipient };
        const otherUserId =
          senderObj._id === currentUserId ? recipientObj._id : senderObj._id;

        const existingConvo = prev.find((c) => c.userId === otherUserId);
        if (existingConvo) {
          return prev
            .map((convo) =>
              convo.userId === otherUserId
                ? {
                    ...convo,
                    lastMessage: {
                      content: message.content,
                      timestamp: message.timestamp || message.createdAt || '',
                    },
                    unreadCount:
                      selectedConversationRef.current?.userId === otherUserId
                        ? 0
                        : (convo.unreadCount || 0) + 1,
                  }
                : convo
            )
            .sort(
              (a, b) =>
                new Date(b.lastMessage?.timestamp || 0).getTime() -
                new Date(a.lastMessage?.timestamp || 0).getTime()
            );
        }
        return prev;
      });
    },
    [currentUserId]
  );

  /* ───── Handle conversation click ───── */
  const handleConversationClick = useCallback(
    async (userId: string, username: string, profilePicture: string | null = null) => {
      try {
        const token = getToken();
        const response = await axios.get(
          `/api/messages/conversation/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setMessages(response.data.messages || []);
        setSelectedConversation({ userId, username, profilePicture: profilePicture || undefined });
        setSelectedGroup(null);

        // Update URL so refresh preserves the open conversation
        const url = new URL(window.location.href);
        url.searchParams.set('userId', userId);
        url.searchParams.set('username', username);
        window.history.replaceState({}, '', url.toString());

        setConversations((prev) => {
          const exists = prev.find((c) => c.userId === userId);
          if (!exists) {
            return [
              {
                userId,
                username,
                profilePicture: profilePicture || undefined,
                lastMessage:
                  response.data.messages?.[response.data.messages.length - 1] || null,
                unreadCount: 0,
                isOnline: false,
              },
              ...prev,
            ];
          }
          return prev.map((convo) =>
            convo.userId === userId ? { ...convo, unreadCount: 0 } : convo
          );
        });

        markMessagesAsSeen(userId);

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } catch (err: any) {
        console.error(
          'Fetch conversation error:',
          err.response?.data || err.message
        );
        setError(
          err.response?.data?.message || 'Failed to load conversation'
        );
      }
    },
    [markMessagesAsSeen]
  );

  /* ───── Fetch initial data ───── */
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchInitialData = async () => {
      try {
        const currentUserResponse = await axios.get('/api/users/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userId = currentUserResponse.data.authId._id;
        setCurrentUserId(userId);

        // Fetch conversations
        const conversationsResponse = await axios.get(
          '/api/messages/conversations',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const mappedConversations = (conversationsResponse.data.conversations || []).map((c: any) => ({
          userId: c.user?._id || c.userId,
          username: c.user?.username || c.username || 'Unknown',
          profilePicture: c.user?.profilePicture || c.profilePicture,
          lastMessage: c.lastMessage,
          unreadCount: c.unreadCount || 0,
          isOnline: false,
        }));
        setConversations(mappedConversations);

        // Fetch groups
        try {
          const groupsResponse = await axios.get('/api/group-chats', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setGroups(groupsResponse.data.groups || []);
        } catch (groupErr) {
          console.error('Fetch groups error:', groupErr);
        }

        // Open pre-selected conversation (from profile link via searchParams)
        const preSelectedUserId = searchParams.get('userId');
        const preSelectedUsername = searchParams.get('username');
        if (preSelectedUserId && preSelectedUsername) {
          handleConversationClick(preSelectedUserId, preSelectedUsername);
        }
      } catch (err: any) {
        console.error(
          'Fetch initial data error:',
          err.response?.data || err.message
        );
        setError(
          err.response?.data?.message || 'Failed to load conversations'
        );
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        }
      }
    };

    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ───── Polling: refresh conversations list ───── */
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    conversationsPollingRef.current = setInterval(async () => {
      try {
        const res = await axios.get('/api/messages/conversations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mappedConversations = (res.data.conversations || []).map((c: any) => ({
          userId: c.user?._id || c.userId,
          username: c.user?.username || c.username || 'Unknown',
          profilePicture: c.user?.profilePicture || c.profilePicture,
          lastMessage: c.lastMessage,
          unreadCount: c.unreadCount || 0,
          isOnline: false,
        }));
        setConversations(mappedConversations);
      } catch {
        /* ignore polling errors */
      }
    }, 15000);

    return () => {
      if (conversationsPollingRef.current)
        clearInterval(conversationsPollingRef.current);
    };
  }, []);

  /* ───── Polling: refresh active conversation messages ───── */
  useEffect(() => {
    if (!selectedConversation) {
      if (messagesPollingRef.current)
        clearInterval(messagesPollingRef.current);
      return;
    }

    const token = getToken();
    if (!token) return;

    messagesPollingRef.current = setInterval(async () => {
      try {
        const res = await axios.get(
          `/api/messages/conversation/${selectedConversationRef.current?.userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(res.data.messages || []);
      } catch {
        /* ignore polling errors */
      }
    }, 5000);

    return () => {
      if (messagesPollingRef.current)
        clearInterval(messagesPollingRef.current);
    };
  }, [selectedConversation?.userId]);

  /* ───── Auto-dismiss notification ───── */
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  /* ───── Send message ───── */
  const handleSendMessage = async (
    content: string,
    messageType: string = 'text',
    mediaUrl: string | null = null
  ) => {
    if (!selectedConversation) return;

    try {
      const token = getToken();
      const response = await axios.post(
        '/api/messages/send',
        {
          recipientId: selectedConversation.userId,
          content,
          messageType,
          mediaUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [...prev, response.data.data]);
      updateConversationsList(response.data.data);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error(
        'Send message error:',
        err.response?.data || err.message
      );
      setError(err.response?.data?.message || 'Failed to send message');
    }
  };

  /* ───── Edit / Delete message ───── */
  const handleEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditContent(currentContent);
  };

  const handleSaveEdit = async (messageId: string) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `/api/messages/update/${messageId}`,
        { content: editContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...response.data.data, isEdited: true }
            : msg
        )
      );
      setEditingMessageId(null);
      setEditContent('');
    } catch (err: any) {
      console.error(
        'Edit message error:',
        err.response?.data || err.message
      );
      setError(err.response?.data?.message || 'Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const token = getToken();
      await axios.delete(`/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (err: any) {
      console.error(
        'Delete message error:',
        err.response?.data || err.message
      );
      setError(err.response?.data?.message || 'Failed to delete message');
    }
  };

  /* ───── Auto-scroll ───── */
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage._id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMessage._id;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /* ───────────── RENDER ───────────── */

  if (error && !conversations.length) {
    return (
      <div className="text-center mt-10 text-red-500 text-[14px]">
        {error}
      </div>
    );
  }

  return (
    <div
      className={`h-dvh flex flex-col md:flex-row overflow-hidden md:pt-0 md:pb-0 ${
        selectedConversation || selectedGroup
          ? 'pt-0 pb-0'
          : 'pt-14 pb-14'
      } bg-theme-background`}
    >
      {/* Hide Navbar on mobile when conversation is open */}
      <div
        className={`${
          selectedConversation || selectedGroup
            ? 'hidden md:block'
            : 'block'
        }`}
      >
        <Navbar />
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={(group: GroupData) => {
          setGroups((prev) => [group, ...prev]);
          setSelectedGroup(group);
          clearSelectedConversation();
          setShowCreateGroup(false);
        }}
        currentUserId={currentUserId}
      />

      {/* Notification Toast */}
      {notification && !selectedConversation && (
        <div
          className="fixed top-16 md:top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 min-w-[300px] animate-slide-in cursor-pointer hover:scale-105 transition-transform border-theme-color"
          onClick={() => {
            handleConversationClick(
              notification.userId,
              notification.username
            );
            setNotification(null);
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[2px]">
              <div
                className="w-full h-full rounded-full flex items-center justify-center bg-theme-background"
              >
                <span
                  className="text-sm font-semibold text-theme-color"
                >
                  {notification.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-semibold text-sm text-theme-color"
              >
                {notification.username}
              </p>
              <p
                className="text-sm truncate text-theme-color-70"
              >
                {notification.content}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 md:ml-64 flex flex-col md:flex-row h-full overflow-hidden relative">
        {/* ───── Conversations Sidebar ───── */}
        <div
          className={`w-full md:w-[320px] lg:w-[397px] border-r border-theme-color bg-theme-background flex flex-col transition-transform duration-300 ease-in-out h-full ${
            selectedConversation || selectedGroup
              ? '-translate-x-full md:translate-x-0 absolute md:relative'
              : 'translate-x-0'
          }`}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-theme-color"
          >
            <h1
              className="text-xl sm:text-2xl font-bold text-theme-color"
            >
              Messages
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/confessions')}
                className="p-2 hover:opacity-70 active:scale-95 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Confessions"
              >
                <MessageCircle
                  className="w-5 h-5 sm:w-6 sm:h-6 text-theme-color"
                />
              </button>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-2 hover:opacity-70 active:scale-95 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Create Group"
              >
                <Plus
                  className="w-5 h-5 sm:w-6 sm:h-6 text-theme-color"
                />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div
            className="flex border-b border-theme-color"
          >
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-1 py-3 text-sm font-medium transition-all text-theme-color ${
                activeTab === 'chats' ? 'border-b-2 border-purple-500' : 'opacity-50'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 text-theme-color ${
                activeTab === 'groups' ? 'border-b-2 border-purple-500' : 'opacity-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Groups
              {groups.length > 0 && (
                <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {groups.length}
                </span>
              )}
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'chats' ? (
              conversations.length === 0 ? (
                <p
                  className="text-center py-8 text-sm text-theme-color-50"
                >
                  No conversations yet
                </p>
              ) : (
                conversations.map((convo) => (
                  <ConversationItem
                    key={convo.userId}
                    conversation={{
                      ...convo,
                      isOnline:
                        onlineUsers[convo.userId]?.isOnline || false,
                      lastSeen: onlineUsers[convo.userId]?.lastSeen,
                    }}
                    isSelected={
                      selectedConversation?.userId === convo.userId
                    }
                    onClick={() => {
                      handleConversationClick(
                        convo.userId,
                        convo.username
                      );
                      setSelectedGroup(null);
                    }}
                  />
                ))
              )
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users
                  className="w-16 h-16 mb-4 text-theme-color-20"
                />
                <p
                  className="text-sm mb-4 text-theme-color-50"
                >
                  No groups yet
                </p>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                >
                  Create a Group
                </button>
              </div>
            ) : (
              groups.map((group) => (
                <div
                  key={group._id}
                  onClick={() => {
                    setSelectedGroup(group);
                    clearSelectedConversation();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:opacity-80 ${
                    selectedGroup?._id === group._id
                      ? 'bg-purple-50 dark:bg-purple-900/20 bg-theme-hover'
                      : ''
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
                    {group.avatar ? (
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center bg-theme-background"
                      >
                        <Users
                          className="w-6 h-6 text-theme-color"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className="font-semibold text-sm truncate text-theme-color"
                      >
                        {group.name}
                      </p>
                      {group.lastMessage?.timestamp && (
                        <span
                          className="text-xs text-theme-color-50"
                        >
                          {new Date(
                            group.lastMessage.timestamp
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs truncate mt-0.5 text-theme-color-60"
                    >
                      {group.lastMessage?.content ||
                        `${group.members?.length || 0} members`}
                    </p>
                  </div>
                  {(group.unreadCount ?? 0) > 0 && (
                    <span className="min-w-[20px] h-5 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full px-1.5">
                      {group.unreadCount}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ───── Chat Window ───── */}
        {selectedConversation ? (
          <div
            className={`flex flex-col absolute md:relative inset-0 md:inset-auto md:flex-1 md:h-full bg-theme-background overflow-hidden z-[60]`}
          >
            {/* Chat Header */}
            <div
              className="flex-shrink-0 z-30 bg-theme-background"
            >
              <ChatHeader
                username={selectedConversation.username}
                isOnline={
                  onlineUsers[selectedConversation.userId]?.isOnline ||
                  false
                }
                lastSeen={
                  onlineUsers[selectedConversation.userId]?.lastSeen
                }
                onBack={() => clearSelectedConversation()}
                onInfoClick={() => setShowConversationInfo(true)}
              />
            </div>

            {/* Conversation Info Modal */}
            {showConversationInfo && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={() => setShowConversationInfo(false)}
              >
                <div
                  className="w-full max-w-md rounded-2xl p-6 shadow-2xl bg-theme-background"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[2px] mb-4">
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center bg-theme-background"
                      >
                        <span className="text-3xl font-semibold text-theme-color">
                          {selectedConversation.username
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <h3
                      className="text-xl font-semibold mb-1 text-theme-color"
                    >
                      {selectedConversation.username}
                    </h3>
                    <p
                      className="text-sm text-theme-color-50"
                    >
                      ClipSync
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      className="w-full p-3 rounded-xl text-left hover:opacity-70 transition-opacity bg-theme-hover-text"
                      onClick={() => {
                        router.push(
                          `/user/${selectedConversation.username}`
                        );
                        setShowConversationInfo(false);
                      }}
                    >
                      View profile
                    </button>
                    <button
                      className="w-full p-3 rounded-xl text-left hover:opacity-70 transition-opacity bg-theme-hover-text"
                    >
                      Mute messages
                    </button>
                    <button
                      className="w-full p-3 rounded-xl text-left hover:opacity-70 transition-opacity bg-theme-hover-text"
                    >
                      Block
                    </button>
                    <button
                      className="w-full p-3 rounded-xl text-left text-red-500 hover:opacity-70 transition-opacity bg-theme-hover"
                    >
                      Delete chat
                    </button>
                  </div>

                  <button
                    onClick={() => setShowConversationInfo(false)}
                    className="w-full mt-4 p-3 rounded-xl font-semibold hover:opacity-70 transition-opacity bg-theme-hover-text"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 md:px-6 py-3 sm:py-4 min-h-0"
              style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
            >
              {messages.length === 0 ? (
                <p
                  className="text-center text-sm py-8 text-theme-color-50"
                >
                  No messages yet
                </p>
              ) : (
                <>
                  {messages.map((msg) => {
                    const messageSenderId =
                      typeof msg.sender === 'object'
                        ? msg.sender._id
                        : msg.sender;
                    const isSender =
                      messageSenderId?.toString() ===
                      currentUserId?.toString();

                    return editingMessageId === msg._id ? (
                      <div
                        key={msg._id}
                        className="flex justify-end mb-2"
                      >
                        <div className="max-w-[75%] sm:max-w-[70%] md:max-w-[60%] rounded-[20px] px-4 py-2 bg-[#3797f0]">
                          <Input
                            value={editContent}
                            onChange={(e) =>
                              setEditContent(e.target.value)
                            }
                            onKeyDown={(e) =>
                              e.key === 'Enter' &&
                              handleSaveEdit(msg._id)
                            }
                            className="text-sm border-0 focus-visible:ring-1 bg-white/20 text-white"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end mt-2">
                            <button
                              onClick={() =>
                                setEditingMessageId(null)
                              }
                              className="text-xs px-3 py-1 text-white/70 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() =>
                                handleSaveEdit(msg._id)
                              }
                              className="text-xs px-3 py-1 font-semibold text-white hover:opacity-70"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <MessageBubble
                        key={msg._id}
                        message={msg as any}
                        isSender={isSender}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                        recipientUsername={
                          selectedConversation.username
                        }
                      />
                    );
                  })}

                  {/* Typing Indicator */}
                  {typingUsers[selectedConversation.userId] && (
                    <TypingIndicator
                      username={selectedConversation.username}
                    />
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div
              className="flex-shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 border-t border-theme-color bg-theme-background z-10"
            >
              <MessageInput onSend={handleSendMessage} />
            </div>
          </div>
        ) : selectedGroup ? (
          <GroupChatView
            group={selectedGroup}
            currentUserId={currentUserId}
            onBack={() => setSelectedGroup(null)}
            onLeaveGroup={(groupId: string) => {
              setGroups((prev) =>
                prev.filter((g) => g._id !== groupId)
              );
              setSelectedGroup(null);
            }}
            onAddMembers={(group: GroupData) => {
              console.log('Add members to:', group.name);
            }}
          />
        ) : (
          /* Empty state — desktop */
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[3px]">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-theme-color"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
              </div>
              <h3
                className="text-2xl font-light mb-2 text-theme-color"
              >
                Your Messages
              </h3>
              <p
                className="text-sm text-theme-color-50"
              >
                Send private messages to a friend or create a group
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramMessages;
