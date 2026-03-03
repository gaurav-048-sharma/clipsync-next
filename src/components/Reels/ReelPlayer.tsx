'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FaHeart, FaRegHeart, FaComment, FaShare, FaBookmark, FaRegBookmark,
  FaVolumeMute, FaVolumeUp, FaPlay, FaPause
} from 'react-icons/fa';

export interface ReelUser {
  _id: string;
  username: string;
  name: string;
  profilePicture: string;
}

export interface ReelComment {
  _id: string;
  userId: {
    _id: string;
    authId: { _id: string; username: string; name: string };
    profilePicture: string;
  };
  text: string;
  likes: string[];
  replies: ReelReply[];
  created_at: string;
  updated_at: string;
}

export interface ReelReply {
  _id: string;
  userId: {
    _id: string;
    authId: { _id: string; username: string; name: string };
    profilePicture: string;
  };
  text: string;
  likes: string[];
  created_at: string;
  updated_at: string;
}

export interface ReelData {
  _id: string;
  user: ReelUser;
  media: { url: string; type: string }[];
  caption: string;
  likes: { _id: string }[];
  comments: ReelComment[];
  views: number;
  created_at: string;
}

interface ReelPlayerProps {
  reel: ReelData;
  isActive: boolean;
  isMuted: boolean;
  isLiked: boolean;
  isSaved: boolean;
  onToggleMute: () => void;
  onLike: (reelId: string) => void;
  onSave: (reelId: string) => void;
  onShare: (reel: ReelData) => void;
  onOpenComments: (reel: ReelData) => void;
  onView: (reelId: string) => void;
}

const ReelPlayer = ({
  reel,
  isActive,
  isMuted,
  isLiked,
  isSaved,
  onToggleMute,
  onLike,
  onSave,
  onShare,
  onOpenComments,
  onView,
}: ReelPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const playPauseTimeout = useRef<NodeJS.Timeout | null>(null);
  const viewRecorded = useRef(false);
  const doubleTapTimeout = useRef<NodeJS.Timeout | null>(null);
  const tapCount = useRef(0);

  // Play/pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      if (!viewRecorded.current) {
        viewRecorded.current = true;
        onView(reel._id);
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, reel._id, onView]);

  // Mute sync
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // Progress bar
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration && progressRef.current) {
        const pct = (video.currentTime / video.duration) * 100;
        progressRef.current.style.width = `${pct}%`;
      }
    };
    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, []);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }

    setShowPlayPause(true);
    if (playPauseTimeout.current) clearTimeout(playPauseTimeout.current);
    playPauseTimeout.current = setTimeout(() => setShowPlayPause(false), 800);
  }, []);

  const handleTap = useCallback(() => {
    tapCount.current += 1;
    if (tapCount.current === 1) {
      doubleTapTimeout.current = setTimeout(() => {
        // Single tap → toggle play/pause
        if (tapCount.current === 1) {
          togglePlayPause();
        }
        tapCount.current = 0;
      }, 250);
    } else if (tapCount.current === 2) {
      // Double tap → like
      if (doubleTapTimeout.current) clearTimeout(doubleTapTimeout.current);
      tapCount.current = 0;
      if (!isLiked) {
        onLike(reel._id);
      }
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 1000);
    }
  }, [togglePlayPause, isLiked, onLike, reel._id]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  return (
    <div className="reel-player-container">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.media?.[0]?.url}
        className="reel-video"
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        onClick={handleTap}
      />

      {/* Play/Pause indicator overlay */}
      {showPlayPause && (
        <div className="reel-play-indicator" onClick={handleTap}>
          {isPlaying ? (
            <FaPause className="reel-play-icon" />
          ) : (
            <FaPlay className="reel-play-icon reel-play-icon-shifted" />
          )}
        </div>
      )}

      {/* Double-tap like animation */}
      {likeAnimation && (
        <div className="reel-like-animation">
          <FaHeart className="reel-like-heart" />
        </div>
      )}

      {/* Top gradient */}
      <div className="reel-gradient-top" />

      {/* Bottom gradient */}
      <div className="reel-gradient-bottom" />

      {/* User info + caption (bottom left) */}
      <div className="reel-info-overlay">
        <div className="flex items-center gap-3 mb-2">
          <Link href={`/user/${reel.user.username}`}>
            <img
              src={reel.user.profilePicture || '/default-avatar.svg'}
              alt={reel.user.username}
              className="reel-avatar"
              onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.svg'; }}
            />
          </Link>
          <Link href={`/user/${reel.user.username}`} className="text-white font-semibold text-sm drop-shadow-lg hover:underline">
            {reel.user.username}
          </Link>
        </div>
        {reel.caption && (
          <div className="reel-caption-container">
            <p
              className={`text-white text-sm drop-shadow-lg ${showCaption ? '' : 'line-clamp-2'}`}
              onClick={(e) => { e.stopPropagation(); setShowCaption(!showCaption); }}
            >
              {reel.caption}
            </p>
            {reel.caption.length > 80 && !showCaption && (
              <button
                className="text-gray-300 text-xs mt-1"
                onClick={(e) => { e.stopPropagation(); setShowCaption(true); }}
              >
                more
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right-side action buttons */}
      <div className="reel-actions">
        {/* Like */}
        <button
          className="reel-action-btn"
          onClick={(e) => { e.stopPropagation(); onLike(reel._id); }}
        >
          {isLiked ? (
            <FaHeart className="reel-action-icon text-red-500" />
          ) : (
            <FaRegHeart className="reel-action-icon text-white" />
          )}
          <span className="reel-action-count">{formatCount(reel.likes?.length || 0)}</span>
        </button>

        {/* Comment */}
        <button
          className="reel-action-btn"
          onClick={(e) => { e.stopPropagation(); onOpenComments(reel); }}
        >
          <FaComment className="reel-action-icon text-white" />
          <span className="reel-action-count">{formatCount(reel.comments?.length || 0)}</span>
        </button>

        {/* Share */}
        <button
          className="reel-action-btn"
          title="Share"
          onClick={(e) => { e.stopPropagation(); onShare(reel); }}
        >
          <FaShare className="reel-action-icon text-white" />
        </button>

        {/* Save */}
        <button
          className="reel-action-btn"
          onClick={(e) => { e.stopPropagation(); onSave(reel._id); }}
        >
          {isSaved ? (
            <FaBookmark className="reel-action-icon text-white" />
          ) : (
            <FaRegBookmark className="reel-action-icon text-white" />
          )}
        </button>

        {/* Mute */}
        <button
          className="reel-action-btn"
          title={isMuted ? 'Unmute' : 'Mute'}
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
        >
          {isMuted ? (
            <FaVolumeMute className="reel-action-icon text-white" />
          ) : (
            <FaVolumeUp className="reel-action-icon text-white" />
          )}
        </button>

        {/* View count */}
        <div className="reel-action-btn opacity-70">
          <svg className="text-white" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
          <span className="reel-action-count">{formatCount(reel.views || 0)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="reel-progress-bar" onClick={handleProgressClick}>
        <div ref={progressRef} className="reel-progress-fill" />
      </div>
    </div>
  );
};

export default ReelPlayer;
