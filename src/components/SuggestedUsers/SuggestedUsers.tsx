'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

interface SuggestedUser {
  _id: string;
  username: string;
  name?: string;
  profilePicture?: string;
}

const SuggestedUsers = () => {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set<string>());
  const [loading, setLoading] = useState(true);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const token = getToken();
        if (!token) return;

        // Get own profile for following list
        const profileRes = await axios.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const myFollowing: string[] = profileRes.data.following || [];
        setFollowingSet(new Set<string>(myFollowing));

        // Get all users
        const allUsersRes = await axios.get('/api/auth/all', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allUsers: SuggestedUser[] = allUsersRes.data;

        // Filter out self
        const myId = profileRes.data._id;
        setUsers(allUsers.filter((u) => u._id !== myId));
      } catch (err) {
        console.error('Error fetching suggested users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggested();
  }, []);

  const toggleFollow = async (userId: string) => {
    const token = getToken();
    if (!token) return;

    const isFollowing = followingSet.has(userId);
    const endpoint = isFollowing
      ? `/api/users/unfollow/${userId}`
      : `/api/users/follow/${userId}`;

    // Optimistic update
    setFollowingSet((prev) => {
      const next = new Set(prev);
      if (isFollowing) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });

    try {
      await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Error toggling follow:', err);
      // Revert on error
      setFollowingSet((prev) => {
        const next = new Set(prev);
        if (isFollowing) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">
          Suggested Users
        </h1>

        {users.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No users to suggest
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {users.map((user) => (
              <div
                key={user._id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 flex flex-col items-center gap-3 shadow-sm"
              >
                <Link href={`/user/${user.username}`}>
                  <img
                    src={user.profilePicture || '/default-avatar.svg'}
                    alt={user.username}
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.svg';
                    }}
                  />
                </Link>
                <Link
                  href={`/user/${user.username}`}
                  className="font-semibold text-sm dark:text-white hover:underline"
                >
                  {user.username}
                </Link>
                {user.name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                    {user.name}
                  </p>
                )}
                <button
                  onClick={() => toggleFollow(user._id)}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    followingSet.has(user._id)
                      ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {followingSet.has(user._id) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestedUsers;
