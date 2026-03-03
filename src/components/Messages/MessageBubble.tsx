'use client';

import { useState } from 'react';
import { MoreVertical, X } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface MessageData {
  _id: string;
  content: string;
  timestamp?: string;
  sender: { _id: string } | string;
  recipient: { _id: string } | string;
  messageType?: string;
  mediaUrl?: string;
  status?: 'sent' | 'delivered' | 'seen';
  isEdited?: boolean;
  unread?: boolean;
  read?: boolean;
}

interface MessageBubbleProps {
  message: MessageData;
  isSender: boolean;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  recipientUsername?: string;
}

const MessageBubble = ({
  message,
  isSender,
  onEdit,
  onDelete,
  recipientUsername,
}: MessageBubbleProps) => {
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const isImage =
    message.messageType === 'image' ||
    (message.mediaUrl &&
      message.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i));
  const isVideo =
    message.messageType === 'video' ||
    (message.mediaUrl && message.mediaUrl.match(/\.(mp4|webm|mov|avi)$/i));

  const getStatusIcon = (status?: string) => {
    if (!isSender) return null;

    switch (status) {
      case 'sent':
        return (
          <svg
            className="w-4 h-4 inline-block ml-1 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case 'delivered':
        return (
          <svg
            className="w-4 h-4 inline-block ml-1 opacity-70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13l4 4L23 7"
            />
          </svg>
        );
      case 'seen':
        return (
          <svg
            className="w-4 h-4 inline-block ml-1"
            fill="none"
            stroke="#4ade80"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13l4 4L23 7"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <>
      {showMediaModal && message.mediaUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowMediaModal(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setShowMediaModal(false)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {isVideo ? (
            <video
              src={message.mediaUrl}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={message.mediaUrl}
              alt="Media"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      <div
        className={`flex items-end gap-2 mb-2 ${isSender ? 'justify-end' : 'justify-start'}`}
      >
        {!isSender && (
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[1px] flex-shrink-0">
            <div
              className="w-full h-full rounded-full flex items-center justify-center bg-theme-background"
            >
              <span
                className="text-[10px] sm:text-xs font-semibold text-theme-color"
              >
                {recipientUsername?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        )}

        <div
          className={`max-w-[75%] sm:max-w-[70%] md:max-w-[60%] rounded-[20px] sm:rounded-[22px] px-3 sm:px-4 py-2 sm:py-2.5 relative group cursor-pointer overflow-hidden ${
            isSender ? 'bg-[#3797f0]' : ''
          } ${message.unread && !isSender ? 'ring-2 ring-blue-500 ring-offset-2 animate-pulse' : ''}`}
          style={
            isSender
              ? ({ color: '#ffffff' } as React.CSSProperties)
              : ({
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--message-bg)',
                  color: 'var(--text-color)',
                } as React.CSSProperties)
          }
          onClick={() => !message.mediaUrl && setShowTimestamp(!showTimestamp)}
        >
          {message.mediaUrl && (isImage || isVideo) ? (
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowMediaModal(true);
              }}
            >
              {isVideo ? (
                <div className="relative">
                  <video
                    src={message.mediaUrl}
                    className="max-w-[200px] sm:max-w-[280px] max-h-[200px] rounded-lg object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                    <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-gray-800 ml-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={message.mediaUrl}
                  alt="Shared image"
                  className="max-w-[200px] sm:max-w-[280px] max-h-[200px] rounded-lg object-cover hover:opacity-90 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              {message.content &&
                message.content !== '📷 Image' &&
                message.content !== '🎥 Video' && (
                  <p className="text-[14px] mt-2">{message.content}</p>
                )}
            </div>
          ) : (
            <div className="flex items-end gap-1 min-w-0">
              <p
                className="text-[15px] leading-snug flex-1"
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                }}
              >
                {message.content}
                {message.isEdited && (
                  <span className="text-xs ml-2 opacity-50">
                    (edited)
                  </span>
                )}
              </p>
              {getStatusIcon(message.status)}
            </div>
          )}

          {showTimestamp && message.timestamp && (
            <div className="text-[10px] mt-1 opacity-60">
              {formatTimestamp(message.timestamp)}
            </div>
          )}

          {isSender && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="opacity-0 group-hover:opacity-100 absolute -top-3 right-2 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all">
                  <MoreVertical
                    className="h-4 w-4"
                    style={
                      {
                        color: isSender ? '#ffffff' : 'var(--text-color)',
                      } as React.CSSProperties
                    }
                  />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="rounded-xl shadow-2xl p-1 min-w-[140px] border z-50 bg-theme-background border-theme-color"
                  sideOffset={5}
                >
                  <DropdownMenu.Item
                    onClick={() => onEdit(message._id, message.content)}
                    className="text-sm px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-800 text-theme-color"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Edit message
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => {
                      if (window.confirm('Delete this message?')) {
                        onDelete(message._id);
                      }
                    }}
                    className="text-sm px-3 py-2 rounded-lg cursor-pointer text-red-500 outline-none hover:bg-red-50 dark:hover:bg-red-900/20"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Delete message
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageBubble;
