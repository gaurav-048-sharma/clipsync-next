'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
// TODO: Import these thunks when added to userSlice
// import { fetchFollowers, fetchFollowing, followUser, unfollowUser } from '@/store/slices/userSlice';

interface FollowListWithReduxProps {
  type: 'followers' | 'following';
}

const FollowListWithRedux = ({ type }: FollowListWithReduxProps) => {
  const params = useParams();
  const username = params?.username as string;
  const dispatch = useAppDispatch();

  // TODO: Replace with actual Redux selectors when thunks are created
  // const users = useAppSelector((state) => state.user[type]);
  // const loading = useAppSelector((state) => state.user.loading);
  // const myFollowing = useAppSelector((state) => state.user.following);
  const users: any[] = [];
  const loading = false;
  const myFollowing: string[] = [];

  useEffect(() => {
    // TODO: dispatch thunks when available
    // if (type === 'followers') {
    //   dispatch(fetchFollowers(username));
    // } else {
    //   dispatch(fetchFollowing(username));
    // }
  }, [type, username, dispatch]);

  const toggleFollow = (userId: string) => {
    const isFollowing = myFollowing.includes(userId);
    // TODO: dispatch follow/unfollow thunks
    // if (isFollowing) {
    //   dispatch(unfollowUser(userId));
    // } else {
    //   dispatch(followUser(userId));
    // }
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
            {users.map((user: any) => (
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
                  onClick={() => toggleFollow(user._id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    myFollowing.includes(user._id)
                      ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {myFollowing.includes(user._id) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowListWithRedux;
