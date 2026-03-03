'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  FaHome, FaEnvelope, FaUser, FaPlus, FaSignOutAlt, FaSun, FaMoon,
  FaVideo, FaCommentDots, FaCalendarAlt, FaStore, FaBars, FaBookmark,
  FaSearch, FaHeart, FaCompass, FaTimes, FaFilter, FaUniversity,
  FaGraduationCap, FaBriefcase,
} from 'react-icons/fa';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import axios from 'axios';

interface SearchUser {
  _id: string;
  username?: string;
  name?: string;
  profilePicture?: string;
  college?: { code: string; name: string };
  department?: string;
}

interface College {
  code: string;
  name: string;
}

interface Filters {
  college: string;
  department: string;
  year: string;
}

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const { theme, setTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Search states
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [following, setFollowing] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({ college: '', department: '', year: '' });
  const [colleges, setColleges] = useState<College[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const departments = [
    { code: 'BTCS', name: 'Computer Science' },
    { code: 'BTIT', name: 'Information Technology' },
    { code: 'BTEC', name: 'Electronics' },
    { code: 'BTME', name: 'Mechanical' },
    { code: 'BTAI', name: 'AI/ML' },
    { code: 'BCAA', name: 'BCA' },
    { code: 'BBAA', name: 'BBA' },
  ];

  const years = ['21', '22', '23', '24', '25'];

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axios.get('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Fetch unread count error:', err);
    }
  }, [token]);

  const fetchUnreadMessagesCount = useCallback(async () => {
    try {
      const response = await axios.get('/api/messages/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadMessagesCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error('Fetch unread messages count error:', err);
    }
  }, [token]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (!(event.target as HTMLElement).closest('.search-container')) {
          setShowSearch(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch colleges
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await axios.get('/api/auth/colleges');
        setColleges(response.data.colleges || []);
      } catch (err) {
        console.error('Failed to fetch colleges:', err);
      }
    };
    fetchColleges();
  }, []);

  // Fetch following list
  useEffect(() => {
    const fetchFollowing = async () => {
      if (!token) return;
      try {
        const profileResponse = await axios.get('/api/users/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const username = profileResponse.data.authId.username;
        const followingResponse = await axios.get(`/api/users/following/${username}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const followingList = followingResponse.data.following.map(
          (user: { authId: { username: string } }) => user.authId.username
        );
        setFollowing(followingList);
      } catch (err) {
        console.error('Following fetch error:', err);
      }
    };
    fetchFollowing();
  }, [token]);

  // Search function
  const performSearch = useCallback(
    async (query: string, filterParams: Filters) => {
      if (!query.trim() && !filterParams.college && !filterParams.department && !filterParams.year) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.append('q', query.trim());
        if (filterParams.college) params.append('college', filterParams.college);
        if (filterParams.department) params.append('department', filterParams.department);
        if (filterParams.year) params.append('year', filterParams.year);

        const response = await axios.get(`/api/auth/search?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSearchResults(response.data.users || []);
      } catch {
        try {
          const response = await axios.get('/api/auth/all', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const filteredResults = response.data.filter(
            (user: SearchUser) =>
              user.username?.toLowerCase().includes(query.toLowerCase()) ||
              user.name?.toLowerCase().includes(query.toLowerCase())
          );
          setSearchResults(filteredResults);
        } catch {
          // Search fallback failed silently
        }
      } finally {
        setSearchLoading(false);
      }
    },
    [token]
  );

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.length >= 2 || filters.college || filters.department || filters.year) {
        performSearch(searchQuery, filters);
      } else if (searchQuery.length === 0 && !filters.college && !filters.department && !filters.year) {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, filters, performSearch]);

  // Focus search input when opening
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearch]);

  const handleFollowToggle = async (targetUsername: string) => {
    const isFollowingUser = following.includes(targetUsername);
    const action = isFollowingUser ? 'unfollow' : 'follow';

    setFollowing((prev) =>
      isFollowingUser ? prev.filter((u) => u !== targetUsername) : [...prev, targetUsername]
    );

    try {
      await axios.post(`/api/users/${action}/${targetUsername}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setFollowing((prev) =>
        isFollowingUser ? [...prev, targetUsername] : prev.filter((u) => u !== targetUsername)
      );
    }
  };

  const handleUserClick = (username: string) => {
    router.push(`/user/${username}`);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const clearFilters = () => {
    setFilters({ college: '', department: '', year: '' });
  };

  const hasActiveFilters = filters.college || filters.department || filters.year;

  useEffect(() => {
    if (!token) return;
    fetchUnreadCount();
    fetchUnreadMessagesCount();

    // Note: Socket.IO requires a separate WebSocket server in serverless.
    // For now, poll for updates periodically.
    const pollInterval = setInterval(() => {
      fetchUnreadCount();
      fetchUnreadMessagesCount();
    }, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [token, fetchUnreadCount, fetchUnreadMessagesCount]);

  // Reset unread messages count when entering messages page
  useEffect(() => {
    if (pathname.startsWith('/messages')) {
      setUnreadMessagesCount(0);
    }
  }, [pathname]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('msalToken');
    }
    router.push('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Render search panel content
  const renderSearchContent = (isMobile: boolean) => (
    <>
      {/* Search Header */}
      <div className="sticky top-0 z-10 p-4 border-b bg-theme-background border-theme-color">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-theme-color">Search</h2>
          <button
            onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            aria-label="Close search"
          >
            <FaTimes className="w-5 h-5 text-theme-color" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search name, username, college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-theme-color"
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label="Clear search">
              <FaTimes className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`mt-3 flex items-center gap-2 text-sm px-3 py-1.5 rounded-full transition-colors ${
            hasActiveFilters
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          <FaFilter className="w-3 h-3" />
          Filters {hasActiveFilters && `(${[filters.college, filters.department, filters.year].filter(Boolean).length})`}
        </button>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
            <div>
              <label className="flex items-center gap-2 text-xs font-medium mb-1 text-theme-color">
                <FaUniversity className="w-3 h-3" /> College
              </label>
              <select
                value={filters.college}
                onChange={(e) => setFilters((prev) => ({ ...prev, college: e.target.value }))}
                className="w-full p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-theme-color"
                aria-label="Filter by college"
              >
                <option value="">All Colleges</option>
                {colleges.map((college) => (
                  <option key={college.code} value={college.code}>
                    {college.name} ({college.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium mb-1 text-theme-color">
                <FaGraduationCap className="w-3 h-3" /> Department
              </label>
              <select
                value={filters.department}
                onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
                className="w-full p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-theme-color"
                aria-label="Filter by department"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.code} value={dept.code}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium mb-1 text-theme-color">
                Batch Year
              </label>
              <div className="flex flex-wrap gap-2">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setFilters((prev) => ({ ...prev, year: prev.year === year ? '' : year }))}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filters.year === year ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-theme-color'
                    }`}
                  >
                    20{year}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-red-500">
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className={`flex-1 overflow-y-auto p-4 ${isMobile ? 'navbar-search-mobile-results' : 'navbar-search-desktop-results'}`}>
        {searchLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!searchLoading && searchResults.length > 0 && (
          <div className="space-y-1">
            {searchResults.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 flex-1" onClick={() => handleUserClick(user.username || '')}>
                  <img
                    src={
                      user.profilePicture && user.profilePicture !== 'default-profile-pic.jpg'
                        ? user.profilePicture
                        : 'https://via.placeholder.com/44'
                    }
                    alt={user.username || ''}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-theme-color">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.name || 'No name'}</p>
                    {(user.college?.code || user.department) && (
                      <p className="text-xs text-blue-500 truncate">
                        {user.college?.code} {user.department && `• ${user.department}`}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleFollowToggle(user.username || ''); }}
                  className={`ml-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    following.includes(user.username || '')
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {following.includes(user.username || '') ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        )}

        {!searchLoading && searchQuery && searchResults.length === 0 && (
          <div className="text-center py-12">
            <FaSearch className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No users found</p>
            <p className="text-sm text-gray-400 mt-1">Try different keywords</p>
          </div>
        )}

        {!searchLoading && !searchQuery && !hasActiveFilters && (
          <div className="text-center py-12">
            <FaSearch className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Search for people</p>
            <p className="text-sm text-gray-400 mt-1">Find by name, username, or college</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Search Panel */}
      {showSearch && (
        <div
          ref={searchRef}
          className="md:hidden search-container fixed inset-0 z-[100] bg-theme-background"
        >
          {renderSearchContent(true)}
        </div>
      )}

      {/* Mobile Top Header */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 backdrop-blur-xl navbar-mobile-header-bg"
      >
        <h1
          className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent navbar-brand-font"
        >
          ClipSync
        </h1>

        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push('/notifications')}
            className={`relative p-2.5 rounded-xl active:scale-90 transition-all duration-200 ${
              isActive('/notifications') ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <FaHeart
              className={`w-6 h-6 transition-colors ${isActive('/notifications') ? 'text-red-500' : 'text-theme-color'}`}
            />
            {unreadCount > 0 && (
              <div className="absolute top-1 right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg shadow-red-500/30 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </button>

          <button
            onClick={() => router.push('/messages')}
            className={`relative p-2.5 rounded-xl active:scale-90 transition-all duration-200 ${
              isActive('/messages') ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-6 h-6 text-theme-color" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            {unreadMessagesCount > 0 && (
              <div className="absolute top-1 right-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg shadow-blue-500/30 animate-pulse">
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl navbar-mobile-nav-bg"
      >
        <div className="flex items-center justify-around h-[52px] pb-safe">
          <button onClick={() => router.push('/dashboard')} className="flex-1 h-full flex items-center justify-center active:opacity-60 transition-opacity">
            {isActive('/dashboard') ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-theme-color">
                <path d="M12 2.1L1 12h3v9h6v-6h4v6h6v-9h3L12 2.1z" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-theme-color">
                <path d="M3 12l9-9 9 9" />
                <path d="M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
              </svg>
            )}
          </button>

          <button onClick={() => setShowSearch(true)} className="flex-1 h-full flex items-center justify-center active:opacity-60 transition-opacity">
            {showSearch ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-theme-color">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-theme-color">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
          </button>

          <button onClick={() => router.push('/upload-reel')} className="flex items-center justify-center active:scale-90 transition-transform" aria-label="Upload reel">
            <div className="w-11 h-8 rounded-lg bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </button>

          <button onClick={() => router.push('/reels-feed')} className="flex-1 h-full flex items-center justify-center active:opacity-60 transition-opacity">
            {isActive('/reels-feed') ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-theme-color">
                <path d="M12.823 1l2.974 5.002h-5.58l-2.65-4.971c.206-.013.419-.022.642-.027L8.55 1h4.272zm2.327 0h.298c3.06 0 4.468.754 5.64 1.887a6.007 6.007 0 0 1 1.596 2.82l.07.295h-4.629L15.15 1zm-9.667.377L7.95 6.002H1.244a6.01 6.01 0 0 1 3.942-4.53zm9.735 12.834-4.545-2.624a.909.909 0 0 0-1.356.668l-.008.12v5.248a.91.91 0 0 0 1.255.84l.109-.053 4.545-2.624a.909.909 0 0 0 .1-1.507l-.1-.068-4.545-2.624zm-14.2-6.209h21.964v12.088a5.91 5.91 0 0 1-5.588 5.903l-.323.006H7.588a5.91 5.91 0 0 1-5.903-5.588l-.005-.321V8.002z" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-theme-color">
                <rect x="2" y="2" width="20" height="20" rx="4" />
                <path d="M2 8h20M8 2v6M16 2v6" />
                <path d="M9.5 17V11l6 3-6 3z" fill="currentColor" />
              </svg>
            )}
          </button>

          <button onClick={() => router.push('/profile')} className="flex-1 h-full flex items-center justify-center active:opacity-60 transition-opacity">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center overflow-hidden ${isActive('/profile') ? 'ring-[2px] ring-offset-1 ring-current' : ''}`}
            >
              {isActive('/profile') ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-theme-color">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21c0-4.418-3.582-8-8-8s-8 3.582-8 8" />
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-theme-color">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </nav>

      {/* Desktop Search Panel */}
      {showSearch && (
        <div
          ref={searchRef}
          className="hidden md:block search-container absolute top-0 left-64 w-96 h-screen border-r shadow-xl z-50 bg-theme-background border-theme-color"
        >
          {renderSearchContent(false)}
        </div>
      )}

      {/* Desktop Sidebar */}
      <nav
        className="hidden md:flex fixed top-0 left-0 w-64 h-screen z-50 border-r flex-col px-3 py-8 bg-theme-background border-theme-color"
      >
        <div className="flex items-center w-full mb-10 px-3">
          <img src="/logo.svg" alt="ClipSync" className="w-8 h-8 mr-2 rounded-full" />
          <h1 className="text-xl font-semibold text-theme-color">ClipSync</h1>
        </div>

        <div className="flex flex-col w-full space-y-1">
          <Button
            variant="ghost"
            className={`w-full h-12 px-3 flex items-center justify-start rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-theme-color ${isActive('/dashboard') ? 'font-semibold' : 'font-normal'}`}
            onClick={() => router.push('/dashboard')}
          >
            <FaHome className="w-6 h-6 mr-4" />
            <span className="text-base">Home</span>
          </Button>

          <Button
            variant="ghost"
            className={`w-full h-12 px-3 flex items-center justify-start rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-theme-color ${showSearch ? 'font-semibold bg-gray-100 dark:bg-gray-900' : 'font-normal'}`}
            onClick={() => setShowSearch(!showSearch)}
          >
            <FaSearch className="w-6 h-6 mr-4" />
            <span className="text-base">Search</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full h-12 px-3 flex items-center justify-start rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors font-normal text-theme-color"
            onClick={() => setShowSearch(true)}
          >
            <FaCompass className="w-6 h-6 mr-4" />
            <span className="text-base">Explore</span>
          </Button>

          <Button
            variant="ghost"
            className={`w-full h-12 px-3 flex items-center justify-start rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-theme-color ${isActive('/reels-feed') ? 'font-semibold' : 'font-normal'}`}
            onClick={() => router.push('/reels-feed')}
          >
            <FaVideo className="w-6 h-6 mr-4" />
            <span className="text-base">Reels</span>
          </Button>

          <Button
            variant="ghost"
            className={`w-full h-12 px-3 flex items-center justify-start rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-theme-color ${isActive('/messages') ? 'font-semibold' : 'font-normal'}`}
            onClick={() => router.push('/messages')}
          >
            <div className="relative mr-4">
              <FaEnvelope className="w-6 h-6" />
              {unreadMessagesCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </div>
              )}
            </div>
            <span className="text-base">Messages</span>
          </Button>

          <Button
            variant="ghost"
            className={`w-full h-12 px-3 flex items-center justify-start rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors relative text-theme-color ${isActive('/notifications') ? 'font-semibold' : 'font-normal'}`}
            onClick={() => router.push('/notifications')}
          >
            <div className="relative mr-4">
              <FaHeart className="w-6 h-6" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
            <span className="text-base">Notifications</span>
          </Button>

          <Button
            variant="ghost"
            className={`w-full h-12 px-3 flex items-center justify-start rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-theme-color ${isActive('/upload-reel') ? 'font-semibold' : 'font-normal'}`}
            onClick={() => router.push('/upload-reel')}
          >
            <FaPlus className="w-6 h-6 mr-4" />
            <span className="text-base">Create</span>
          </Button>

          <Button
            variant="ghost"
            className={`w-full h-12 px-3 flex items-center justify-start rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-theme-color ${isActive('/profile') ? 'font-semibold' : 'font-normal'}`}
            onClick={() => router.push('/profile')}
          >
            <FaUser className="w-6 h-6 mr-4" />
            <span className="text-base">Profile</span>
          </Button>
        </div>

        {/* Desktop Bottom - More Menu */}
        <div className="flex flex-col mt-auto w-full" ref={moreMenuRef}>
          {showMoreMenu && (
            <div
              className="absolute bottom-20 left-3 w-56 rounded-xl shadow-lg border overflow-hidden bg-theme-background border-theme-color"
            >
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider opacity-50 text-theme-color">
                  Campus
                </div>
                <button onClick={() => { router.push('/confessions'); setShowMoreMenu(false); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-theme-color">
                  <FaCommentDots className="w-5 h-5" /><span className="text-sm">Confessions</span>
                </button>
                <button onClick={() => { router.push('/events'); setShowMoreMenu(false); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-theme-color">
                  <FaCalendarAlt className="w-5 h-5" /><span className="text-sm">Events</span>
                </button>
                <button onClick={() => { router.push('/marketplace'); setShowMoreMenu(false); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-theme-color">
                  <FaStore className="w-5 h-5" /><span className="text-sm">Marketplace</span>
                </button>

                <div className="border-t my-1 border-theme-color" />
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider opacity-50 text-theme-color">
                  Study
                </div>
                <button onClick={() => { router.push('/study-rooms'); setShowMoreMenu(false); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-theme-color">
                  <FaUniversity className="w-5 h-5" /><span className="text-sm">Study Rooms</span>
                </button>
                <button onClick={() => { router.push('/qna'); setShowMoreMenu(false); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-theme-color">
                  <FaGraduationCap className="w-5 h-5" /><span className="text-sm">Q&A Forum</span>
                </button>

                <div className="border-t my-1 border-theme-color" />
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider opacity-50 text-theme-color">
                  Career
                </div>
                <button onClick={() => { router.push('/opportunities'); setShowMoreMenu(false); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-theme-color">
                  <FaBriefcase className="w-5 h-5" /><span className="text-sm">Opportunities</span>
                </button>

                <div className="border-t my-1 border-theme-color" />
                <button onClick={() => setShowMoreMenu(false)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-theme-color">
                  <FaBookmark className="w-5 h-5" /><span className="text-sm">Saved</span>
                </button>
                <button onClick={() => { toggleTheme(); setShowMoreMenu(false); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-theme-color">
                  {theme === 'light' ? <FaMoon className="w-5 h-5" /> : <FaSun className="w-5 h-5" />}
                  <span className="text-sm">Switch appearance</span>
                </button>
                <button onClick={() => setShowMoreMenu(false)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-theme-color">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-sm">Settings</span>
                </button>

                <div className="border-t my-1 border-theme-color" />
                {token && (
                  <button onClick={() => { handleLogout(); setShowMoreMenu(false); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-red-500">
                    <FaSignOutAlt className="w-5 h-5" /><span className="text-sm">Log out</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            className="w-full h-12 px-3 flex items-center justify-start rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-theme-color"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
          >
            <FaBars className="w-6 h-6 mr-4" />
            <span className="text-base font-normal">More</span>
          </Button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
