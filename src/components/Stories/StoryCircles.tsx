'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import StoryViewer from './StoryViewer';

interface StoryItem {
  _id: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  thumbnail?: string;
  caption?: string;
  views: number;
  likes: number;
  hasViewed: boolean;
  hasLiked: boolean;
  createdAt: string;
  expiresAt: string;
}

interface UserStoryGroup {
  userId: string;
  username: string;
  name?: string;
  profilePicture: string;
  hasUnviewed: boolean;
  stories: StoryItem[];
}

const StoryCircles = () => {
  const [stories, setStories] = useState<UserStoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const router = useRouter();

  useEffect(() => {
    fetchCurrentUser();
    fetchStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/users/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserId(response.data._id);
    } catch {
      // handled by global interceptor
    }
  };

  const fetchStories = async () => {
    try {
      const response = await axios.get('/api/stories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStories(response.data.stories || []);
    } catch {
      // handled by global interceptor
    } finally {
      setLoading(false);
    }
  };

  const openStoryViewer = (index: number) => {
    setSelectedStoryIndex(index);
  };

  const closeStoryViewer = () => {
    setSelectedStoryIndex(null);
    fetchStories();
  };

  const hasValidPic = (url?: string) =>
    url && url !== '/default-avatar.svg' && url.startsWith('http');

  const renderAvatar = (url: string | undefined, letter: string, size: string) => {
    if (hasValidPic(url)) {
      return (
        <img
          src={url}
          alt=""
          className={`${size} rounded-full object-cover border-[2.5px] border-white dark:border-gray-900`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/default-avatar.svg';
          }}
        />
      );
    }
    return (
      <div
        className={`${size} rounded-full border-[2.5px] border-white dark:border-gray-900 flex items-center justify-center story-avatar-fallback`}
      >
        <span className="text-base sm:text-lg font-bold text-white">{letter}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 overflow-x-auto scrollbar-hide">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 animate-pulse flex-shrink-0">
            <div className="w-[66px] h-[66px] sm:w-[74px] sm:h-[74px] rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Separate current user's story
  const myStory = stories.find((s) => s.userId === currentUserId);
  const myStoryIndex = stories.findIndex((s) => s.userId === currentUserId);
  const otherStories = stories.filter((s) => s.userId !== currentUserId);

  return (
    <>
      <div className="border-b border-gray-200 dark:border-gray-800 pb-3 sm:pb-4 mb-3 sm:mb-4">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-3 sm:px-4 py-1"
        >
          {/* ── Add Story / Your Story ── */}
          <div
            className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group"
            onClick={() => (myStory ? openStoryViewer(myStoryIndex) : router.push('/upload-story'))}
          >
            <div className="relative">
              {myStory ? (
                /* Has story — show with ring */
                <div
                  className={`w-[66px] h-[66px] sm:w-[74px] sm:h-[74px] rounded-full p-[3px] transition-transform group-active:scale-95 ${
                    myStory.hasUnviewed
                      ? 'story-ring-gradient'
                      : 'story-ring-seen'
                  }`}
                >
                  {renderAvatar(
                    myStory.profilePicture,
                    myStory.username?.charAt(0)?.toUpperCase() || 'Y',
                    'w-full h-full'
                  )}
                </div>
              ) : (
                /* No story — show add button */
                <div className="w-[66px] h-[66px] sm:w-[74px] sm:h-[74px] rounded-full story-add-button flex items-center justify-center transition-transform group-active:scale-95">
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )}
              {/* Plus badge on your story pic */}
              {myStory && (
                <button
                  aria-label="Add story"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/upload-story');
                  }}
                  className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-md hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 truncate max-w-[66px] sm:max-w-[74px] text-center">
              {myStory ? 'Your story' : 'Add Story'}
            </span>
          </div>

          {/* ── Other Users' Stories ── */}
          {otherStories.map((userStory) => {
            const index = stories.findIndex((s) => s.userId === userStory.userId);
            return (
              <div
                key={userStory.userId}
                className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group"
                onClick={() => openStoryViewer(index)}
              >
                <div
                  className={`w-[66px] h-[66px] sm:w-[74px] sm:h-[74px] rounded-full p-[3px] transition-transform group-active:scale-95 ${
                    userStory.hasUnviewed
                      ? 'story-ring-gradient'
                      : 'story-ring-seen'
                  }`}
                >
                  {renderAvatar(
                    userStory.profilePicture,
                    userStory.username?.charAt(0)?.toUpperCase() || 'U',
                    'w-full h-full'
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-medium truncate max-w-[66px] sm:max-w-[74px] text-center">
                  {userStory.username}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {selectedStoryIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={selectedStoryIndex}
          currentUserId={currentUserId}
          onClose={closeStoryViewer}
        />
      )}
    </>
  );
};

export default StoryCircles;
