'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Dashboard/Navbar';
import EditProfile from './EditProfile';

const ProfileWithRedux = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { profile, followers, following, isLoading, error } = useAppSelector((state) => state.user);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [reels] = useState([1, 2, 3, 4, 5, 6]); // Placeholder

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Note: fetchOwnProfile would need to be added to userSlice as an async thunk
    // dispatch(fetchOwnProfile());
  }, [dispatch, router]);

  useEffect(() => {
    if (profile?.authId?.username) {
      // dispatch(fetchFollowers(profile.authId.username));
      // dispatch(fetchFollowing(profile.authId.username));
    }
  }, [dispatch, profile?.authId?.username]);

  const handleSaveProfile = () => {
    // dispatch(fetchOwnProfile());
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-xl mb-4">Error: {error}</p>
          <Button onClick={() => {}}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      <Navbar />

      <div className="w-full md:w-4/5 md:ml-64 p-4 flex flex-col">
        {/* Profile Header */}
        <div className="w-full max-w-4xl mx-auto mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8 p-4">
            <img
              src={profile.profilePicture || 'https://via.placeholder.com/150'}
              alt="Profile"
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-gray-300"
            />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-semibold mb-2">
                {profile.authId?.username}
              </h2>

              {/* Stats */}
              <div className="flex justify-center md:justify-start space-x-6 mb-4">
                <div className="text-center">
                  <span className="font-bold">{reels.length}</span>
                  <p className="text-sm text-gray-600">Posts</p>
                </div>
                <div
                  className="text-center cursor-pointer hover:underline"
                  onClick={() => router.push(`/followers/${profile.authId?.username}`)}
                >
                  <span className="font-bold">{followers?.length || 0}</span>
                  <p className="text-sm text-gray-600">Followers</p>
                </div>
                <div
                  className="text-center cursor-pointer hover:underline"
                  onClick={() => router.push(`/following/${profile.authId?.username}`)}
                >
                  <span className="font-bold">{following?.length || 0}</span>
                  <p className="text-sm text-gray-600">Following</p>
                </div>
              </div>

              {/* Name and Bio */}
              <div className="mb-4">
                <p className="text-md font-medium text-gray-900">{profile.authId?.name}</p>
                <p className="text-sm text-gray-600">{profile.bio || 'No bio yet'}</p>
              </div>

              {/* Edit Profile Button */}
              <Button
                variant="outline"
                className="w-full max-w-xs py-2 text-sm font-semibold"
                onClick={handleEditClick}
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Posted Reels Section */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-center mb-4">Posts</h3>
            <div className="grid grid-cols-3 gap-1 md:gap-4">
              {reels.length === 0 ? (
                <p className="text-center text-gray-600 col-span-3">No reels posted yet</p>
              ) : (
                reels.map((reel, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-gray-300 flex items-center justify-center cursor-pointer hover:opacity-80"
                    onClick={() => router.push(`/reels/user/${profile.authId?.username}`)}
                  >
                    <span className="text-white text-sm">Reel {index + 1}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <EditProfile
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveProfile}
            initialData={profile as any}
            token={typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileWithRedux;
