'use client';

import { useRouter } from 'next/navigation';

interface ChatHeaderProps {
  username: string;
  isOnline: boolean;
  lastSeen?: string;
  onBack: () => void;
  onInfoClick: () => void;
}

const ChatHeader = ({
  username,
  isOnline,
  lastSeen,
  onBack,
  onInfoClick,
}: ChatHeaderProps) => {
  const router = useRouter();
  const formatLastSeen = (lastSeenDate: string): string => {
    if (!lastSeenDate) return '';

    const date = new Date(lastSeenDate);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b flex-shrink-0 border-theme-color bg-theme-background"
    >
      <button
        className="md:hidden p-2 -ml-1 hover:opacity-70 active:scale-95 transition-all"
        onClick={onBack}
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-theme-color"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <div className="relative">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[2px] flex-shrink-0">
          <div
            className="w-full h-full rounded-full flex items-center justify-center bg-theme-background"
          >
            <span
              className="text-base sm:text-lg font-semibold text-theme-color"
            >
              {username?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        {isOnline && (
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2"
            style={{ borderColor: 'var(--background-color)' } as React.CSSProperties}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h2
          className="font-semibold text-sm sm:text-base truncate cursor-pointer hover:underline text-theme-color"
          onClick={() => router.push(`/user/${username}`)}
        >
          {username}
        </h2>
        {isOnline ? (
          <p
            className="text-xs text-theme-color-50"
          >
            Active now
          </p>
        ) : lastSeen ? (
          <p
            className="text-xs text-theme-color-50"
          >
            Active {formatLastSeen(lastSeen)}
          </p>
        ) : null}
      </div>

      <button
        className="p-2 hover:opacity-70 active:scale-95 transition-all"
        onClick={onInfoClick}
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-theme-color"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </div>
  );
};

export default ChatHeader;
