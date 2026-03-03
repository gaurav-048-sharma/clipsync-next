'use client';

import { useEffect, useState, useRef, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, CornerDownRight, Trash2, Edit2, X, ChevronDown, ChevronUp } from 'lucide-react';
import StoryCircles from '@/components/Stories/StoryCircles';

interface AuthId {
  _id: string;
  username: string;
  name?: string;
}

interface PostUser {
  _id: string;
  authId?: AuthId;
  profilePicture?: string;
}

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface Reply {
  _id: string;
  userId?: PostUser;
  text: string;
  created_at: string;
  likes?: string[];
}

interface Comment {
  _id: string;
  userId?: PostUser;
  text: string;
  created_at: string;
  updated_at?: string;
  likes?: string[];
  replies?: Reply[];
}

interface Post {
  _id: string;
  userId?: PostUser;
  caption?: string;
  media?: MediaItem[];
  likes?: string[];
  comments?: Comment[];
  created_at: string;
}

interface ReplyingTo {
  commentId: string;
  username: string;
}

interface EditingComment {
  commentId: string;
  text: string;
}

interface EditingReply {
  commentId: string;
  replyId: string;
  text: string;
}

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMediaIndex, setCurrentMediaIndex] = useState<Record<string, number>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<PostUser | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<EditingComment | null>(null);
  const [editingReply, setEditingReply] = useState<EditingReply | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const viewedPostsRef = useRef<Set<string>>(new Set());
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const router = useRouter();

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
    fetchSavedPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/users/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserId(response.data._id);
      setCurrentUser(response.data);
    } catch {
      // Error fetching user
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const response = await axios.get('/api/activity/saved/ids', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const saved = new Set<string>(response.data.savedPostIds || []);
      setSavedPosts(saved);
    } catch (err) {
      console.error('Error fetching saved posts:', err);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      const isSaved = savedPosts.has(postId);
      const newSavedPosts = new Set(savedPosts);

      if (isSaved) {
        newSavedPosts.delete(postId);
      } else {
        newSavedPosts.add(postId);
      }
      setSavedPosts(newSavedPosts);

      if (isSaved) {
        await axios.delete(`/api/activity/save/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`/api/activity/save/${postId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      fetchSavedPosts();
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/api/reels', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(response.data.posts || []);

      const userResponse = await axios.get('/api/users/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const liked = new Set<string>(
        userResponse.data.likedReels?.map((r: string | { toString(): string }) =>
          typeof r === 'string' ? r : r.toString()
        ) || []
      );
      setLikedPosts(liked);
      setLoading(false);
    } catch {
      setError('Failed to load posts');
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const isLiked = likedPosts.has(postId);
      const newLikedPosts = new Set(likedPosts);

      if (isLiked) {
        newLikedPosts.delete(postId);
      } else {
        newLikedPosts.add(postId);
      }
      setLikedPosts(newLikedPosts);

      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            const likesArray = Array.isArray(post.likes) ? post.likes : [];
            const newLikesCount = isLiked ? likesArray.length - 1 : likesArray.length + 1;
            return { ...post, likes: Array(Math.max(0, newLikesCount)).fill(null) };
          }
          return post;
        })
      );

      const response = await axios.post(`/api/reels/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            return { ...post, likes: Array(response.data.likesCount).fill(null) };
          }
          return post;
        })
      );
    } catch {
      fetchPosts();
    }
  };

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!commentText.trim() || !selectedPost || submittingComment) return;

    const commentToAdd = commentText.trim();
    setCommentText('');
    setSubmittingComment(true);

    const optimisticComment: Comment = {
      _id: `temp-${Date.now()}`,
      userId: {
        _id: currentUserId || '',
        authId: {
          _id: '',
          username: currentUser?.authId?.username || 'You',
          name: currentUser?.authId?.name || '',
        },
        profilePicture: currentUser?.profilePicture,
      },
      text: commentToAdd,
      created_at: new Date().toISOString(),
    };

    setSelectedPost((prev) =>
      prev ? { ...prev, comments: [...(prev.comments || []), optimisticComment] } : prev
    );
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === selectedPost._id
          ? { ...post, comments: [...(post.comments || []), optimisticComment] }
          : post
      )
    );

    try {
      await axios.post(`/api/reels/${selectedPost._id}/comment`, { text: commentToAdd }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedPostResponse = await axios.get(`/api/reels/${selectedPost._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedPost = updatedPostResponse.data;
      setSelectedPost(updatedPost);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === selectedPost._id ? { ...post, comments: updatedPost.comments } : post
        )
      );
    } catch (err) {
      console.error('Comment error:', err);
      setSelectedPost((prev) =>
        prev
          ? { ...prev, comments: (prev.comments || []).filter((c) => c._id !== optimisticComment._id) }
          : prev
      );
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === selectedPost._id
            ? { ...post, comments: (post.comments || []).filter((c) => c._id !== optimisticComment._id) }
            : post
        )
      );
      setCommentText(commentToAdd);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!selectedPost) return;

    try {
      const isLiked = likedComments.has(commentId);
      const newLikedComments = new Set(likedComments);
      if (isLiked) newLikedComments.delete(commentId);
      else newLikedComments.add(commentId);
      setLikedComments(newLikedComments);

      await axios.post(`/api/reels/${selectedPost._id}/comment/${commentId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Like comment error:', err);
      const newLikedComments = new Set(likedComments);
      if (newLikedComments.has(commentId)) newLikedComments.delete(commentId);
      else newLikedComments.add(commentId);
      setLikedComments(newLikedComments);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedPost || !window.confirm('Delete this comment?')) return;

    try {
      await axios.delete(`/api/reels/${selectedPost._id}/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedPost((prev) =>
        prev ? { ...prev, comments: (prev.comments || []).filter((c) => c._id !== commentId) } : prev
      );
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === selectedPost._id
            ? { ...post, comments: (post.comments || []).filter((c) => c._id !== commentId) }
            : post
        )
      );
    } catch (err) {
      console.error('Delete comment error:', err);
      toast.error('Failed to delete comment');
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!selectedPost || !editingComment) return;

    try {
      await axios.put(`/api/reels/${selectedPost._id}/comment/${commentId}`, { text: editingComment.text }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              comments: (prev.comments || []).map((c) =>
                c._id === commentId ? { ...c, text: editingComment.text, updated_at: new Date().toISOString() } : c
              ),
            }
          : prev
      );
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === selectedPost._id
            ? { ...post, comments: (post.comments || []).map((c) => (c._id === commentId ? { ...c, text: editingComment.text } : c)) }
            : post
        )
      );
      setEditingComment(null);
    } catch (err) {
      console.error('Edit comment error:', err);
      toast.error('Failed to edit comment');
    }
  };

  const handleReplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedPost || !replyingTo) return;

    const replyToAdd = replyText.trim();
    setReplyText('');

    try {
      await axios.post(
        `/api/reels/${selectedPost._id}/comment/${replyingTo.commentId}/reply`,
        { text: replyToAdd },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedPostResponse = await axios.get(`/api/reels/${selectedPost._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedPost(updatedPostResponse.data);
      setPosts((prevPosts) =>
        prevPosts.map((post) => (post._id === selectedPost._id ? updatedPostResponse.data : post))
      );
      setExpandedReplies((prev) => ({ ...prev, [replyingTo.commentId]: true }));
      setReplyingTo(null);
    } catch (err) {
      console.error('Reply error:', err);
      setReplyText(replyToAdd);
      toast.error('Failed to post reply');
    }
  };

  const handleLikeReply = async (commentId: string, replyId: string) => {
    if (!selectedPost) return;

    const likeKey = `${commentId}-${replyId}`;
    try {
      const isLiked = likedReplies.has(likeKey);
      const newLikedReplies = new Set(likedReplies);
      if (isLiked) newLikedReplies.delete(likeKey);
      else newLikedReplies.add(likeKey);
      setLikedReplies(newLikedReplies);

      await axios.post(
        `/api/reels/${selectedPost._id}/comment/${commentId}/reply/${replyId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Like reply error:', err);
    }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!selectedPost || !window.confirm('Delete this reply?')) return;

    try {
      await axios.delete(
        `/api/reels/${selectedPost._id}/comment/${commentId}/reply/${replyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              comments: (prev.comments || []).map((c) =>
                c._id === commentId ? { ...c, replies: (c.replies || []).filter((r) => r._id !== replyId) } : c
              ),
            }
          : prev
      );
    } catch (err) {
      console.error('Delete reply error:', err);
      toast.error('Failed to delete reply');
    }
  };

  const handleEditReply = async () => {
    if (!selectedPost || !editingReply) return;

    try {
      await axios.put(
        `/api/reels/${selectedPost._id}/comment/${editingReply.commentId}/reply/${editingReply.replyId}`,
        { text: editingReply.text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              comments: (prev.comments || []).map((c) =>
                c._id === editingReply.commentId
                  ? { ...c, replies: (c.replies || []).map((r) => (r._id === editingReply.replyId ? { ...r, text: editingReply.text } : r)) }
                  : c
              ),
            }
          : prev
      );
      setEditingReply(null);
    } catch (err) {
      console.error('Edit reply error:', err);
      toast.error('Failed to edit reply');
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  // Initialize liked comments/replies when opening a post modal
  const openCommentModal = (post: Post) => {
    setSelectedPost(post);
    if (currentUserId && post.comments) {
      const liked = new Set<string>();
      const likedR = new Set<string>();
      for (const comment of post.comments) {
        if (comment.likes?.some((id: any) => {
          const idStr = typeof id === 'object' ? id._id?.toString() || id.toString() : id;
          return idStr === currentUserId;
        })) {
          liked.add(comment._id);
        }
        for (const reply of comment.replies || []) {
          if (reply.likes?.some((id: any) => {
            const idStr = typeof id === 'object' ? id._id?.toString() || id.toString() : id;
            return idStr === currentUserId;
          })) {
            likedR.add(`${comment._id}-${reply._id}`);
          }
        }
      }
      setLikedComments(liked);
      setLikedReplies(likedR);
    }
  };

  const isOwner = (userId?: PostUser | string) => {
    if (!currentUserId) return false;
    const id = typeof userId === 'object' ? userId?._id : userId;
    return id === currentUserId;
  };

  const handleShare = async (post: Post) => {
    const shareData = {
      title: `Post by ${post.userId?.authId?.username || 'Unknown'}`,
      text: post.caption || 'Check out this post!',
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard!');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share error:', err);
      }
    }
  };

  const nextMedia = (postId: string, mediaLength: number) => {
    setCurrentMediaIndex((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % mediaLength,
    }));
  };

  const prevMedia = (postId: string, mediaLength: number) => {
    setCurrentMediaIndex((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + mediaLength) % mediaLength,
    }));
  };

  // Track post views using IntersectionObserver
  const postObserverRef = useRef<IntersectionObserver | null>(null);

  const trackView = useCallback((postId: string) => {
    if (viewedPostsRef.current.has(postId)) return;
    viewedPostsRef.current.add(postId);
    axios.post(`/api/reels/${postId}/view`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => { /* silent */ });
  }, [token]);

  useEffect(() => {
    postObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = (entry.target as HTMLElement).dataset.postId;
            if (postId) trackView(postId);
          }
        });
      },
      { threshold: 0.5 }
    );
    return () => postObserverRef.current?.disconnect();
  }, [trackView]);

  const postRefCallback = useCallback((node: HTMLElement | null) => {
    if (node && postObserverRef.current) {
      postObserverRef.current.observe(node);
    }
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-[470px] px-0 sm:px-4 py-4 sm:py-8">
        <div className="text-center text-theme-color">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[470px] px-0 sm:px-4 py-4 sm:py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="w-full max-w-[470px] px-4 py-8">
        <div className="text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[2px]">
            <div className="w-full h-full rounded-full flex items-center justify-center bg-theme-background">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-theme-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <p className="text-base sm:text-lg font-light mb-2 text-theme-color">No Posts Yet</p>
          <p className="text-xs sm:text-sm text-theme-color-50">
            When people you follow share photos and videos, they&apos;ll appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[470px] px-0 sm:px-4 py-2 sm:py-8">
      <StoryCircles />

      <div className="space-y-4 sm:space-y-6">
        {posts.map((post) => {
          const currentIndex = currentMediaIndex[post._id] || 0;
          const media = post.media || [];
          const currentMedia = media[currentIndex];

          return (
            <div key={post._id} data-post-id={post._id} ref={postRefCallback} className="border-b pb-4 sm:pb-6 border-theme-color">
              {/* Post Header */}
              <div className="flex items-center justify-between mb-2 sm:mb-3 px-3 sm:px-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[1.5px] cursor-pointer active:scale-95 transition-transform"
                    onClick={() => router.push(`/user/${post.userId?.authId?.username}`)}
                  >
                    <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-theme-background">
                      {post.userId?.profilePicture &&
                      post.userId.profilePicture !== 'default-profile-pic.jpg' &&
                      post.userId.profilePicture.startsWith('http') ? (
                        <img src={post.userId.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-avatar">
                          <span className="text-xs font-semibold text-white">
                            {post.userId?.authId?.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-sm font-semibold cursor-pointer hover:opacity-70 active:opacity-50 text-theme-color"
                    onClick={() => router.push(`/user/${post.userId?.authId?.username}`)}
                  >
                    {post.userId?.authId?.username || 'Unknown'}
                  </span>
                </div>
                <button className="p-2 -mr-2 hover:opacity-70 active:opacity-50" title="More options">
                  <MoreHorizontal className="w-5 h-5 sm:w-6 sm:h-6 text-theme-color" />
                </button>
              </div>

              {/* Post Media */}
              <div className="relative w-full aspect-square sm:rounded-sm overflow-hidden bg-black-solid">
                {currentMedia &&
                  (currentMedia.type === 'video' ? (
                    <video src={currentMedia.url} controls playsInline className="w-full h-full object-contain bg-black-solid" />
                  ) : (
                    <img src={currentMedia.url} alt="Post" className="w-full h-full object-contain bg-black-solid" />
                  ))}

                {media.length > 1 && (
                  <>
                    {currentIndex > 0 && (
                      <button
                        onClick={() => prevMedia(post._id, media.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white bg-opacity-80 flex items-center justify-center hover:bg-opacity-100 active:scale-95 transition-all"
                        title="Previous"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    {currentIndex < media.length - 1 && (
                      <button
                        onClick={() => nextMedia(post._id, media.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white bg-opacity-80 flex items-center justify-center hover:bg-opacity-100 active:scale-95 transition-all"
                        title="Next"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {media.map((_, index) => (
                        <div
                          key={index}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentIndex ? 'bg-blue-500 w-2 h-2' : 'bg-white bg-opacity-60'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Post Actions */}
              <div className="flex items-center justify-between mt-2 sm:mt-3 mb-2 px-3 sm:px-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button onClick={() => handleLike(post._id)} className="hover:opacity-70 active:scale-90 transition-all p-1">
                    {likedPosts.has(post._id) ? (
                      <Heart className="w-6 h-6 sm:w-6 sm:h-6 fill-red-500 text-red-500" />
                    ) : (
                      <Heart className="w-6 h-6 sm:w-6 sm:h-6 text-theme-color" />
                    )}
                  </button>
                  <button onClick={() => openCommentModal(post)} className="hover:opacity-70 active:scale-90 transition-all p-1" title="Comments">
                    <MessageCircle className="w-6 h-6 sm:w-6 sm:h-6 text-theme-color" />
                  </button>
                  <button onClick={() => handleShare(post)} className="hover:opacity-70 active:scale-90 transition-all p-1" title="Share">
                    <Send className="w-6 h-6 sm:w-6 sm:h-6 text-theme-color" />
                  </button>
                </div>
                <button onClick={() => handleSave(post._id)} className="hover:opacity-70 active:scale-90 transition-all p-1">
                  {savedPosts.has(post._id) ? (
                    <Bookmark className="w-6 h-6 sm:w-6 sm:h-6 fill-white text-theme-color" />
                  ) : (
                    <Bookmark className="w-6 h-6 sm:w-6 sm:h-6 text-theme-color" />
                  )}
                </button>
              </div>

              {/* Likes Count */}
              <div className="mb-1 sm:mb-2 px-3 sm:px-0">
                <span className="text-sm font-semibold text-theme-color">
                  {post.likes?.length || 0} likes
                </span>
              </div>

              {/* Caption */}
              {post.caption && (
                <div className="text-sm mb-1 sm:mb-2 px-3 sm:px-0">
                  <span
                    className="font-semibold mr-2 cursor-pointer hover:opacity-70 text-theme-color"
                    onClick={() => router.push(`/user/${post.userId?.authId?.username}`)}
                  >
                    {post.userId?.authId?.username}
                  </span>
                  <span className="text-theme-color">{post.caption}</span>
                </div>
              )}

              {/* Comments Preview */}
              {post.comments && post.comments.length > 0 && (
                <button
                  onClick={() => openCommentModal(post)}
                  className="text-sm mb-1 sm:mb-2 hover:opacity-70 px-3 sm:px-0 text-theme-color-50"
                >
                  View all {post.comments.length} comments
                </button>
              )}

              {/* Timestamp */}
              <div className="text-[10px] sm:text-xs px-3 sm:px-0 text-theme-color-50">
                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comments Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedPost(null)}>
          <div
            className="w-full sm:max-w-4xl h-[90vh] sm:h-[80vh] rounded-t-2xl sm:rounded-xl overflow-hidden flex flex-col sm:flex-row bg-theme-background"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left side - Media */}
            <div className="hidden sm:flex sm:w-1/2 bg-black items-center justify-center">
              {selectedPost.media && selectedPost.media[0] &&
                (selectedPost.media[0].type === 'video' ? (
                  <video src={selectedPost.media[0].url} controls playsInline className="max-w-full max-h-full" />
                ) : (
                  <img src={selectedPost.media[0].url} alt="Post" className="max-w-full max-h-full object-contain" />
                ))}
            </div>

            {/* Right side - Comments */}
            <div className="w-full sm:w-1/2 flex flex-col h-full bg-theme-background">
              {/* Header */}
              <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-theme-color">
                <div className="sm:hidden w-full flex justify-center -mt-1 mb-2">
                  <div className="w-10 h-1 rounded-full bg-gray-400"></div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[1.5px]">
                  <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-theme-background">
                    {selectedPost.userId?.profilePicture &&
                    selectedPost.userId.profilePicture !== 'default-profile-pic.jpg' &&
                    selectedPost.userId.profilePicture.startsWith('http') ? (
                      <img src={selectedPost.userId.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-avatar">
                        <span className="text-xs font-semibold text-white">
                          {selectedPost.userId?.authId?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold flex-1 text-theme-color">
                  {selectedPost.userId?.authId?.username || 'Unknown'}
                </span>
                <button onClick={() => setSelectedPost(null)} className="p-2 hover:opacity-70 sm:hidden text-theme-color">
                  ✕
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Caption as first comment */}
                {selectedPost.caption && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[1.5px] flex-shrink-0">
                      <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-theme-background">
                        {selectedPost.userId?.profilePicture &&
                        selectedPost.userId.profilePicture !== 'default-profile-pic.jpg' &&
                        selectedPost.userId.profilePicture.startsWith('http') ? (
                          <img src={selectedPost.userId.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-avatar">
                            <span className="text-xs font-semibold text-white">
                              {selectedPost.userId?.authId?.username?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold mr-2 text-theme-color">
                        {selectedPost.userId?.authId?.username}
                      </span>
                      <span className="text-sm text-theme-color">{selectedPost.caption}</span>
                    </div>
                  </div>
                )}

                {/* Comments */}
                {selectedPost.comments &&
                  selectedPost.comments.map((comment) => (
                    <div key={comment._id} className="space-y-2">
                      {/* Main Comment */}
                      <div className="flex gap-3">
                        <div
                          className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[1.5px] flex-shrink-0 cursor-pointer"
                          onClick={() => router.push(`/user/${comment.userId?.authId?.username}`)}
                        >
                          <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-theme-background">
                            {comment.userId?.profilePicture &&
                            comment.userId.profilePicture !== 'default-profile-pic.jpg' &&
                            comment.userId.profilePicture.startsWith('http') ? (
                              <img src={comment.userId.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-avatar">
                                <span className="text-xs font-semibold text-white">
                                  {comment.userId?.authId?.username?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          {editingComment?.commentId === comment._id ? (
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={editingComment.text}
                                onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                                className="text-sm px-2 py-1 rounded border theme-input"
                                placeholder="Edit comment"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button onClick={() => handleEditComment(comment._id)} className="text-xs text-blue-500 font-semibold">
                                  Save
                                </button>
                                <button onClick={() => setEditingComment(null)} className="text-xs font-semibold text-theme-color-50">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>
                                <span
                                  className="text-sm font-semibold mr-2 cursor-pointer hover:opacity-70 text-theme-color"
                                  onClick={() => router.push(`/user/${comment.userId?.authId?.username}`)}
                                >
                                  {comment.userId?.authId?.username || 'Unknown'}
                                </span>
                                <span className="text-sm text-theme-color">
                                  {comment.text}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-theme-color-50">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                                {comment.likes && comment.likes.length > 0 && (
                                  <span className="text-xs font-semibold text-theme-color-70">
                                    {comment.likes.length} {comment.likes.length === 1 ? 'like' : 'likes'}
                                  </span>
                                )}
                                <button
                                  onClick={() => setReplyingTo({ commentId: comment._id, username: comment.userId?.authId?.username || '' })}
                                  className="text-xs font-semibold text-theme-color-70"
                                >
                                  Reply
                                </button>
                                {isOwner(comment.userId) && (
                                  <button onClick={() => setEditingComment({ commentId: comment._id, text: comment.text })} className="hover:opacity-70" title="Edit comment">
                                    <Edit2 className="w-3 h-3 text-theme-color-50" />
                                  </button>
                                )}
                                {(isOwner(comment.userId) || isOwner(selectedPost.userId)) && (
                                  <button onClick={() => handleDeleteComment(comment._id)} className="hover:opacity-70" title="Delete comment">
                                    <Trash2 className="w-3 h-3 text-red-400" />
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        <button onClick={() => handleLikeComment(comment._id)} className="flex-shrink-0 hover:opacity-70" title="Like comment">
                          <Heart
                            className={`w-3 h-3 ${likedComments.has(comment._id) ? 'fill-red-500 text-red-500' : 'text-theme-color-50'}`}
                          />
                        </button>
                      </div>

                      {/* View replies toggle */}
                      {comment.replies && comment.replies.length > 0 && (
                        <button
                          onClick={() => toggleReplies(comment._id)}
                          className="flex items-center gap-2 ml-11 text-xs font-semibold text-theme-color-50"
                        >
                          <div className="w-6 h-[1px] bg-text-theme-30"></div>
                          {expandedReplies[comment._id] ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              Hide replies
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                            </>
                          )}
                        </button>
                      )}

                      {/* Replies */}
                      {expandedReplies[comment._id] &&
                        comment.replies &&
                        comment.replies.map((reply) => (
                          <div key={reply._id} className="flex gap-3 ml-11">
                            <div
                              className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[1px] flex-shrink-0 cursor-pointer"
                              onClick={() => router.push(`/user/${reply.userId?.authId?.username}`)}
                            >
                              <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-theme-background">
                                {reply.userId?.profilePicture &&
                                reply.userId.profilePicture !== 'default-profile-pic.jpg' &&
                                reply.userId.profilePicture.startsWith('http') ? (
                                  <img src={reply.userId.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-avatar">
                                    <span className="text-[10px] font-semibold text-white">
                                      {reply.userId?.authId?.username?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              {editingReply?.replyId === reply._id ? (
                                <div className="flex flex-col gap-2">
                                  <input
                                    type="text"
                                    value={editingReply.text}
                                    onChange={(e) => setEditingReply({ ...editingReply, text: e.target.value })}
                                    className="text-xs px-2 py-1 rounded border theme-input"
                                    placeholder="Edit reply"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <button onClick={handleEditReply} className="text-xs text-blue-500 font-semibold">
                                      Save
                                    </button>
                                    <button onClick={() => setEditingReply(null)} className="text-xs font-semibold text-theme-color-50">
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <span
                                      className="text-xs font-semibold mr-2 cursor-pointer hover:opacity-70 text-theme-color"
                                      onClick={() => router.push(`/user/${reply.userId?.authId?.username}`)}
                                    >
                                      {reply.userId?.authId?.username || 'Unknown'}
                                    </span>
                                    <span className="text-xs text-theme-color">
                                      {reply.text}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] text-theme-color-50">
                                      {new Date(reply.created_at).toLocaleDateString()}
                                    </span>
                                    {reply.likes && reply.likes.length > 0 && (
                                      <span className="text-[10px] font-semibold text-theme-color-70">
                                        {reply.likes.length} {reply.likes.length === 1 ? 'like' : 'likes'}
                                      </span>
                                    )}
                                    {isOwner(reply.userId) && (
                                      <button
                                        onClick={() => setEditingReply({ commentId: comment._id, replyId: reply._id, text: reply.text })}
                                        className="hover:opacity-70"
                                        title="Edit reply"
                                      >
                                        <Edit2 className="w-2.5 h-2.5 text-theme-color-50" />
                                      </button>
                                    )}
                                    {(isOwner(reply.userId) || isOwner(comment.userId) || isOwner(selectedPost.userId)) && (
                                      <button onClick={() => handleDeleteReply(comment._id, reply._id)} className="hover:opacity-70" title="Delete reply">
                                        <Trash2 className="w-2.5 h-2.5 text-red-400" />
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                            <button onClick={() => handleLikeReply(comment._id, reply._id)} className="flex-shrink-0 hover:opacity-70" title="Like reply">
                              <Heart
                                className={`w-2.5 h-2.5 ${likedReplies.has(`${comment._id}-${reply._id}`) ? 'fill-red-500 text-red-500' : 'text-theme-color-50'}`}
                              />
                            </button>
                          </div>
                        ))}

                      {/* Reply input */}
                      {replyingTo?.commentId === comment._id && (
                        <form onSubmit={handleReplySubmit} className="flex items-center gap-2 ml-11 mt-2">
                          <CornerDownRight className="w-4 h-4 flex-shrink-0 text-theme-color-30" />
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to @${replyingTo.username}...`}
                            className="flex-1 text-xs px-3 py-1.5 rounded-full border focus:outline-none focus:ring-1 focus:ring-blue-500 theme-input"
                            autoFocus
                          />
                          <button type="submit" disabled={!replyText.trim()} className="text-xs font-semibold text-blue-500 disabled:opacity-30">
                            Post
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                            className="hover:opacity-70"
                            title="Cancel reply"
                          >
                            <X className="w-4 h-4 text-theme-color-50" />
                          </button>
                        </form>
                      )}
                    </div>
                  ))}
              </div>

              {/* Actions */}
              <div className="border-t p-4 border-theme-color">
                <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => handleLike(selectedPost._id)} className="hover:opacity-70">
                    {likedPosts.has(selectedPost._id) ? (
                      <Heart className="w-6 h-6 fill-red-500 text-red-500" />
                    ) : (
                      <Heart className="w-6 h-6 text-theme-color" />
                    )}
                  </button>
                  <MessageCircle className="w-6 h-6 text-theme-color" />
                  <Send className="w-6 h-6 text-theme-color" />
                </div>
                <div className="text-sm font-semibold mb-3 text-theme-color">
                  {selectedPost.likes?.length || 0} likes
                </div>

                <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-0 py-2 text-sm border-0 focus:outline-none bg-transparent text-theme-color"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment}
                    className="text-sm font-semibold text-blue-500 hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1"
                  >
                    {submittingComment ? 'Posting...' : 'Post'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
