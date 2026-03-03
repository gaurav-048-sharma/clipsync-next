'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReelPlayer from './ReelPlayer';
import ReelComments from './ReelComments';
import type { ReelData, ReelComment } from './ReelPlayer';

const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

/** Normalize the API response shape into a flat ReelData format */
function normalizeReel(raw: any): ReelData {
  const userId = raw.userId || {};
  const authId = userId.authId || {};
  return {
    _id: raw._id,
    user: {
      _id: userId._id || '',
      username: authId.username || userId.username || '',
      name: authId.name || userId.name || '',
      profilePicture: userId.profilePicture || '',
    },
    media: raw.media || (raw.videoUrl ? [{ url: raw.videoUrl, type: 'video' }] : []),
    caption: raw.caption || '',
    likes: raw.likes || [],
    comments: raw.comments || [],
    views: raw.views || 0,
    created_at: raw.created_at,
  };
}

const ReelsFeed = () => {
  const [reels, setReels] = useState<ReelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [commentReel, setCommentReel] = useState<ReelData | null>(null);
  const [currentUserProfileId, setCurrentUserProfileId] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const reelRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Fetch current user data to get liked/saved arrays
  useEffect(() => {
    const fetchUserData = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await axios.get('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
        const profile = res.data;
        setCurrentUserProfileId(profile._id);
        if (profile.likedReels) {
          setLikedReels(new Set(profile.likedReels.map((id: any) => id.toString())));
        }
        if (profile.savedPosts) {
          setSavedReels(new Set(profile.savedPosts.map((id: any) => id.toString())));
        }
      } catch {
        // Not logged in or error
      }
    };
    fetchUserData();
  }, []);

  // Fetch reels paginated
  const fetchReels = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await axios.get(`/api/reels?page=${pageRef.current}&limit=5`, { headers });
      const rawPosts = res.data.posts || res.data.reels || (Array.isArray(res.data) ? res.data : []);
      const pagination = res.data.pagination;

      if (rawPosts.length === 0) {
        setHasMore(false);
      } else {
        // Filter to video reels only
        const videoReels = rawPosts
          .map(normalizeReel)
          .filter((r: ReelData) => r.media.some((m) => m.type === 'video'));

        setReels((prev) => {
          const existingIds = new Set(prev.map((r) => r._id));
          const newReels = videoReels.filter((r: ReelData) => !existingIds.has(r._id));
          return [...prev, ...newReels];
        });
        pageRef.current += 1;

        if (pagination && pageRef.current > pagination.pages) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Error fetching reels:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [hasMore]);

  // Initial load
  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  // IntersectionObserver for detecting active reel + infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const reelId = entry.target.getAttribute('data-reel-id');
            if (reelId) {
              const idx = reels.findIndex((r) => r._id === reelId);
              if (idx !== -1) setActiveIndex(idx);

              // Trigger load more when near the end
              if (idx >= reels.length - 2) fetchReels();
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    reelRefs.current.forEach((el) => {
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [reels, fetchReels]);

  // Handle like
  const handleLike = useCallback(async (reelId: string) => {
    const token = getToken();
    if (!token) return;

    const wasLiked = likedReels.has(reelId);
    // Optimistic update
    setLikedReels((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(reelId); else next.add(reelId);
      return next;
    });
    setReels((prev) =>
      prev.map((reel) => {
        if (reel._id === reelId) {
          return {
            ...reel,
            likes: wasLiked
              ? reel.likes.filter((l) => l._id !== currentUserProfileId)
              : [...reel.likes, { _id: currentUserProfileId }],
          };
        }
        return reel;
      })
    );

    try {
      await axios.post(`/api/reels/${reelId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      // Revert on error
      setLikedReels((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(reelId); else next.delete(reelId);
        return next;
      });
    }
  }, [likedReels, currentUserProfileId]);

  // Handle save
  const handleSave = useCallback(async (reelId: string) => {
    const token = getToken();
    if (!token) return;

    const wasSaved = savedReels.has(reelId);
    setSavedReels((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(reelId); else next.add(reelId);
      return next;
    });

    try {
      await axios.post(`/api/reels/${reelId}/save`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      setSavedReels((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(reelId); else next.delete(reelId);
        return next;
      });
    }
  }, [savedReels]);

  // Handle share
  const handleShare = useCallback(async (reel: ReelData) => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: reel.caption || 'Check out this reel!',
          url: `${window.location.origin}/reels/${reel._id}`,
        });
      } catch {}
    } else {
      // Fallback: copy link
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/reels/${reel._id}`);
      } catch {}
    }
  }, []);

  // Handle view
  const handleView = useCallback((reelId: string) => {
    const token = getToken();
    if (!token) return;
    axios.post(`/api/reels/${reelId}/view`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  }, []);

  // Handle comment added
  const handleCommentAdded = useCallback((reelId: string, _comment: ReelComment) => {
    setReels((prev) =>
      prev.map((reel) =>
        reel._id === reelId
          ? { ...reel, comments: [...reel.comments, _comment] }
          : reel
      )
    );
  }, []);

  // Open comments
  const handleOpenComments = useCallback((reel: ReelData) => {
    setCommentReel(reel);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return (
    <div className="reel-feed-container">
      <div ref={containerRef} className="reel-feed-scroll">
        {reels.map((reel, index) => (
          <div
            key={reel._id}
            className="reel-feed-item"
            data-reel-id={reel._id}
            ref={(el) => {
              if (el) reelRefs.current.set(reel._id, el);
              else reelRefs.current.delete(reel._id);
            }}
          >
            <ReelPlayer
              reel={reel}
              isActive={index === activeIndex}
              isMuted={isMuted}
              isLiked={likedReels.has(reel._id)}
              isSaved={savedReels.has(reel._id)}
              onToggleMute={toggleMute}
              onLike={handleLike}
              onSave={handleSave}
              onShare={handleShare}
              onOpenComments={handleOpenComments}
              onView={handleView}
            />
          </div>
        ))}

        {loading && (
          <div className="reel-feed-loading">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        )}

        {!loading && reels.length === 0 && (
          <div className="reel-feed-empty">
            <p className="text-gray-400 text-lg">No reels yet</p>
            <p className="text-gray-500 text-sm mt-2">Be the first to upload a reel!</p>
          </div>
        )}
      </div>

      {/* Comment overlay */}
      {commentReel && (
        <ReelComments
          reel={commentReel}
          isOpen={!!commentReel}
          onClose={() => setCommentReel(null)}
          currentUserProfileId={currentUserProfileId}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  );
};

export default ReelsFeed;
