'use client';

interface ConversationData {
  userId: string;
  username: string;
  profilePicture?: string;
  isOnline?: boolean;
  lastSeen?: string;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    timestamp: string;
  };
}

interface ConversationItemProps {
  conversation: ConversationData;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem = ({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) => {
  const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
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

  const hasUnread = (conversation.unreadCount || 0) > 0;

  return (
    <div
      className={`flex items-center gap-3 px-4 sm:px-6 py-2.5 sm:py-2 cursor-pointer transition-all active:bg-gray-100 dark:active:bg-gray-800 ${
        isSelected
          ? 'bg-gray-100 dark:bg-gray-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-900'
      }`}
      onClick={onClick}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[2px]">
          <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
            {conversation.profilePicture ? (
              <img
                src={conversation.profilePicture}
                alt={conversation.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span
                className="text-lg sm:text-xl font-semibold text-theme-color"
              >
                {conversation.username?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        {conversation.isOnline && (
          <div
            className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2"
            style={
              { borderColor: 'var(--background-color)' } as React.CSSProperties
            }
          />
        )}
      </div>

      <div
        className="flex-1 min-w-0 py-2.5 sm:py-3 border-b border-theme-color"
      >
        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-sm truncate text-theme-color ${hasUnread ? 'font-bold' : 'font-semibold'}`}
          >
            {conversation.username}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasUnread && (
              <div className="w-2 h-2 bg-[#0095f6] rounded-full" />
            )}
            <span
              className="text-[10px] sm:text-xs ml-2 text-theme-color-50"
            >
              {formatTimestamp(conversation.lastMessage?.timestamp)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5 sm:mt-1">
          <p
            className={`text-xs sm:text-sm truncate ${hasUnread ? 'font-semibold' : ''}`}
            style={
              {
                color: 'var(--text-color)',
                opacity: hasUnread ? 0.9 : 0.5,
              } as React.CSSProperties
            }
          >
            {conversation.lastMessage?.content || 'No messages yet'}
          </p>
          {hasUnread && (
            <div className="flex-shrink-0 min-w-[20px] h-5 bg-[#0095f6] text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
              {conversation.unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
