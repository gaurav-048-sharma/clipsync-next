'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FaArrowLeft, FaArchive, FaHeart, FaComment, FaPlay } from 'react-icons/fa';

interface MediaItem {
  url: string;
  type?: string;
}

interface ArchivedPost {
  _id: string;
  media?: MediaItem[];
  videoUrl?: string;
  caption?: string;
  likes?: number;
  comments?: number;
  archivedAt?: string;
}

const ArchivedPosts = () => {
  const router = useRouter();
  const [archivedPosts, setArchivedPosts] = useState<ArchivedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    fetchArchivedPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchArchivedPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/activity/archived', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setArchivedPosts(response.data.archivedPosts || []);
    } catch (err) {
      console.error('Failed to fetch archived posts:', err);
      setError('Failed to load archived posts');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (postId: string) => {
    try {
      await axios.delete(`/api/activity/archive/${postId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setArchivedPosts((prev) => prev.filter((post) => post._id !== postId));
    } catch (err) {
      console.error('Failed to unarchive post:', err);
    }
  };

  const getMediaUrl = (post: ArchivedPost): string | undefined => {
    if (post.media && post.media.length > 0) return post.media[0].url;
    return post.videoUrl;
  };

  const isVideo = (post: ArchivedPost): boolean => {
    if (post.media && post.media.length > 0) return post.media[0].type === 'video';
    return !!post.videoUrl;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-theme-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4 border-b bg-theme-background border-theme-color">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <FaArrowLeft className="w-5 h-5 text-theme-color" />
        </button>
        <h1 className="text-xl font-semibold text-theme-color">Archive</h1>
      </div>

      {/* Info Banner */}
      <div className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <p className="text-sm text-theme-color">
          <span className="font-medium">Only you can see archived posts.</span> They&apos;re hidden from your profile but not deleted.
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : archivedPosts.length === 0 ? (
          <div className="text-center py-12">
            <FaArchive className="w-16 h-16 mx-auto mb-4 opacity-30 text-theme-color" />
            <h2 className="text-xl font-semibold mb-2 text-theme-color">No Archived Posts</h2>
            <p className="opacity-50 text-theme-color">Posts you archive will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {archivedPosts.map((post) => (
              <div key={post._id} className="relative aspect-square group cursor-pointer">
                {isVideo(post) ? (
                  <>
                    <video src={getMediaUrl(post)} className="w-full h-full object-cover" muted />
                    <FaPlay className="absolute top-2 right-2 text-white drop-shadow-lg" />
                  </>
                ) : (
                  <img src={getMediaUrl(post)} alt={post.caption || 'Archived post'} className="w-full h-full object-cover" />
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-white">
                      <FaHeart className="w-5 h-5" />
                      <span className="font-semibold">{post.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white">
                      <FaComment className="w-5 h-5" />
                      <span className="font-semibold">{post.comments || 0}</span>
                    </div>
                  </div>

                  {/* Unarchive button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnarchive(post._id);
                    }}
                    className="mt-2 px-4 py-2 bg-white text-black rounded-full text-sm font-medium flex items-center gap-2 hover:bg-gray-200 transition-colors"
                  >
                    Unarchive
                  </button>
                </div>

                {/* Archive date */}
                {post.archivedAt && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-white text-xs opacity-80">Archived {formatDate(post.archivedAt)}</p>
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

export default ArchivedPosts;
