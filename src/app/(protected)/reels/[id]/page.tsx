'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import ReelPlayer from '@/components/Reels/ReelPlayer';
import ReelComments from '@/components/Reels/ReelComments';
import type { ReelData, ReelComment } from '@/components/Reels/ReelPlayer';
import { FaArrowLeft } from 'react-icons/fa';

const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

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

export default function SingleReelPage() {
  const params = useParams();
  const router = useRouter();
  const reelId = params.id as string;

  const [reel, setReel] = useState<ReelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [currentUserProfileId, setCurrentUserProfileId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const [reelRes, userRes] = await Promise.all([
          axios.get(`/api/reels/${reelId}`, { headers }),
          token ? axios.get('/api/users/me', { headers }).catch(() => null) : Promise.resolve(null),
        ]);

        const normalized = normalizeReel(reelRes.data);
        setReel(normalized);

        if (userRes?.data) {
          const profile = userRes.data;
          setCurrentUserProfileId(profile._id);
          setIsLiked(profile.likedReels?.some((id: any) => id.toString() === reelId) || false);
          setIsSaved(profile.savedPosts?.some((id: any) => id.toString() === reelId) || false);
        }
      } catch {
        setError('Reel not found');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reelId]);

  const handleLike = useCallback(async () => {
    const token = getToken();
    if (!token || !reel) return;
    setIsLiked((prev) => !prev);
    setReel((prev) =>
      prev ? {
        ...prev,
        likes: isLiked
          ? prev.likes.filter((l) => l._id !== currentUserProfileId)
          : [...prev.likes, { _id: currentUserProfileId }],
      } : prev
    );
    try {
      await axios.post(`/api/reels/${reelId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      setIsLiked((prev) => !prev);
    }
  }, [reelId, isLiked, currentUserProfileId, reel]);

  const handleSave = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setIsSaved((prev) => !prev);
    try {
      await axios.post(`/api/reels/${reelId}/save`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      setIsSaved((prev) => !prev);
    }
  }, [reelId]);

  const handleShare = useCallback(async () => {
    if (!reel) return;
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: reel.caption || 'Check out this reel!', url: window.location.href });
      } catch {}
    } else {
      try { await navigator.clipboard.writeText(window.location.href); } catch {}
    }
  }, [reel]);

  const handleView = useCallback(() => {
    const token = getToken();
    if (!token) return;
    axios.post(`/api/reels/${reelId}/view`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  }, [reelId]);

  const handleCommentAdded = useCallback((_reelId: string, comment: ReelComment) => {
    setReel((prev) => prev ? { ...prev, comments: [...prev.comments, comment] } : prev);
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
      </div>
    );
  }

  if (error || !reel) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <p className="text-lg">{error || 'Reel not found'}</p>
        <button onClick={() => router.push('/reels-feed')} className="text-blue-400 hover:underline">
          Back to Reels
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black relative">
      {/* Back button */}
      <button
        title="Go back"
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-30 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 transition-colors"
      >
        <FaArrowLeft className="text-lg" />
      </button>

      <div className="h-full w-full max-w-lg mx-auto">
        <ReelPlayer
          reel={reel}
          isActive={true}
          isMuted={isMuted}
          isLiked={isLiked}
          isSaved={isSaved}
          onToggleMute={() => setIsMuted(!isMuted)}
          onLike={handleLike}
          onSave={handleSave}
          onShare={() => handleShare()}
          onOpenComments={() => setShowComments(true)}
          onView={handleView}
        />
      </div>

      {showComments && (
        <ReelComments
          reel={reel}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          currentUserProfileId={currentUserProfileId}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  );
}
