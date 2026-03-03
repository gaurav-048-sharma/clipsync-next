'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface FollowUser {
  _id: string;
  username: string;
  name?: string;
  profilePicture?: string;
}

interface FollowListProps {
  type: 'followers' | 'following';
}

const FollowList = ({ type }: FollowListProps) => {
  const params = useParams();
  const username = params?.username as string;
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set<string>());

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = getToken();
        const response = await axios.get(`/api/users/${type}/${username}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // API returns { followers/following: [{ _id, authId: { username, name, email }, profilePicture, bio }] }
        const rawList = response.data[type] || response.data || [];
        const mapped: FollowUser[] = rawList.map((u: any) => ({
          _id: u._id,
          username: u.authId?.username || u.username || 'unknown',
          name: u.authId?.name || u.name,
          profilePicture: u.profilePicture,
        }));
        setUsers(mapped);

        // Get current user's following list (as UserProfile IDs) for toggle state
        const meResponse = await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // meResponse.data.following is an array of UserProfile ObjectIds
        const myFollowing: string[] = (meResponse.data.following || []).map((f: any) =>
          typeof f === 'object' ? f._id?.toString() || f.toString() : f.toString()
        );
        setFollowingSet(new Set<string>(myFollowing));
      } catch (err) {
        console.error('Error fetching follow list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [type, username]);

  const toggleFollow = async (user: FollowUser) => {
    const token = getToken();
    if (!token) return;

    const isFollowing = followingSet.has(user._id);
    const endpoint = isFollowing
      ? `/api/users/unfollow/${user.username}`
      : `/api/users/follow/${user.username}`;

    // Optimistic update
    setFollowingSet((prev) => {
      const next = new Set(prev);
      if (isFollowing) {
        next.delete(user._id);
      } else {
        next.add(user._id);
      }
      return next;
    });

    try {
      await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Error toggling follow:', err);
      // Revert
      setFollowingSet((prev) => {
        const next = new Set(prev);
        if (isFollowing) {
          next.add(user._id);
        } else {
          next.delete(user._id);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold mb-4 dark:text-white capitalize">
          {username}&apos;s {type}
        </h1>

        {users.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No {type} yet
          </p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl"
              >
                <Link
                  href={`/user/${user.username}`}
                  className="flex items-center gap-3"
                >
                  <img
                    src={user.profilePicture || '/default-avatar.svg'}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.svg';
                    }}
                  />
                  <div>
                    <p className="font-semibold text-sm dark:text-white">
                      {user.username}
                    </p>
                    {user.name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.name}
                      </p>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => toggleFollow(user)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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

export default FollowList;
