'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  FaSearch,
  FaTimes,
  FaFilter,
  FaUniversity,
  FaGraduationCap,
  FaCalendarAlt,
  FaUserPlus,
  FaUserMinus,
} from 'react-icons/fa';

interface SearchProps {
  onClose?: () => void;
}

const Search = ({ onClose }: SearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    college: '',
    department: '',
    year: '',
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const router = useRouter();

  const departments = [
    { code: 'BTCS', name: 'Computer Science Engineering' },
    { code: 'BTIT', name: 'Information Technology' },
    { code: 'BTEC', name: 'Electronics & Communication' },
    { code: 'BTEE', name: 'Electrical Engineering' },
    { code: 'BTME', name: 'Mechanical Engineering' },
    { code: 'BTCE', name: 'Civil Engineering' },
    { code: 'BTAI', name: 'Artificial Intelligence' },
    { code: 'BTML', name: 'Machine Learning' },
    { code: 'BTDS', name: 'Data Science' },
    { code: 'BCAA', name: 'Computer Applications (BCA)' },
    { code: 'BBAA', name: 'Business Administration (BBA)' },
  ];

  const years = ['21', '22', '23', '24', '25'];

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

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

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!token) return;
      try {
        const profileResponse = await axios.get('/api/users/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const username = profileResponse.data.authId.username;
        const followingResponse = await axios.get(
          `/api/users/following/${username}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const followingList = followingResponse.data.following.map(
          (user: any) => user.authId.username
        );
        setFollowing(followingList);
      } catch (err: any) {
        console.error('Following fetch error:', err.response?.data || err.message);
      }
    };
    fetchFollowing();
  }, [token]);

  const performSearch = useCallback(
    async (
      query: string,
      filterParams: { college: string; department: string; year: string }
    ) => {
      if (
        !query.trim() &&
        !filterParams.college &&
        !filterParams.department &&
        !filterParams.year
      ) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.append('q', query.trim());
        if (filterParams.college)
          params.append('college', filterParams.college);
        if (filterParams.department)
          params.append('department', filterParams.department);
        if (filterParams.year) params.append('year', filterParams.year);

        const response = await axios.get(
          `/api/auth/search?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSearchResults(response.data.users || []);

        if (query.trim()) {
          const updated = [
            query.trim(),
            ...recentSearches.filter((s) => s !== query.trim()),
          ].slice(0, 5);
          setRecentSearches(updated);
          localStorage.setItem('recentSearches', JSON.stringify(updated));
        }
      } catch (err) {
        try {
          const response = await axios.get('/api/auth/all', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const filteredResults = response.data.filter(
            (user: any) =>
              user.username?.toLowerCase().includes(query.toLowerCase()) ||
              user.name?.toLowerCase().includes(query.toLowerCase())
          );
          setSearchResults(filteredResults);
        } catch {
          setError('Failed to search users');
        }
      } finally {
        setLoading(false);
      }
    },
    [token, recentSearches]
  );

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (
        searchQuery.length >= 2 ||
        filters.college ||
        filters.department ||
        filters.year
      ) {
        performSearch(searchQuery, filters);
      } else if (
        searchQuery.length === 0 &&
        !filters.college &&
        !filters.department &&
        !filters.year
      ) {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, filters, performSearch]);

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
    if (onClose) onClose();
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
  };

  const clearFilters = () => {
    setFilters({ college: '', department: '', year: '' });
  };

  const hasActiveFilters = filters.college || filters.department || filters.year;

  return (
    <div className="fixed inset-0 md:relative md:inset-auto w-full h-full md:h-auto md:w-96 bg-white dark:bg-gray-900 z-50 flex flex-col">
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-700 p-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold dark:text-white">Search</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <FaTimes className="w-5 h-5 dark:text-white" />
            </button>
          )}
        </div>

        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search by name, username, college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-gray-100 dark:bg-gray-800 border-none dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`mt-3 flex items-center gap-2 text-sm px-3 py-1.5 rounded-full transition-colors ${
            hasActiveFilters
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          <FaFilter className="w-3 h-3" />
          Filters{' '}
          {hasActiveFilters &&
            `(${[filters.college, filters.department, filters.year].filter(Boolean).length})`}
        </button>

        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <FaUniversity className="w-3 h-3" /> College
              </label>
              <select
                value={filters.college}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, college: e.target.value }))
                }
                className="w-full p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Colleges</option>
                {colleges.map((college: any) => (
                  <option key={college.code} value={college.code}>
                    {college.name} ({college.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <FaGraduationCap className="w-3 h-3" /> Department
              </label>
              <select
                value={filters.department}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
                className="w-full p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.code} value={dept.code}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <FaCalendarAlt className="w-3 h-3" /> Batch Year
              </label>
              <select
                value={filters.year}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, year: e.target.value }))
                }
                className="w-full p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    20{year} Batch
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}

        {!searchQuery &&
          !hasActiveFilters &&
          recentSearches.length > 0 &&
          !loading && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Recent
                </h3>
                <button
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('recentSearches');
                  }}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  Clear all
                </button>
              </div>
              {recentSearches.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRecentSearchClick(query)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-left"
                >
                  <FaSearch className="w-4 h-4 text-gray-400" />
                  <span className="dark:text-white">{query}</span>
                </button>
              ))}
            </div>
          )}

        {!loading && searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => handleUserClick(user.username)}
                >
                  <img
                    src={
                      user.profilePicture &&
                      user.profilePicture !== 'default-profile-pic.jpg'
                        ? user.profilePicture
                        : 'https://via.placeholder.com/40'
                    }
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm dark:text-white truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.name || 'No name'}
                    </p>
                    {(user.college?.code || user.department) && (
                      <p className="text-xs text-blue-500 truncate">
                        {user.college?.code}{' '}
                        {user.department && `• ${user.department}`}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant={
                    following.includes(user.username) ? 'outline' : 'default'
                  }
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollowToggle(user.username);
                  }}
                  className="ml-2 flex items-center gap-1"
                >
                  {following.includes(user.username) ? (
                    <>
                      <FaUserMinus className="w-3 h-3" />
                      <span className="hidden sm:inline">Unfollow</span>
                    </>
                  ) : (
                    <>
                      <FaUserPlus className="w-3 h-3" />
                      <span className="hidden sm:inline">Follow</span>
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {!loading && searchQuery && searchResults.length === 0 && (
          <div className="text-center py-12">
            <FaSearch className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Try different keywords or filters
            </p>
          </div>
        )}

        {!loading &&
          !searchQuery &&
          !hasActiveFilters &&
          recentSearches.length === 0 && (
            <div className="text-center py-12">
              <FaSearch className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Search for people
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Find by name, username, college, or department
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default Search;
