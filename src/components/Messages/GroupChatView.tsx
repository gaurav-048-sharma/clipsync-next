'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  ArrowLeft,
  Users,
  MoreVertical,
  UserPlus,
  LogOut,
  Crown,
  Info,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import MessageInput from './MessageInput';

interface GroupMember {
  _id: string;
  username: string;
  name?: string;
  profilePicture?: string;
  userId?: any;
}

interface GroupData {
  _id: string;
  name: string;
  avatar?: string;
  members?: GroupMember[];
  admins?: (string | { _id: string })[];
  creator?: string | { _id: string };
  lastMessage?: { content: string; timestamp: string };
}

interface GroupMessage {
  _id: string;
  content: string;
  sender: { _id: string; username: string } | string;
  messageType?: string;
  mediaUrl?: string;
  timestamp?: string;
  createdAt?: string;
}

interface GroupChatViewProps {
  group: GroupData;
  currentUserId: string;
  onBack: () => void;
  onLeaveGroup: (groupId: string) => void;
  onAddMembers: (group: GroupData) => void;
}

const GroupChatView = ({
  group,
  currentUserId,
  onBack,
  onLeaveGroup,
  onAddMembers,
}: GroupChatViewProps) => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchMessages = async () => {
    try {
      const token = getToken();
      const response = await axios.get(
        `/api/group-chats/${group._id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data.messages || []);
      setLoading(false);
      scrollToBottom();
    } catch (err) {
      console.error('Fetch group messages error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Poll for new messages (serverless replacement for socket.io)
    pollingRef.current = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [group._id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (
    content: string,
    messageType: string = 'text',
    mediaUrl: string | null = null
  ) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `/api/group-chats/${group._id}/messages`,
        { content, messageType, mediaUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, response.data.message]);
      scrollToBottom();
    } catch (err) {
      console.error('Send group message error:', err);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      const token = getToken();
      await axios.post(
        `/api/group-chats/${group._id}/leave`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onLeaveGroup(group._id);
    } catch (err) {
      console.error('Leave group error:', err);
    }
  };

  const isAdmin =
    group.admins?.some(
      (a) => (typeof a === 'string' ? a : a._id) === currentUserId
    ) ||
    group.creator === currentUserId ||
    (typeof group.creator === 'object' &&
      (group.creator as { _id: string })?._id === currentUserId);

  return (
    <div
      className="flex-1 flex flex-col h-full bg-theme-background"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-theme-color"
      >
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-1 hover:opacity-70">
            <ArrowLeft
              className="w-6 h-6 text-theme-color"
            />
          </button>
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px] cursor-pointer"
            onClick={() => setShowGroupInfo(true)}
          >
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
                  className="w-5 h-5 text-theme-color"
                />
              </div>
            )}
          </div>
          <div
            className="cursor-pointer"
            onClick={() => setShowGroupInfo(true)}
          >
            <p
              className="font-semibold text-sm text-theme-color"
            >
              {group.name}
            </p>
            <p
              className="text-xs text-theme-color-50"
            >
              {group.members?.length || 0} members
            </p>
          </div>
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-2 hover:opacity-70 rounded-full">
              <MoreVertical
                className="w-5 h-5 text-theme-color"
              />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="rounded-xl shadow-2xl p-1 min-w-[160px] z-50 border bg-theme-background border-theme-color"
              sideOffset={5}
            >
              <DropdownMenu.Item
                onClick={() => setShowGroupInfo(true)}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg cursor-pointer outline-none hover:opacity-70 text-theme-color"
              >
                <Info className="w-4 h-4" /> Group Info
              </DropdownMenu.Item>
              {isAdmin && (
                <DropdownMenu.Item
                  onClick={() => onAddMembers(group)}
                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg cursor-pointer outline-none hover:opacity-70 text-theme-color"
                >
                  <UserPlus className="w-4 h-4" /> Add Members
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Separator
                className="h-px my-1"
                style={
                  {
                    backgroundColor: 'var(--border-color)',
                  } as React.CSSProperties
                }
              />
              <DropdownMenu.Item
                onClick={handleLeaveGroup}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg cursor-pointer outline-none text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4" /> Leave Group
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px] mb-4">
              <div
                className="w-full h-full rounded-full flex items-center justify-center bg-theme-background"
              >
                <Users
                  className="w-10 h-10 text-theme-color"
                />
              </div>
            </div>
            <p
              className="font-semibold text-theme-color"
            >
              {group.name}
            </p>
            <p
              className="text-sm mt-1 text-theme-color-50"
            >
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const senderId =
              typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
            const senderUsername =
              typeof msg.sender === 'object'
                ? msg.sender.username
                : 'Unknown';
            const isSender = senderId === currentUserId;

            if (msg.messageType === 'system') {
              return (
                <div key={msg._id} className="flex justify-center my-3">
                  <p
                    className="text-xs px-3 py-1 rounded-full"
                    style={
                      {
                        backgroundColor: 'var(--hover-bg)',
                        color: 'var(--text-color)',
                        opacity: 0.7,
                      } as React.CSSProperties
                    }
                  >
                    {msg.content}
                  </p>
                </div>
              );
            }

            return (
              <div
                key={msg._id}
                className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-2`}
              >
                <div
                  className={`flex ${isSender ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[75%]`}
                >
                  {!isSender && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[1px] flex-shrink-0">
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center bg-theme-background"
                      >
                        <span
                          className="text-xs font-semibold text-theme-color"
                        >
                          {senderUsername.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    {!isSender && (
                      <p
                        className="text-xs mb-1 ml-1 text-theme-color-60"
                      >
                        {senderUsername}
                      </p>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isSender
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md'
                          : 'rounded-bl-md'
                      }`}
                      style={
                        !isSender
                          ? ({
                              backgroundColor: 'var(--hover-bg)',
                              color: 'var(--text-color)',
                            } as React.CSSProperties)
                          : undefined
                      }
                    >
                      {msg.mediaUrl && (
                        <img
                          src={msg.mediaUrl}
                          alt="Media"
                          className="max-w-full rounded-lg mb-2 max-h-[200px]"
                        />
                      )}
                      {msg.content && (
                        <p className="text-sm break-words">{msg.content}</p>
                      )}
                    </div>
                    <p
                      className={`text-[10px] mt-1 ${isSender ? 'text-right mr-1' : 'ml-1'}`}
                      style={
                        {
                          color: 'var(--text-color)',
                          opacity: 0.4,
                        } as React.CSSProperties
                      }
                    >
                      {new Date(
                        msg.timestamp || msg.createdAt || ''
                      ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 border-t border-theme-color"
      >
        <MessageInput onSend={handleSendMessage} />
      </div>

      {/* Group Info Modal */}
      {showGroupInfo && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowGroupInfo(false)}
        >
          <div
            className="w-full max-w-md max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden bg-theme-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-6 text-center border-b border-theme-color"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[3px] mb-4">
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
                      className="w-12 h-12 text-theme-color"
                    />
                  </div>
                )}
              </div>
              <h3
                className="text-xl font-bold text-theme-color"
              >
                {group.name}
              </h3>
              <p
                className="text-sm mt-1 text-theme-color-50"
              >
                Group · {group.members?.length || 0} members
              </p>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              <p
                className="px-4 py-2 text-sm font-semibold text-theme-color-70"
              >
                Members
              </p>
              {group.members?.map((member) => {
                const memberData = (member as any).userId || member;
                const memberId =
                  typeof memberData === 'string'
                    ? memberData
                    : memberData._id;
                const username = memberData.username || 'Unknown';
                const isCreator =
                  group.creator === memberId ||
                  (typeof group.creator === 'object' &&
                    (group.creator as { _id: string })._id === memberId);
                const isMemberAdmin = group.admins?.some(
                  (a) =>
                    (typeof a === 'string' ? a : a._id) === memberId
                );

                return (
                  <div
                    key={memberId}
                    className="flex items-center gap-3 px-4 py-3 hover:opacity-80"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
                      {memberData.profilePicture ? (
                        <img
                          src={memberData.profilePicture}
                          alt={username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full rounded-full flex items-center justify-center bg-theme-background"
                        >
                          <span
                            className="font-semibold text-theme-color"
                          >
                            {username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className="font-semibold text-sm text-theme-color"
                      >
                        {username}
                        {memberId === currentUserId && ' (You)'}
                      </p>
                      {memberData.name && (
                        <p
                          className="text-xs text-theme-color-50"
                        >
                          {memberData.name}
                        </p>
                      )}
                    </div>
                    {(isCreator || isMemberAdmin) && (
                      <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        <Crown className="w-3 h-3" />
                        {isCreator ? 'Creator' : 'Admin'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              className="p-4 border-t border-theme-color"
            >
              <button
                onClick={() => setShowGroupInfo(false)}
                className="w-full py-3 rounded-xl font-semibold"
                style={
                  {
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-color)',
                  } as React.CSSProperties
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChatView;
