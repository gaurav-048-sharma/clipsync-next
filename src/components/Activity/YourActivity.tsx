'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  FaArrowLeft, FaHeart, FaComment, FaBookmark, FaUserPlus,
  FaPlay, FaRegImage, FaFilter, FaHistory, FaTrash
} from 'react-icons/fa';

interface MediaItem {
  url: string;
  type?: string;
}

interface PostData {
  _id: string;
  media?: MediaItem | MediaItem[];
  videoUrl?: string;
  caption?: string;
  likes?: number;
  comments?: number;
  user?: { username: string };
  myComments?: { text: string }[];
}

interface InteractionsData {
  stats?: {
    likesGiven: number;
    commentsGiven: number;
    savedCount: number;
  };
  likedPosts?: PostData[];
  commentedPosts?: PostData[];
}

interface ActivityItem {
  _id: string;
  action: string;
  targetType: string;
  timestamp: string;
  targetDetails?: {
    username?: string;
    caption?: string;
    media?: { url: string; type?: string };
  };
}

const YourActivity = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('interactions');
  const [filter, setFilter] = useState('all');
  const [interactions, setInteractions] = useState<InteractionsData | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (activeTab === 'interactions') {
      fetchInteractions();
    } else {
      fetchActivityLog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filter]);

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/activity/interactions', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setInteractions(response.data);
    } catch (err) {
      console.error('Failed to fetch interactions:', err);
      setError('Failed to load interactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLog = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/activity/log', {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { filter: filter !== 'all' ? filter : undefined },
      });
      setActivityLog(response.data.activities || []);
    } catch (err) {
      console.error('Failed to fetch activity log:', err);
      setError('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  const clearActivityLog = async () => {
    if (!confirm('Are you sure you want to clear your activity log?')) return;
    try {
      await axios.delete('/api/activity/log', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setActivityLog([]);
    } catch (err) {
      console.error('Failed to clear activity log:', err);
    }
  };

  const getMediaUrl = (post: PostData): string | undefined => {
    if (post.media && !Array.isArray(post.media) && post.media.url) {
      return post.media.url;
    }
    if (Array.isArray(post.media) && post.media.length > 0) {
      return post.media[0].url;
    }
    return post.videoUrl;
  };

  const isVideo = (post: PostData): boolean => {
    if (post.media && !Array.isArray(post.media) && post.media.type) {
      return post.media.type === 'video';
    }
    if (Array.isArray(post.media) && post.media.length > 0) {
      return post.media[0].type === 'video';
    }
    return !!post.videoUrl;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'like': return <FaHeart className="text-red-500" />;
      case 'comment': return <FaComment className="text-blue-500" />;
      case 'save': return <FaBookmark className="text-yellow-500" />;
      case 'follow': return <FaUserPlus className="text-green-500" />;
      case 'unfollow': return <FaUserPlus className="text-gray-500" />;
      case 'post': return <FaRegImage className="text-purple-500" />;
      case 'archive': return <FaHistory className="text-orange-500" />;
      default: return <FaHistory className="text-gray-500" />;
    }
  };

  const getActionText = (action: string, targetType: string): string => {
    switch (action) {
      case 'like': return `Liked a ${targetType}`;
      case 'comment': return `Commented on a ${targetType}`;
      case 'save': return `Saved a ${targetType}`;
      case 'follow': return 'Started following';
      case 'unfollow': return 'Unfollowed';
      case 'post': return 'Posted a new';
      case 'archive': return 'Archived a';
      case 'unarchive': return 'Unarchived a';
      default: return action;
    }
  };

  const tabs = [
    { id: 'interactions', label: 'Interactions' },
    { id: 'activity', label: 'Activity Log' },
  ];

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'like', label: 'Likes' },
    { id: 'comment', label: 'Comments' },
    { id: 'save', label: 'Saves' },
    { id: 'follow', label: 'Follows' },
  ];

  return (
    <div className="min-h-screen bg-theme-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b theme-header">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <FaArrowLeft className="w-5 h-5 text-theme-color" />
          </button>
          <h1 className="text-xl font-semibold text-theme-color">Your Activity</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-theme-color">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id ? 'text-purple-500' : 'text-theme-color'}`}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : activeTab === 'interactions' ? (
          <div className="space-y-6">
            {interactions?.stats && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 text-center">
                  <FaHeart className="w-6 h-6 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold text-theme-color">{interactions.stats.likesGiven}</p>
                  <p className="text-xs opacity-50 text-theme-color">Likes Given</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 text-center">
                  <FaComment className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-theme-color">{interactions.stats.commentsGiven}</p>
                  <p className="text-xs opacity-50 text-theme-color">Comments</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 text-center">
                  <FaBookmark className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold text-theme-color">{interactions.stats.savedCount}</p>
                  <p className="text-xs opacity-50 text-theme-color">Saved</p>
                </div>
              </div>
            )}

            {interactions?.likedPosts && interactions.likedPosts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-theme-color">
                  <FaHeart className="text-red-500" /> Posts You Liked
                </h3>
                <div className="grid grid-cols-3 gap-1">
                  {interactions.likedPosts.slice(0, 9).map((post) => (
                    <div key={post._id} className="relative aspect-square cursor-pointer group" onClick={() => router.push(`/post/${post._id}`)}>
                      {isVideo(post) ? (
                        <>
                          <video src={getMediaUrl(post)} className="w-full h-full object-cover" muted />
                          <FaPlay className="absolute top-2 right-2 text-white drop-shadow-lg" />
                        </>
                      ) : (
                        <img src={getMediaUrl(post)} alt="" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <FaHeart className="text-white text-xl" />
                      </div>
                    </div>
                  ))}
                </div>
                {interactions.likedPosts.length > 9 && (
                  <button className="w-full mt-2 py-2 text-sm text-purple-500 font-medium">
                    View all {interactions.likedPosts.length} liked posts
                  </button>
                )}
              </div>
            )}

            {interactions?.commentedPosts && interactions.commentedPosts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-theme-color">
                  <FaComment className="text-blue-500" /> Posts You Commented On
                </h3>
                <div className="space-y-3">
                  {interactions.commentedPosts.slice(0, 5).map((post) => (
                    <div key={post._id} className="flex gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => router.push(`/post/${post._id}`)}>
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                        {isVideo(post) ? (
                          <video src={getMediaUrl(post)} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={getMediaUrl(post)} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-theme-color">@{post.user?.username}</p>
                        {post.myComments?.[0] && (
                          <p className="text-sm opacity-70 truncate text-theme-color">
                            Your comment: &quot;{post.myComments[0].text}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!interactions?.likedPosts?.length && !interactions?.commentedPosts?.length && (
              <div className="text-center py-12">
                <FaHistory className="w-16 h-16 mx-auto mb-4 opacity-30 text-theme-color" />
                <h2 className="text-xl font-semibold mb-2 text-theme-color">No Interactions Yet</h2>
                <p className="opacity-50 text-theme-color">Your likes and comments will appear here</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f.id ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-theme-color'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {activityLog.length > 0 ? (
              <div className="space-y-2">
                {activityLog.map((activity) => (
                  <div key={activity._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-theme-color">
                        <span className="font-medium">{getActionText(activity.action, activity.targetType)}</span>
                        {activity.targetDetails && (
                          <span className="opacity-70">
                            {activity.targetType === 'user'
                              ? ` @${activity.targetDetails.username}`
                              : activity.targetType === 'reel' && activity.targetDetails.caption
                                ? ` "${activity.targetDetails.caption.substring(0, 30)}..."`
                                : ''}
                          </span>
                        )}
                      </p>
                      <p className="text-xs opacity-50 text-theme-color">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                    {activity.targetDetails?.media && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        {activity.targetDetails.media.type === 'video' ? (
                          <video src={activity.targetDetails.media.url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={activity.targetDetails.media.url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={clearActivityLog}
                  className="w-full mt-4 py-3 text-red-500 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <FaTrash className="w-4 h-4" />
                  Clear Activity Log
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaHistory className="w-16 h-16 mx-auto mb-4 opacity-30 text-theme-color" />
                <h2 className="text-xl font-semibold mb-2 text-theme-color">No Activity</h2>
                <p className="opacity-50 text-theme-color">Your activity log is empty</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default YourActivity;
