'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  X, Pause, Play, Eye, Send, Heart, Trash2,
  MoreVertical, Volume2, VolumeX, ChevronUp,
} from 'lucide-react';

/* ───────── Types ───────── */
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

interface Viewer {
  userId: string;
  username: string;
  name: string;
  profilePicture: string;
  viewedAt: string;
}

interface StoryViewerProps {
  stories: UserStoryGroup[];
  initialIndex?: number;
  currentUserId: string | null;
  onClose: () => void;
}

const QUICK_EMOJIS = ['❤️', '🔥', '😍', '😂', '😮', '👏', '😢', '🎉'];
const IMAGE_DURATION = 5000;
const PROGRESS_INTERVAL = 30; // ms per tick

const StoryViewer = ({
  stories,
  initialIndex = 0,
  currentUserId: propCurrentUserId,
  onClose,
}: StoryViewerProps) => {
  /* ── State ── */
  const [userIdx, setUserIdx] = useState(initialIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(propCurrentUserId);

  // UI panels
  const [showViewers, setShowViewers] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  // Transition
  const [transitioning, setTransitioning] = useState(false);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);

  /* ── Refs ── */
  const progressRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch / gesture refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressing = useRef(false);
  const wasPausedBefore = useRef(false);

  // Ref to always point to latest goNext (avoids stale closure in setInterval)
  const goNextRef = useRef<() => void>(() => {});

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  /* ── Derived ── */
  const userGroup = stories[userIdx];
  const story = userGroup?.stories[storyIdx];
  const isOwn =
    currentUserId != null &&
    (userGroup?.userId?.toString() === currentUserId?.toString());

  /* ── Fetch current user if needed ── */
  useEffect(() => {
    if (!propCurrentUserId) {
      axios
        .get('/api/users/', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => setCurrentUserId(r.data._id))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Lock body scroll ── */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  /* ── Sync liked state ── */
  useEffect(() => {
    if (story) setLiked(story.hasLiked);
  }, [story]);

  /* ── Mark viewed ── */
  const markViewed = useCallback(
    (id: string) => {
      axios
        .post(`/api/stories/${id}/view`, {}, { headers: { Authorization: `Bearer ${token}` } })
        .catch(() => {});
    },
    [token],
  );

  /* ── Progress timer ── */
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (duration: number) => {
      stopTimer();
      const inc = (PROGRESS_INTERVAL / duration) * 100;
      timerRef.current = setInterval(() => {
        progressRef.current += inc;
        if (progressRef.current >= 100) {
          progressRef.current = 100;
          setProgress(100);
          stopTimer();
          // auto-advance via ref to avoid stale closure
          goNextRef.current();
        } else {
          setProgress(progressRef.current);
        }
      }, PROGRESS_INTERVAL);
    },
    [stopTimer],
  );

  /* ── Navigation helpers ── */
  const goNext = useCallback(() => {
    stopTimer();
    const ug = stories[userIdx];
    if (!ug) {
      onClose();
      return;
    }
    if (storyIdx < ug.stories.length - 1) {
      setSlideDir(null);
      setStoryIdx((p) => p + 1);
      progressRef.current = 0;
      setProgress(0);
    } else if (userIdx < stories.length - 1) {
      setSlideDir('left');
      setTransitioning(true);
      setTimeout(() => {
        setUserIdx((p) => p + 1);
        setStoryIdx(0);
        progressRef.current = 0;
        setProgress(0);
        setTransitioning(false);
        setSlideDir(null);
      }, 250);
    } else {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdx, storyIdx, stories, onClose, stopTimer]);

  // Keep goNextRef in sync with latest goNext
  useEffect(() => {
    goNextRef.current = goNext;
  }, [goNext]);

  const goPrev = useCallback(() => {
    stopTimer();
    if (storyIdx > 0) {
      setSlideDir(null);
      setStoryIdx((p) => p - 1);
      progressRef.current = 0;
      setProgress(0);
    } else if (userIdx > 0) {
      setSlideDir('right');
      setTransitioning(true);
      setTimeout(() => {
        const prev = userIdx - 1;
        setUserIdx(prev);
        setStoryIdx(stories[prev].stories.length - 1);
        progressRef.current = 0;
        setProgress(0);
        setTransitioning(false);
        setSlideDir(null);
      }, 250);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdx, storyIdx, stories, stopTimer]);

  /* ── Main effect: on story change ── */
  useEffect(() => {
    if (!story) return;
    setImageLoaded(false);
    setMediaError(false);
    setShowViewers(false);
    setShowReactions(false);

    markViewed(story._id);

    // If no media URL, start timer immediately so the viewer auto-advances
    if (!story.mediaUrl) {
      setMediaError(true);
      progressRef.current = 0;
      setProgress(0);
      startTimer(IMAGE_DURATION);
      return () => stopTimer();
    }

    if (story.mediaType === 'video') {
      // Video: timer driven by video duration
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }

    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdx, storyIdx]);

  /* ── Start progress when image loads or video plays ── */
  const handleImageLoad = () => {
    setImageLoaded(true);
    setMediaError(false);
    if (!isPaused) {
      progressRef.current = 0;
      setProgress(0);
      startTimer(IMAGE_DURATION);
    }
  };

  const handleMediaError = () => {
    setMediaError(true);
    // Still start the timer so auto-advance works even on broken media
    if (!isPaused) {
      progressRef.current = 0;
      setProgress(0);
      startTimer(IMAGE_DURATION);
    }
  };

  const handleVideoPlay = () => {
    const v = videoRef.current;
    if (!v) return;
    const dur = (v.duration || 15) * 1000;
    if (!isPaused) {
      progressRef.current = 0;
      setProgress(0);
      startTimer(dur);
    }
  };

  /* ── Pause / resume ── */
  useEffect(() => {
    if (isPaused) {
      stopTimer();
      videoRef.current?.pause();
    } else {
      if (story?.mediaType === 'video' && videoRef.current) {
        const v = videoRef.current;
        v.play().catch(() => {});
        const remaining = ((100 - progressRef.current) / 100) * (v.duration || 15) * 1000;
        startTimer(remaining);
      } else if (story?.mediaType === 'photo' && imageLoaded) {
        const remaining = ((100 - progressRef.current) / 100) * IMAGE_DURATION;
        startTimer(remaining);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  /* ── Keyboard ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  /* ── Touch gestures ── */
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    isLongPressing.current = false;
    wasPausedBefore.current = isPaused;

    longPressRef.current = setTimeout(() => {
      isLongPressing.current = true;
      setIsPaused(true);
    }, 300);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }

    const start = touchStartRef.current;
    if (!start) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - start.x;
    const dy = endY - start.y;
    const elapsed = Date.now() - start.time;

    // Long press release — resume
    if (isLongPressing.current) {
      if (!wasPausedBefore.current) setIsPaused(false);
      touchStartRef.current = null;
      return;
    }

    // Swipe down to close
    if (dy > 100 && Math.abs(dx) < 80) {
      onClose();
      touchStartRef.current = null;
      return;
    }

    // Horizontal swipe between users
    if (Math.abs(dx) > 60 && Math.abs(dy) < 100 && elapsed < 500) {
      if (dx < 0) goNext();
      else goPrev();
      touchStartRef.current = null;
      return;
    }

    // Short tap: left/right half
    if (elapsed < 300 && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      const w = containerRef.current?.clientWidth || window.innerWidth;
      if (start.x < w * 0.35) goPrev();
      else goNext();
    }

    touchStartRef.current = null;
  };

  const handleTouchMove = () => {
    // Cancel long press if finger moves
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  /* ── Mouse click (desktop): left/right tap ── */
  const handleClick = (e: React.MouseEvent) => {
    // Ignore clicks on buttons/inputs
    if ((e.target as HTMLElement).closest('button, input, a, [role="dialog"]')) return;
    const w = containerRef.current?.clientWidth || window.innerWidth;
    const x = e.clientX - (containerRef.current?.getBoundingClientRect().left || 0);
    if (x < w * 0.35) goPrev();
    else goNext();
  };

  /* ── Actions ── */
  const handleLike = async () => {
    if (!story) return;
    setLiked((p) => !p);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
    try {
      await axios.post(`/api/stories/${story._id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setLiked((p) => !p);
    }
  };

  const handleDoubleTap = () => {
    if (!liked) handleLike();
    else {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
  };

  const handleReact = async (emoji: string) => {
    if (!story) return;
    setShowReactions(false);
    toast.success(`Reacted ${emoji}`);
    try {
      await axios.post(
        `/api/stories/${story._id}/react`,
        { emoji },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      // silent
    }
  };

  const handleReply = async () => {
    if (!story || !replyText.trim() || sending) return;
    setSending(true);
    try {
      await axios.post(
        `/api/stories/${story._id}/reply`,
        { text: replyText.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success('Reply sent!');
      setReplyText('');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!story || !window.confirm('Delete this story?')) return;
    try {
      await axios.delete(`/api/stories/${story._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Story deleted');
      // Advance or close
      const remaining = userGroup.stories.length - 1;
      if (remaining <= 0) {
        if (stories.length <= 1) {
          onClose();
        } else {
          goNext();
        }
      } else {
        goNext();
      }
    } catch {
      toast.error('Failed to delete story');
    }
  };

  const fetchViewersList = async () => {
    if (!story) return;
    setIsPaused(true);
    try {
      const r = await axios.get(`/api/stories/${story._id}/viewers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewers(r.data.viewers || []);
      setShowViewers(true);
    } catch {
      toast.error('Failed to load viewers');
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${userGroup.username}'s Story`,
          text: story?.caption || 'Check out this story!',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!');
      }
    } catch {
      // user cancelled
    }
  };

  /* ── Time ago helper ── */
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  if (!story || !userGroup) return null;

  /* ───────────────── RENDER ───────────────── */
  return (
    <div className="fixed inset-0 z-50 bg-black story-viewer-root">
      {/* Desktop side overlay: prev/next user previews */}
      <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none">
        {/* Prev user preview */}
        {userIdx > 0 && (
          <button
            onClick={goPrev}
            aria-label="Previous story"
            className="pointer-events-auto absolute left-4 xl:left-12 w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {/* Next user preview */}
        {userIdx < stories.length - 1 && (
          <button
            onClick={goNext}
            aria-label="Next story"
            className="pointer-events-auto absolute right-4 xl:right-12 w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Main story card */}
      <div
        ref={containerRef}
        className={`relative mx-auto h-full w-full max-w-[420px] lg:max-w-[380px] lg:h-[calc(100vh-48px)] lg:my-6 lg:rounded-2xl overflow-hidden bg-black story-card ${
          transitioning ? (slideDir === 'left' ? 'story-slide-left' : 'story-slide-right') : 'story-slide-in'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onClick={handleClick}
        onDoubleClick={handleDoubleTap}
      >
        {/* ── Progress bars ── */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-[3px] px-2 pt-2">
          {userGroup.stories.map((_, i) => {
            const w = i < storyIdx ? 100 : i === storyIdx ? progress : 0;
            const cls = `h-full bg-white rounded-full story-progress-bar ${i === storyIdx ? 'story-progress-active' : ''}`;
            return (
              <div key={i} className="flex-1 h-[2.5px] rounded-full bg-white/30 overflow-hidden">
                <div
                  className={cls}
                  /* eslint-disable-next-line react/forbid-dom-props */
                  {...{ style: { '--progress-w': `${w}%` } as React.CSSProperties }}
                />
              </div>
            );
          })}
        </div>

        {/* ── Header ── */}
        <div className="absolute top-3 left-0 right-0 z-30 flex items-center justify-between px-3 pt-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/40">
              <img
                src={userGroup.profilePicture || '/default-avatar.svg'}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-avatar.svg';
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-[13px] truncate leading-tight">
                {userGroup.username}
              </p>
              <p className="text-white/60 text-[11px] leading-tight">
                {timeAgo(story.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setIsPaused((p) => !p); }}
              className="p-2 hover:bg-white/10 rounded-full transition"
            >
              {isPaused ? (
                <Play className="w-5 h-5 text-white" fill="white" />
              ) : (
                <Pause className="w-5 h-5 text-white" fill="white" />
              )}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
              className="p-2 hover:bg-white/10 rounded-full transition"
            >
              {muted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>

            {isOwn && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                aria-label="Delete story"
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <Trash2 className="w-[18px] h-[18px] text-white" />
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              aria-label="Close"
              className="p-2 hover:bg-white/10 rounded-full transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* ── Story media ── */}
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {story.mediaUrl ? (
            story.mediaType === 'photo' ? (
              <img
                key={story._id}
                src={story.mediaUrl}
                alt="Story"
                className="w-full h-full object-cover"
                onLoad={handleImageLoad}
                onError={handleMediaError}
                draggable={false}
              />
            ) : (
              <video
                key={story._id}
                ref={videoRef}
                src={story.mediaUrl}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted={muted}
                onPlay={handleVideoPlay}
                onError={handleMediaError}
                onEnded={goNext}
              />
            )
          ) : null}

          {/* Loading spinner */}
          {story.mediaType === 'photo' && !imageLoaded && !mediaError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Media error / empty URL fallback */}
          {(mediaError || !story.mediaUrl) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <X className="w-8 h-8 text-white/50" />
              </div>
              <p className="text-white/50 text-sm">Media unavailable</p>
            </div>
          )}
        </div>

        {/* ── Heart animation on double tap ── */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
            <Heart className="w-24 h-24 text-white story-heart-pop" fill="white" />
          </div>
        )}

        {/* ── Caption ── */}
        {story.caption && (
          <div className="absolute bottom-24 left-0 right-0 z-20 px-4">
            <p className="text-white text-sm text-center bg-black/40 rounded-xl px-4 py-2.5 backdrop-blur-sm leading-relaxed">
              {story.caption}
            </p>
          </div>
        )}

        {/* ── Bottom bar: viewers (own) or reply + reactions (others) ── */}
        <div className="absolute bottom-0 left-0 right-0 z-30">
          {/* Gradient fade */}
          <div className="h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

          <div className="absolute bottom-0 left-0 right-0 px-3 pb-4 safe-area-pb">
            {isOwn ? (
              /* ── Own story: view count + viewers button ── */
              <button
                onClick={(e) => { e.stopPropagation(); fetchViewersList(); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition"
              >
                <Eye className="w-5 h-5 text-white" />
                <span className="text-white text-sm font-medium">
                  {story.views} {story.views === 1 ? 'viewer' : 'viewers'}
                </span>
                <ChevronUp className="w-4 h-4 text-white/60" />
              </button>
            ) : (
              /* ── Other's story: reply + reactions + like ── */
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={replyInputRef}
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => {
                      if (!replyText.trim()) setIsPaused(false);
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') handleReply();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder={`Reply to ${userGroup.username}...`}
                    className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm placeholder-white/50 border border-white/20 focus:border-white/40 outline-none transition"
                  />
                  {replyText.trim() && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReply(); }}
                      disabled={sending}
                      aria-label="Send reply"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-400 hover:text-blue-300 disabled:opacity-50 transition"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Quick emoji reactions */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowReactions((p) => !p); setIsPaused(true); }}
                    className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition"
                  >
                    <span className="text-lg">😊</span>
                  </button>
                  {showReactions && (
                    <div
                      className="absolute bottom-full right-0 mb-2 flex gap-1 bg-black/80 backdrop-blur-md rounded-full px-2 py-1.5 shadow-xl border border-white/10 story-reactions-pop"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(emoji)}
                          className="text-xl hover:scale-125 transition-transform px-0.5"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Like button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleLike(); }}
                  aria-label="Like story"
                  className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition"
                >
                  <Heart
                    className={`w-5 h-5 transition-all ${liked ? 'text-red-500 scale-110' : 'text-white'}`}
                    fill={liked ? 'currentColor' : 'none'}
                  />
                </button>

                {/* Share */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleShare(); }}
                  aria-label="Share story"
                  className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition"
                >
                  <Send className="w-5 h-5 text-white -rotate-45" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Viewers bottom sheet (own stories) ── */}
      {showViewers && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-end justify-center"
          onClick={() => { setShowViewers(false); setIsPaused(false); }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-t-2xl w-full max-w-[420px] max-h-[70vh] overflow-hidden story-sheet-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            <div className="px-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-base">Viewers</h3>
              <span className="text-sm text-gray-500">{viewers.length}</span>
            </div>

            <div className="overflow-y-auto max-h-[55vh] p-3 space-y-2">
              {viewers.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Eye className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No viewers yet</p>
                </div>
              ) : (
                viewers.map((v) => (
                  <div key={v.userId} className="flex items-center gap-3 py-1.5">
                    <img
                      src={v.profilePicture || '/default-avatar.svg'}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-avatar.svg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{v.username}</p>
                      {v.name && (
                        <p className="text-xs text-gray-500 truncate">{v.name}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {timeAgo(v.viewedAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;
