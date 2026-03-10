'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navbar from '../Dashboard/Navbar';
import PrefetchLink from '@/components/ui/PrefetchLink';
import {
  Heart, MessageCircle, Flame, Laugh, Frown, Zap, Send,
  TrendingUp, Clock, Flag, X, Calendar, ShoppingBag,
  MessageSquare, Sparkles, Home,
} from 'lucide-react';

/* ---------- constants ---------- */
interface ReactionMeta {
  icon: typeof Heart;
  emoji: string;
  color: string;
}

const REACTION_ICONS: Record<string, ReactionMeta> = {
  heart: { icon: Heart, emoji: '❤️', color: 'text-red-500' },
  laugh: { icon: Laugh, emoji: '😂', color: 'text-yellow-500' },
  sad:   { icon: Frown, emoji: '😢', color: 'text-blue-500' },
  fire:  { icon: Flame, emoji: '🔥', color: 'text-orange-500' },
  shock: { icon: Zap,   emoji: '😱', color: 'text-purple-500' },
};

interface TagOption {
  value: string;
  label: string;
}

const TAGS: TagOption[] = [
  { value: 'crush', label: '💕 Crush' },
  { value: 'rant', label: '😤 Rant' },
  { value: 'advice', label: '💡 Advice' },
  { value: 'funny', label: '😂 Funny' },
  { value: 'sad', label: '😢 Sad' },
  { value: 'question', label: '❓ Question' },
  { value: 'appreciation', label: '🙏 Appreciation' },
  { value: 'other', label: '📝 Other' },
];

/* ---------- types ---------- */
interface CommentData {
  isAnonymous: boolean;
  displayName?: string;
  createdAt: string;
  content: string;
}

interface ConfessionData {
  _id: string;
  content: string;
  tags?: string[];
  college?: { name: string };
  createdAt: string;
  reactions?: Record<string, string[]>;
  userReaction?: string;
  totalReactions?: number;
  comments?: CommentData[];
  commentCount?: number;
}

interface FilterState {
  sort: string;
  tag: string;
}

/* ---------- component ---------- */
const Confessions = () => {
  const [confessions, setConfessions] = useState<ConfessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newConfession, setNewConfession] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filter, setFilter] = useState<FilterState>({ sort: 'recent', tag: 'all' });
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    fetchConfessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  /* ---------- api helpers ---------- */
  const fetchConfessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/confessions', {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: {
          sort: filter.sort,
          tag: filter.tag !== 'all' ? filter.tag : undefined,
        },
      });
      setConfessions(response.data.confessions || []);
    } catch (err) {
      console.error('Failed to fetch confessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfession = async () => {
    if (!newConfession.trim() || submitting) return;

    try {
      setSubmitting(true);
      await axios.post(
        '/api/confessions',
        {
          content: newConfession,
          tags: selectedTags.length > 0 ? selectedTags : ['other'],
          targetColleges: ['ALL'],
        },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      setNewConfession('');
      setSelectedTags([]);
      setShowCreateModal(false);
      fetchConfessions();
    } catch (err: any) {
      console.error('Failed to create confession:', err);
      toast.error(err.response?.data?.message || 'Failed to post confession');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (confessionId: string, reactionType: string) => {
    try {
      const response = await axios.post(
        `/api/confessions/${confessionId}/react`,
        { reaction: reactionType },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );

      setConfessions((prev) =>
        prev.map((c) =>
          c._id === confessionId
            ? {
                ...c,
                reactions: response.data.reactions,
                userReaction: response.data.userReaction,
                totalReactions: response.data.totalReactions,
              }
            : c,
        ),
      );
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleComment = async (confessionId: string) => {
    const content = commentInputs[confessionId];
    if (!content?.trim()) return;

    try {
      const response = await axios.post(
        `/api/confessions/${confessionId}/comment`,
        { content, isAnonymous: true },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );

      setConfessions((prev) =>
        prev.map((c) =>
          c._id === confessionId
            ? {
                ...c,
                comments: [...(c.comments || []), response.data.comment],
                commentCount: (c.commentCount || 0) + 1,
              }
            : c,
        ),
      );
      setCommentInputs((prev) => ({ ...prev, [confessionId]: '' }));
    } catch (err) {
      console.error('Failed to comment:', err);
    }
  };

  const handleReport = async (confessionId: string) => {
    if (!window.confirm('Report this confession for inappropriate content?')) return;

    try {
      await axios.post(
        `/api/confessions/${confessionId}/report`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      toast.success('Confession reported. Thank you for helping keep the community safe.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to report');
    }
  };

  /* ---------- helpers ---------- */
  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  /* ---------- JSX ---------- */
  return (
    <div
      className="min-h-screen pt-14 pb-14 md:pt-0 md:pb-0 bg-theme-background"
    >
      <Navbar />

      {/* Main Content Area */}
      <div className="md:ml-64 flex flex-col">
        {/* Feature Top Bar */}
        <div
          className="sticky top-14 md:top-0 z-40 border-b border-gray-800/50 bg-theme-background"
        >
          <div className="flex items-center justify-center px-3 md:px-6 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <PrefetchLink
                to="/dashboard"
                className="relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:opacity-80 active:scale-95 border border-neutral-300 dark:border-neutral-600 text-theme-color"
              >
                <Home className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Home</span>
              </PrefetchLink>
              <PrefetchLink
                to="/events"
                className="relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:opacity-80 active:scale-95 border border-neutral-300 dark:border-neutral-600 text-theme-color"
              >
                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Events</span>
              </PrefetchLink>
              <PrefetchLink
                to="/marketplace"
                className="relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:opacity-80 active:scale-95 border border-neutral-300 dark:border-neutral-600 text-theme-color"
              >
                <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Marketplace</span>
              </PrefetchLink>
              <button
                className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all bg-black text-white dark:bg-white dark:text-black"
              >
                <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Confessions</span>
              </button>
              <button
                onClick={() => router.push('/upload-story')}
                className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:opacity-80 active:scale-95 border border-neutral-300 dark:border-neutral-600 text-theme-color"
              >
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Add Story</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1
                  className="text-2xl font-bold text-theme-color"
                >
                  🎭 Confessions
                </h1>
                <p
                  className="text-sm opacity-60 text-theme-color"
                >
                  Share anonymously. React freely.
                </p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                + Confess
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <Button
                variant={filter.sort === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter((f) => ({ ...f, sort: 'recent' }))}
                className="flex items-center gap-1"
              >
                <Clock className="w-4 h-4" /> Recent
              </Button>
              <Button
                variant={filter.sort === 'trending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter((f) => ({ ...f, sort: 'trending' }))}
                className="flex items-center gap-1"
              >
                <TrendingUp className="w-4 h-4" /> Trending
              </Button>
              <div className="h-6 w-px bg-gray-300 mx-2" />
              <select
                value={filter.tag}
                onChange={(e) => setFilter((f) => ({ ...f, tag: e.target.value }))}
                className="px-3 py-1 rounded-md text-sm theme-input border"
                title="Filter by tag"
              >
                <option value="all">All Tags</option>
                {TAGS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Confessions List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : confessions.length === 0 ? (
              <div className="text-center py-12">
                <p
                  className="text-lg opacity-60 text-theme-color"
                >
                  No confessions yet. Be the first to confess! 🤫
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {confessions.map((confession) => (
                  <Card
                    key={confession._id}
                    className="p-4 rounded-xl bg-theme-background border border-theme-color"
                  >
                    {/* Tags */}
                    {confession.tags && confession.tags.length > 0 && (
                      <div className="flex gap-2 mb-2">
                        {confession.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700"
                          >
                            {TAGS.find((t) => t.value === tag)?.label || tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Content */}
                    <p
                      className="text-base mb-3 whitespace-pre-wrap text-theme-color"
                    >
                      {confession.content}
                    </p>

                    {/* Meta */}
                    <div
                      className="flex items-center justify-between text-xs opacity-50 mb-3 text-theme-color"
                    >
                      <span>
                        Anonymous • {confession.college?.name || 'Unknown College'}
                      </span>
                      <span>{formatTimeAgo(confession.createdAt)}</span>
                    </div>

                    {/* Reactions */}
                    <div className="flex items-center gap-1 mb-3 flex-wrap">
                      {Object.entries(REACTION_ICONS).map(([type, { emoji }]) => {
                        const count = confession.reactions?.[type]?.length || 0;
                        const isActive = confession.userReaction === type;
                        return (
                          <button
                            key={type}
                            onClick={() => handleReaction(confession._id, type)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                              isActive
                                ? 'bg-gray-200 dark:bg-gray-700 scale-110'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            <span className="text-lg">{emoji}</span>
                            {count > 0 && (
                              <span
                                className="text-xs font-medium text-theme-color"
                              >
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                      <div className="flex-1" />
                      <button
                        onClick={() =>
                          setExpandedComments((prev) => ({
                            ...prev,
                            [confession._id]: !prev[confession._id],
                          }))
                        }
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <MessageCircle
                          className="w-4 h-4 text-theme-color"
                        />
                        <span
                          className="text-xs text-theme-color"
                        >
                          {confession.commentCount || confession.comments?.length || 0}
                        </span>
                      </button>
                      <button
                        onClick={() => handleReport(confession._id)}
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 opacity-50 hover:opacity-100"
                        title="Report confession"
                      >
                        <Flag
                          className="w-4 h-4 text-theme-color"
                        />
                      </button>
                    </div>

                    {/* Comments Section */}
                    {expandedComments[confession._id] && (
                      <div
                        className="border-t pt-3 mt-3 border-theme-color"
                      >
                        {/* Existing Comments */}
                        {confession.comments && confession.comments.length > 0 && (
                          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                            {confession.comments.map((comment, idx) => (
                              <div
                                key={idx}
                                className="text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                              >
                                <span className="font-medium text-purple-600">
                                  {comment.isAnonymous ? 'Anonymous' : comment.displayName}
                                </span>
                                <span className="mx-2">·</span>
                                <span className="opacity-50 text-xs">
                                  {formatTimeAgo(comment.createdAt)}
                                </span>
                                <p className="mt-1 text-theme-color">
                                  {comment.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comment Input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add anonymous comment..."
                            value={commentInputs[confession._id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [confession._id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) =>
                              e.key === 'Enter' && handleComment(confession._id)
                            }
                            className="flex-1 px-3 py-2 rounded-lg text-sm theme-input border"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleComment(confession._id)}
                            className="bg-purple-500 text-white"
                            title="Send comment"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Confession Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card
            className="w-full max-w-lg p-6 rounded-xl bg-theme-background"
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-xl font-bold text-theme-color"
              >
                🤫 New Confession
              </h2>
              <button onClick={() => setShowCreateModal(false)} title="Close">
                <X
                  className="w-6 h-6 text-theme-color"
                />
              </button>
            </div>

            <textarea
              placeholder="What's on your mind? This will be posted anonymously..."
              value={newConfession}
              onChange={(e) => setNewConfession(e.target.value)}
              maxLength={1000}
              rows={5}
              className="w-full p-3 rounded-lg resize-none mb-4 theme-input border"
            />

            <div className="mb-4">
              <p
                className="text-sm mb-2 opacity-60 text-theme-color"
              >
                Tags (optional)
              </p>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <button
                    key={tag.value}
                    onClick={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag.value)
                          ? prev.filter((t) => t !== tag.value)
                          : [...prev, tag.value],
                      );
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      selectedTags.includes(tag.value)
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-theme-color'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span
                className="text-xs opacity-50 text-theme-color"
              >
                {newConfession.length}/1000
              </span>
              <Button
                onClick={handleCreateConfession}
                disabled={!newConfession.trim() || submitting}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                {submitting ? 'Posting...' : 'Post Anonymously'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Confessions;
