'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { FaHeart, FaRegHeart, FaTimes, FaReply } from 'react-icons/fa';
import type { ReelData, ReelComment, ReelReply } from './ReelPlayer';

interface ReelCommentsProps {
  reel: ReelData;
  isOpen: boolean;
  onClose: () => void;
  currentUserProfileId: string;
  onCommentAdded: (reelId: string, comment: ReelComment) => void;
}

const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

const timeAgo = (dateStr: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
};

const ReelComments = ({ reel, isOpen, onClose, currentUserProfileId, onCommentAdded }: ReelCommentsProps) => {
  const [comments, setComments] = useState<ReelComment[]>(reel.comments || []);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ commentId: string; username: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync comments when reel changes
  useEffect(() => {
    setComments(reel.comments || []);
  }, [reel.comments]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmitComment = useCallback(async () => {
    const token = getToken();
    if (!token || !newComment.trim()) return;
    setSubmitting(true);
    try {
      if (replyTo) {
        const res = await axios.post(
          `/api/reels/${reel._id}/comment/${replyTo.commentId}/reply`,
          { text: newComment.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComments((prev) =>
          prev.map((c) =>
            c._id === replyTo.commentId
              ? { ...c, replies: [...c.replies, res.data.reply] }
              : c
          )
        );
        setExpandedReplies((prev) => new Set(prev).add(replyTo.commentId));
        setReplyTo(null);
      } else {
        const res = await axios.post(
          `/api/reels/${reel._id}/comment`,
          { text: newComment.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const addedComment = res.data.comment;
        // Re-fetch to get populated user data
        const reelRes = await axios.get(`/api/reels/${reel._id}`);
        const refreshedComments = reelRes.data.comments || [];
        setComments(refreshedComments);
        onCommentAdded(reel._id, addedComment);
      }
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  }, [newComment, replyTo, reel._id, onCommentAdded]);

  const handleLikeComment = async (commentId: string) => {
    const token = getToken();
    if (!token) return;
    // Optimistic update
    setComments((prev) =>
      prev.map((c) => {
        if (c._id === commentId) {
          const isLiked = c.likes.includes(currentUserProfileId);
          return {
            ...c,
            likes: isLiked
              ? c.likes.filter((id) => id !== currentUserProfileId)
              : [...c.likes, currentUserProfileId],
          };
        }
        return c;
      })
    );
    try {
      await axios.post(
        `/api/reels/${reel._id}/comment/${commentId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const handleLikeReply = async (commentId: string, replyId: string) => {
    const token = getToken();
    if (!token) return;
    setComments((prev) =>
      prev.map((c) => {
        if (c._id === commentId) {
          return {
            ...c,
            replies: c.replies.map((r) => {
              if (r._id === replyId) {
                const isLiked = r.likes.includes(currentUserProfileId);
                return {
                  ...r,
                  likes: isLiked
                    ? r.likes.filter((id) => id !== currentUserProfileId)
                    : [...r.likes, currentUserProfileId],
                };
              }
              return r;
            }),
          };
        }
        return c;
      })
    );
    try {
      await axios.post(
        `/api/reels/${reel._id}/comment/${commentId}/reply/${replyId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error liking reply:', err);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const getUsername = (comment: ReelComment | ReelReply): string => {
    if (comment.userId?.authId?.username) return comment.userId.authId.username;
    return 'unknown';
  };

  const getAvatar = (comment: ReelComment | ReelReply): string => {
    return comment.userId?.profilePicture || '/default-avatar.svg';
  };

  const isCommentLiked = (comment: ReelComment): boolean => {
    return comment.likes?.includes(currentUserProfileId);
  };

  const isReplyLiked = (reply: ReelReply): boolean => {
    return reply.likes?.includes(currentUserProfileId);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="reel-comments-backdrop" onClick={onClose} />

      {/* Comment panel */}
      <div className="reel-comments-panel">
        {/* Header */}
        <div className="reel-comments-header">
          <div className="reel-comments-drag-handle" />
          <h3 className="text-white font-semibold text-base">Comments</h3>
          <span className="text-gray-400 text-sm">{comments.length}</span>
          <button className="reel-comments-close" title="Close comments" onClick={onClose}>
            <FaTimes className="text-white text-lg" />
          </button>
        </div>

        {/* Comments list */}
        <div className="reel-comments-list" ref={overlayRef}>
          {comments.length === 0 ? (
            <div className="reel-comments-empty">
              <p className="text-gray-400 text-sm">No comments yet</p>
              <p className="text-gray-500 text-xs mt-1">Be the first to comment</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="reel-comment-item">
                {/* Comment */}
                <div className="flex gap-3">
                  <Link href={`/user/${getUsername(comment)}`}>
                    <img
                      src={getAvatar(comment)}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.svg'; }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/user/${getUsername(comment)}`}
                          className="text-white font-semibold text-sm hover:underline"
                        >
                          {getUsername(comment)}
                        </Link>
                        <span className="text-gray-400 text-xs ml-2">{timeAgo(comment.created_at)}</span>
                      </div>
                      <button onClick={() => handleLikeComment(comment._id)} className="flex-shrink-0 pt-1">
                        {isCommentLiked(comment) ? (
                          <FaHeart className="text-red-500 text-xs" />
                        ) : (
                          <FaRegHeart className="text-gray-400 text-xs" />
                        )}
                      </button>
                    </div>
                    <p className="text-gray-200 text-sm mt-0.5 break-words">{comment.text}</p>
                    <div className="flex items-center gap-4 mt-1">
                      {comment.likes?.length > 0 && (
                        <span className="text-gray-400 text-xs">{comment.likes.length} {comment.likes.length === 1 ? 'like' : 'likes'}</span>
                      )}
                      <button
                        className="text-gray-400 text-xs font-semibold hover:text-gray-200"
                        onClick={() => {
                          setReplyTo({ commentId: comment._id, username: getUsername(comment) });
                          inputRef.current?.focus();
                        }}
                      >
                        Reply
                      </button>
                    </div>

                    {/* Replies toggle */}
                    {comment.replies?.length > 0 && (
                      <button
                        className="flex items-center gap-1 text-gray-400 text-xs mt-2 hover:text-gray-200"
                        onClick={() => toggleReplies(comment._id)}
                      >
                        <div className="w-6 h-px bg-gray-500" />
                        {expandedReplies.has(comment._id) ? (
                          <>Hide replies <span className="text-[10px]">▲</span></>
                        ) : (
                          <>View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'} <span className="text-[10px]">▼</span></>
                        )}
                      </button>
                    )}

                    {/* Replies */}
                    {expandedReplies.has(comment._id) && comment.replies?.map((reply) => (
                      <div key={reply._id} className="flex gap-3 mt-3">
                        <Link href={`/user/${getUsername(reply)}`}>
                          <img
                            src={getAvatar(reply)}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.svg'; }}
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                href={`/user/${getUsername(reply)}`}
                                className="text-white font-semibold text-xs hover:underline"
                              >
                                {getUsername(reply)}
                              </Link>
                              <span className="text-gray-400 text-[10px] ml-2">{timeAgo(reply.created_at)}</span>
                            </div>
                            <button onClick={() => handleLikeReply(comment._id, reply._id)} className="flex-shrink-0">
                              {isReplyLiked(reply) ? (
                                <FaHeart className="text-red-500 text-[10px]" />
                              ) : (
                                <FaRegHeart className="text-gray-400 text-[10px]" />
                              )}
                            </button>
                          </div>
                          <p className="text-gray-200 text-xs mt-0.5 break-words">{reply.text}</p>
                          {reply.likes?.length > 0 && (
                            <span className="text-gray-400 text-[10px] mt-0.5 block">{reply.likes.length} {reply.likes.length === 1 ? 'like' : 'likes'}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input area */}
        <div className="reel-comments-input-area">
          {replyTo && (
            <div className="reel-comments-reply-indicator">
              <FaReply className="text-gray-400 text-xs" />
              <span className="text-gray-400 text-xs">Replying to @{replyTo.username}</span>
              <button title="Cancel reply" onClick={() => setReplyTo(null)}>
                <FaTimes className="text-gray-400 text-xs" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
              placeholder={replyTo ? `Reply to @${replyTo.username}...` : 'Add a comment...'}
              className="reel-comments-input"
              disabled={submitting}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              className="reel-comments-post-btn"
            >
              {submitting ? '...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReelComments;
