'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { BarChart3, Settings as SettingsIcon, Menu } from 'lucide-react';
import Navbar from '@/components/Dashboard/Navbar';
import EditProfile from './EditProfile';
import ProfileAnalytics from './ProfileAnalytics';
import Settings from './Settings';

interface ProfileAuth {
  username: string;
  name: string;
}

interface College {
  name: string;
  city: string;
}

interface Segregation {
  type: string;
  year?: string;
  dept?: string;
  roll?: string;
}

interface ProfileData {
  authId: ProfileAuth;
  profilePicture: string;
  bio: string;
  segregation?: Segregation;
  college?: College;
  enrollmentId?: string;
  department?: string;
}

interface ReelMedia {
  url: string;
  type: 'video' | 'image';
}

interface Reel {
  _id: string;
  videoUrl?: string;
  media?: ReelMedia[];
  likes?: string[];
  comments?: any[];
  caption?: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [reels, setReels] = useState<Reel[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const router = useRouter();

  const fetchProfileData = async () => {
    try {
      const profileResponse = await axios.get('/api/users/', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const profileName = profileResponse.data.authId.name || profileResponse.data.authId.username;

      setProfile({
        authId: {
          username: profileResponse.data.authId.username,
          name: profileName,
        },
        profilePicture: profileResponse.data.profilePicture,
        bio: profileResponse.data.bio,
        segregation: profileResponse.data.segregation,
        college: profileResponse.data.college,
        enrollmentId: profileResponse.data.enrollmentId,
        department: profileResponse.data.department,
      });

      const username = profileResponse.data.authId.username;
      const followersResponse = await axios.get(`/api/users/followers/${username}`);
      setFollowersCount(followersResponse.data.followers.length);

      const followingResponse = await axios.get(`/api/users/following/${username}`);
      setFollowingCount(followingResponse.data.following.length);

      // Fetch user's posts
      const reelsResponse = await axios.get(
        `/api/reels/user/${username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReels(reelsResponse.data || []);
    } catch (err: any) {
      console.error('Profile fetch error:', err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        console.log('Profile data load failed, but keeping session');
      }
    }
  };

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProfileData();
  }, [token]);

  useEffect(() => {
    const handleFocus = () => {
      if (token) {
        fetchProfileData();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleSaveProfile = (updatedData: any) => {
    console.log('Saving profile data:', updatedData);
    fetchProfileData();
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  if (!profile) return <div className="text-center mt-10 text-lg">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row pt-14 pb-16 md:pt-0 md:pb-0 bg-theme-background">
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 md:ml-64 pt-4 md:pt-4 pb-4">
        {/* Mobile Profile Header with Settings */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 mb-2">
          <h1 className="text-xl font-semibold text-theme-color">
            {profile.authId.username}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSettings(true)}
              className="active:scale-90 transition-transform"
              title="Menu"
            >
              <Menu className="w-6 h-6 text-theme-color" />
            </button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="w-full max-w-[935px] mx-auto px-4 md:px-5 mb-6 sm:mb-11">
          {/* Desktop Settings Icon */}
          <div className="hidden md:flex justify-end mb-4">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Settings"
            >
              <SettingsIcon className="w-6 h-6 text-theme-color" />
            </button>
          </div>
          
          <div className="flex items-start gap-4 sm:gap-7 md:gap-24 mb-6 sm:mb-11">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-[77px] h-[77px] sm:w-20 sm:h-20 md:w-[150px] md:h-[150px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[2px]">
                <div className="w-full h-full rounded-full p-[2px] sm:p-[3px] bg-theme-background">
                  {profile.profilePicture && profile.profilePicture !== 'default-profile-pic.jpg' && profile.profilePicture.startsWith('http') ? (
                    <img
                      src={profile.profilePicture}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        (target.nextSibling as HTMLElement).style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-full h-full rounded-full flex items-center justify-center bg-gradient-avatar"
                    style={{ 
                      display: profile.profilePicture && profile.profilePicture !== 'default-profile-pic.jpg' && profile.profilePicture.startsWith('http') ? 'none' : 'flex'
                    }}
                  >
                    <span className="text-xl sm:text-2xl md:text-5xl font-semibold text-white">
                      {profile.authId?.name?.charAt(0)?.toUpperCase() || profile.authId?.username?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              {/* Username and Edit Button */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
                <h2 className="text-lg sm:text-xl md:text-[28px] font-light truncate text-theme-color">
                  {profile.authId.username}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-lg border-text-theme"
                    onClick={handleEditClick}
                  >
                    Edit profile
                  </Button>
                  <Button
                    variant="outline"
                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1 sm:gap-2 border-text-theme"
                    onClick={() => setShowAnalytics(!showAnalytics)}
                  >
                    <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{showAnalytics ? 'Hide Stats' : 'View Stats'}</span>
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex gap-10 mb-5">
                <span className="text-theme-color">
                  <span className="font-semibold">{reels.length}</span> posts
                </span>
                <button
                  className="hover:opacity-70 transition-opacity text-theme-color"
                  onClick={() => router.push(`/followers/${profile.authId.username}`)}
                >
                  <span className="font-semibold">{followersCount}</span> followers
                </button>
                <button
                  className="hover:opacity-70 transition-opacity text-theme-color"
                  onClick={() => router.push(`/following/${profile.authId.username}`)}
                >
                  <span className="font-semibold">{followingCount}</span> following
                </button>
              </div>

              {/* Name and Bio */}
              <div className="space-y-1">
                <p className="font-semibold text-theme-color">
                  {profile.authId.name}
                </p>
                {profile.college && profile.college.name && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      🎓 {profile.department ? `${profile.department} • ` : ''}{profile.college.name}, {profile.college.city}
                    </span>
                    {profile.enrollmentId && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-border-color">
                        {profile.enrollmentId}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-sm text-theme-color">
                  {profile.bio || 'No bio yet'}
                </p>
                {profile.segregation && profile.segregation.type === 'student' && (
                  <p className="text-sm text-theme-color-50">
                    {profile.segregation.year} • {profile.segregation.dept} • {profile.segregation.roll}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="md:hidden border-t border-b py-2.5 sm:py-3 mb-2 sm:mb-3 border-theme-color">
          <div className="flex justify-around text-center">
            <div className="px-2">
              <div className="text-sm sm:text-base font-semibold text-theme-color">{reels.length}</div>
              <div className="text-[10px] sm:text-xs text-theme-color-50">posts</div>
            </div>
            <button
              className="hover:opacity-70 transition-opacity active:scale-95 px-2"
              onClick={() => router.push(`/followers/${profile.authId.username}`)}
            >
              <div className="text-sm sm:text-base font-semibold text-theme-color">{followersCount}</div>
              <div className="text-[10px] sm:text-xs text-theme-color-50">followers</div>
            </button>
            <button
              className="hover:opacity-70 transition-opacity active:scale-95 px-2"
              onClick={() => router.push(`/following/${profile.authId.username}`)}
            >
              <div className="text-sm sm:text-base font-semibold text-theme-color">{followingCount}</div>
              <div className="text-[10px] sm:text-xs text-theme-color-50">following</div>
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="w-full max-w-[935px] mx-auto mb-8">
            <ProfileAnalytics username={profile.authId.username} />
          </div>
        )}

        {/* Posted Reels Section */}
        <div className="w-full max-w-[935px] mx-auto">
          {/* Tabs */}
          <div className="border-t border-theme-color">
            <div className="flex justify-center">
              <button className="flex items-center gap-2 px-4 py-3 border-t-2 border-black dark:border-white">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                </svg>
                <span className="text-xs font-semibold tracking-wider uppercase text-theme-color">POSTS</span>
              </button>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="px-0 sm:px-4 md:px-0">
            {reels.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full border-2 flex items-center justify-center border-text-color">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-theme-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl sm:text-3xl font-light mb-2 text-theme-color">Share Photos</h3>
                <p className="text-xs sm:text-sm px-4 text-theme-color-50">When you share photos, they will appear on your profile.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 sm:gap-1 md:gap-7">
                {reels.map((reel) => {
                  const firstMedia = reel.media?.[0] || { url: reel.videoUrl || '', type: 'video' as const };
                  
                  return (
                    <div
                      key={reel._id}
                      className="aspect-square bg-black flex items-center justify-center cursor-pointer hover:opacity-75 transition-opacity relative overflow-hidden group"
                      onClick={() => router.push(`/reels/user/${profile.authId.username}`)}
                    >
                      {firstMedia.type === 'video' ? (
                        <video
                          src={firstMedia.url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={firstMedia.url}
                          alt="Post"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-6 text-white">
                          <div className="flex items-center gap-2">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            <span className="font-semibold">{reel.likes?.length || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
                            </svg>
                            <span className="font-semibold">{reel.comments?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                      {/* Multiple media indicator */}
                      {reel.media && reel.media.length > 1 && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="13" y="3" width="7" height="7" />
                            <rect x="3" y="13" width="7" height="7" />
                            <rect x="13" y="13" width="7" height="7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <EditProfile
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveProfile}
            initialData={profile}
            token={token || ''}
          />
        )}

        {/* Settings Panel */}
        <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    </div>
  );
};

export default Profile;
