'use client';

interface TypingIndicatorProps {
  username?: string;
}

const TypingIndicator = ({ username }: TypingIndicatorProps) => {
  return (
    <div className="flex items-end gap-2 mb-2">
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[1px] flex-shrink-0">
        <div
          className="w-full h-full rounded-full flex items-center justify-center bg-theme-background"
        >
          <span
            className="text-[10px] sm:text-xs font-semibold text-theme-color"
          >
            {username?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      </div>

      <div
        className="rounded-[20px] px-5 py-3 border border-theme-color bg-message"
      >
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
          />
          <div
            className="w-2 h-2 rounded-full bg-gray-500 animate-bounce [animation-delay:150ms]"
          />
          <div
            className="w-2 h-2 rounded-full bg-gray-500 animate-bounce [animation-delay:300ms]"
          />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
