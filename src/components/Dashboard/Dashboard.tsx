'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Dashboard/Navbar';
import Feed from '@/components/Dashboard/Feed';
import PrefetchLink from '@/components/ui/PrefetchLink';
import { Calendar, ShoppingBag, MessageSquare, Sparkles, Briefcase } from 'lucide-react';

const Dashboard = () => {
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const profileResponse = await axios.get('/api/users/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const username = profileResponse.data.authId.username;

        const followingResponse = await axios.get(`/api/users/following/${username}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const followingList = followingResponse.data.following.map(
          (user: any) => user.authId.username
        );
        setFollowing(followingList);

        const usersResponse = await axios.get('/api/auth/all');
        const filtered = usersResponse.data.filter(
          (user: any) => user.username !== username
        );
        setSuggestedUsers(filtered);
        setFilteredUsers(filtered);
      } catch (err: any) {
        // 401 errors are handled by the global axios interceptor (redirect to /login).
        // Only show error for non-auth failures.
        if (err.response?.status !== 401) {
          console.error('Fetch error:', err.response?.data || err.message);
          setError('Failed to load dashboard data');
        }
      }
    };
    fetchData();
  }, [token, router]);

  const handleSearch = async () => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(suggestedUsers);
      setIsSearchOpen(false);
      return;
    }
    try {
      const response = await axios.get('/api/auth/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filteredResults = response.data.filter((user: any) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filteredResults);
      setIsSearchOpen(false);
    } catch (err: any) {
      setError('Failed to search users');
      console.error('Search error:', err.response?.data || err.message);
    }
  };

  const handleFollowToggle = async (targetUsername: string) => {
    const isFollowing = following.includes(targetUsername);
    const action = isFollowing ? 'unfollow' : 'follow';
    setFollowing((prev) =>
      isFollowing
        ? prev.filter((u) => u !== targetUsername)
        : [...prev, targetUsername]
    );
    try {
      await axios.post(
        `/api/users/${action}/${targetUsername}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err: any) {
      setFollowing((prev) =>
        isFollowing
          ? [...prev, targetUsername]
          : prev.filter((u) => u !== targetUsername)
      );
      setError(`Failed to ${action} user`);
    }
  };

  const handleUserClick = (username: string) => {
    router.push(`/user/${username}`);
  };

  if (!token)
    return (
      <div className="text-center mt-10 text-red-500 text-sm sm:text-base">
        Please log in
      </div>
    );
  if (error)
    return (
      <div className="text-center mt-10 text-red-500 text-sm sm:text-base">
        {error}
      </div>
    );

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row pt-14 pb-14 md:pt-0 md:pb-0 bg-theme-background"
    >
      <Navbar />

      <div className="flex-1 md:ml-64 flex flex-col">
        <div
          className="sticky top-14 md:top-0 z-40 border-b border-gray-800/50 bg-theme-background"
        >
          <div className="flex items-center justify-center px-3 md:px-6 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <PrefetchLink
                to="/events"
                className="relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:opacity-80 active:scale-95 bg-black text-white dark:bg-white dark:text-black"
              >
                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Events</span>
              </PrefetchLink>

              <PrefetchLink
                to="/marketplace"
                className="relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:opacity-80 active:scale-95 bg-black text-white dark:bg-white dark:text-black"
              >
                <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Marketplace</span>
              </PrefetchLink>

              <PrefetchLink
                to="/confessions"
                className="relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:opacity-80 active:scale-95 bg-black text-white dark:bg-white dark:text-black"
              >
                <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Confessions</span>
              </PrefetchLink>

              <button
                onClick={() => router.push('/upload-story')}
                className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:opacity-80 active:scale-95 bg-black text-white dark:bg-white dark:text-black"
              >
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Add Story</span>
              </button>

              <PrefetchLink
                to="/opportunities"
                className="relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:opacity-80 active:scale-95 bg-black text-white dark:bg-white dark:text-black"
              >
                <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Opportunities</span>
              </PrefetchLink>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center overflow-y-auto">
          <Feed />
        </div>
      </div>

      {/* Suggested Users Sidebar */}
      <div className="hidden lg:block w-[319px] pt-4 px-4">
        <div className="sticky top-4">
          <div className="mb-6">
            <p
              className="text-sm font-semibold mb-4 text-theme-color-50"
            >
              Suggested for you
            </p>
          </div>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full mb-4 px-4 py-2 rounded-lg text-left text-sm font-semibold transition-colors"
            style={{
              backgroundColor: 'var(--hover-bg)',
              color: 'var(--text-color)',
            }}
          >
            🔍 Search
          </button>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
            {filteredUsers.length === 0 ? (
              <p
                className="text-center text-sm py-4 text-theme-color-50"
              >
                {searchQuery ? 'No users found' : 'No suggested users'}
              </p>
            ) : (
              filteredUsers.slice(0, 5).map((user) => (
                <div key={user._id} className="flex items-center gap-3">
                  <div
                    className="cursor-pointer flex items-center gap-3 flex-1"
                    onClick={() => handleUserClick(user.username)}
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[2px] flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className="text-base font-semibold text-theme-color"
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate text-theme-color"
                      >
                        {user.username}
                      </p>
                      <p
                        className="text-xs truncate text-theme-color-50"
                      >
                        {user.name || 'Suggested for you'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFollowToggle(user.username)}
                    className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    style={{
                      color: following.includes(user.username)
                        ? 'var(--text-color)'
                        : '#0095f6',
                    }}
                  >
                    {following.includes(user.username) ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-6 bg-theme-background"
          >
            <h3
              className="text-xl font-semibold mb-4 text-theme-color"
            >
              Search
            </h3>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  backgroundColor: 'var(--hover-bg)',
                  color: 'var(--text-color)',
                  border: 'none',
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSearch}
                  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm"
                >
                  Search
                </Button>
                <Button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                    setFilteredUsers(suggestedUsers);
                  }}
                  variant="outline"
                  className="flex-1 py-2 rounded-xl font-semibold text-sm border-theme-color text-theme-color"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
