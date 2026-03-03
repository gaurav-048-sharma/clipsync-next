'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface CollegeInfo {
  name?: string;
  department?: string;
  city?: string;
}

interface AuthInfo {
  _id: string;
  username: string;
  name?: string;
  email?: string;
  college?: CollegeInfo;
  enrollmentId?: string;
  segregation?: { type?: string; year?: string; dept?: string; roll?: string };
}

interface UserProfileData {
  _id: string;
  authId: AuthInfo;
  bio?: string;
  profilePicture?: string;
  college?: CollegeInfo | string;
  department?: string;
  enrollmentId?: string;
  segregation?: { type?: string; year?: string; dept?: string; roll?: string };
  followers: string[];
  following: string[];
  isPrivate?: boolean;
}

interface ReelMedia {
  url: string;
  type: string;
}

interface UserReel {
  _id: string;
  media: ReelMedia[];
  likes: string[];
  comments: any[];
  caption?: string;
}

const UserProfile = () => {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;

  const [user, setUser] = useState<UserProfileData | null>(null);
  const [reels, setReels] = useState<UserReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = getToken();
        const encodedUsername = encodeURIComponent(username);

        // Check if it's own profile
        const meRes = await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const myUsername = meRes.data?.authId?.username || meRes.data?.username;
        // Use UserProfile _id (not auth _id) since followers array contains UserProfile IDs
        const myProfileId = meRes.data?._id;
        if (myUsername === username) {
          router.push('/profile');
          return;
        }

        // Fetch user data from the correct endpoint
        const userRes = await axios.get(`/api/users/${encodedUsername}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData: UserProfileData = userRes.data;
        setUser(userData);
        setFollowersCount(userData.followers?.length || 0);
        // Check if current user's UserProfile ID is in the followers list
        const followerIds = (userData.followers || []).map((f: any) =>
          typeof f === 'object' ? f._id?.toString() : f?.toString()
        );
        setIsFollowing(followerIds.includes(myProfileId?.toString()));

        // Fetch user reels
        try {
          const reelsRes = await axios.get(`/api/reels/user/${encodedUsername}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setReels(reelsRes.data);
        } catch {
          // User might not have reels
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [username, router]);

  const handleFollowToggle = async () => {
    const token = getToken();
    if (!token || !user) return;

    // Follow/unfollow endpoints expect a username
    const uname = user.authId?.username || username;
    const endpoint = isFollowing
      ? `/api/users/unfollow/${uname}`
      : `/api/users/follow/${uname}`;

    // Optimistic update
    setIsFollowing(!isFollowing);
    setFollowersCount((prev) => (isFollowing ? prev - 1 : prev + 1));

    try {
      await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Error toggling follow:', err);
      // Revert
      setIsFollowing(isFollowing);
      setFollowersCount((prev) => (isFollowing ? prev + 1 : prev - 1));
    }
  };

  const handleMessage = () => {
    if (!user) return;
    const authId = user.authId?._id || user._id;
    const uname = user.authId?.username || username;
    router.push(`/messages?userId=${authId}&username=${uname}`);
  };

  const getCollegeDisplay = (college?: CollegeInfo | string): string | null => {
    if (!college) return null;
    if (typeof college === 'string') return college;
    if (college.name) {
      return college.department
        ? `${college.name} - ${college.department}`
        : college.name;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 dark:text-gray-400">User not found</p>
      </div>
    );
  }

  const displayUsername = user.authId?.username || username;
  const displayName = user.authId?.name;
  const collegeDisplay = getCollegeDisplay(user.college || user.authId?.college);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
          {/* Profile Picture */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
              <img
                src={user.profilePicture || '/default-avatar.svg'}
                alt={displayUsername}
                className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-900"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-avatar.svg';
                }}
              />
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <h1 className="text-xl font-semibold dark:text-white">
                {displayUsername}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={handleFollowToggle}
                  className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isFollowing
                      ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={handleMessage}
                  className="px-6 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Message
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center md:justify-start gap-8 mb-4">
              <div className="text-center">
                <span className="font-bold dark:text-white">{reels.length}</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">Posts</p>
              </div>
              <Link
                href={`/followers/${displayUsername}`}
                className="text-center"
              >
                <span className="font-bold dark:text-white">{followersCount}</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
              </Link>
              <Link
                href={`/following/${displayUsername}`}
                className="text-center"
              >
                <span className="font-bold dark:text-white">
                  {user.following?.length || 0}
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">Following</p>
              </Link>
            </div>

            {/* Name & Bio */}
            {displayName && (
              <p className="font-semibold dark:text-white">{displayName}</p>
            )}
            {user.bio && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                {user.bio}
              </p>
            )}
            {collegeDisplay && (
              <span className="inline-block mt-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-3 py-1 rounded-full">
                🎓 {collegeDisplay}
              </span>
            )}
          </div>
        </div>

        {/* Posts Grid */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 text-center">
            Posts
          </h2>
          {reels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 dark:text-gray-500 text-lg">No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {reels.map((reel) => (
                <Link
                  key={reel._id}
                  href={`/reels/${reel._id}`}
                  className="relative aspect-square group"
                >
                  {reel.media?.[0]?.type?.startsWith('video') ? (
                    <video
                      src={reel.media[0].url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={reel.media?.[0]?.url || '/placeholder.png'}
                      alt={reel.caption || 'Post'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.png';
                      }}
                    />
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                    <span className="text-white font-semibold flex items-center gap-1">
                      ❤️ {reel.likes?.length || 0}
                    </span>
                    <span className="text-white font-semibold flex items-center gap-1">
                      💬 {reel.comments?.length || 0}
                    </span>
                  </div>
                  {/* Multi-media indicator */}
                  {reel.media?.length > 1 && (
                    <div className="absolute top-2 right-2">
                      <svg
                        className="w-5 h-5 text-white drop-shadow-lg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
                      </svg>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
