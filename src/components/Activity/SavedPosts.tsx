'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FaArrowLeft, FaBookmark, FaHeart, FaComment, FaPlay, FaTrash } from 'react-icons/fa';

interface MediaItem {
  url: string;
  type?: string;
}

interface SavedPost {
  _id: string;
  media?: MediaItem[];
  videoUrl?: string;
  caption?: string;
  likes?: number;
  comments?: number;
  user?: { username: string };
}

const SavedPosts = () => {
  const router = useRouter();
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    fetchSavedPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSavedPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/activity/saved', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSavedPosts(response.data.savedPosts || []);
    } catch (err) {
      console.error('Failed to fetch saved posts:', err);
      setError('Failed to load saved posts');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (postId: string) => {
    try {
      await axios.delete(`/api/activity/save/${postId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSavedPosts((prev) => prev.filter((post) => post._id !== postId));
    } catch (err) {
      console.error('Failed to unsave post:', err);
    }
  };

  const getMediaUrl = (post: SavedPost): string | undefined => {
    if (post.media && post.media.length > 0) return post.media[0].url;
    return post.videoUrl;
  };

  const isVideo = (post: SavedPost): boolean => {
    if (post.media && post.media.length > 0) return post.media[0].type === 'video';
    return !!post.videoUrl;
  };

  return (
    <div className="min-h-screen bg-theme-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4 border-b bg-theme-background border-theme-color">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <FaArrowLeft className="w-5 h-5 text-theme-color" />
        </button>
        <h1 className="text-xl font-semibold text-theme-color">Saved</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : savedPosts.length === 0 ? (
          <div className="text-center py-12">
            <FaBookmark className="w-16 h-16 mx-auto mb-4 opacity-30 text-theme-color" />
            <h2 className="text-xl font-semibold mb-2 text-theme-color">No Saved Posts</h2>
            <p className="opacity-50 text-theme-color">Posts you save will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {savedPosts.map((post) => (
              <div key={post._id} className="relative aspect-square group cursor-pointer" onClick={() => router.push(`/post/${post._id}`)}>
                {isVideo(post) ? (
                  <>
                    <video src={getMediaUrl(post)} className="w-full h-full object-cover" muted />
                    <FaPlay className="absolute top-2 right-2 text-white drop-shadow-lg" />
                  </>
                ) : (
                  <img src={getMediaUrl(post)} alt={post.caption || 'Saved post'} className="w-full h-full object-cover" />
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1 text-white">
                    <FaHeart className="w-5 h-5" />
                    <span className="font-semibold">{post.likes || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <FaComment className="w-5 h-5" />
                    <span className="font-semibold">{post.comments || 0}</span>
                  </div>
                </div>

                {/* Unsave button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnsave(post._id);
                  }}
                  className="absolute top-2 left-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <FaTrash className="w-3 h-3 text-white" />
                </button>

                {/* User info */}
                {post.user?.username && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium truncate">@{post.user.username}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPosts;
