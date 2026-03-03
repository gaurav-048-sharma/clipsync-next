'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Search, Check, Users, Loader2 } from 'lucide-react';

interface MemberUser {
  _id: string;
  username: string;
  name?: string;
  profilePicture?: string;
}

interface GroupData {
  _id: string;
  name: string;
  members?: any[];
  avatar?: string;
  lastMessage?: { content: string; timestamp: string };
  unreadCount?: number;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: GroupData) => void;
  currentUserId?: string;
}

const CreateGroupModal = ({
  isOpen,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) => {
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<MemberUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemberUser[]>([]);
  const [following, setFollowing] = useState<MemberUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (isOpen) fetchFollowing();
  }, [isOpen]);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const profileResponse = await axios.get('/api/users/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const username = profileResponse.data.authId?.username;
      if (!username) {
        setLoading(false);
        return;
      }

      const followingResponse = await axios.get(
        `/api/users/following/${username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const followingList: MemberUser[] = (
        followingResponse.data.following || []
      )
        .map((userProfile: any) => ({
          _id: userProfile.authId?._id || userProfile._id,
          username: userProfile.authId?.username || 'Unknown',
          name: userProfile.authId?.name || '',
          profilePicture: userProfile.profilePicture,
        }))
        .filter(
          (user: MemberUser) => user._id && user.username !== 'Unknown'
        );

      setFollowing(followingList);
      setLoading(false);
    } catch (err) {
      console.error('Fetch following error:', err);
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = following.filter(
      (user) =>
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.name?.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const toggleMember = (user: MemberUser) => {
    setSelectedMembers((prev) => {
      const exists = prev.find((m) => m._id === user._id);
      if (exists) return prev.filter((m) => m._id !== user._id);
      return [...prev, user];
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    if (selectedMembers.length === 0) {
      setError('Please select at least one member');
      return;
    }

    try {
      setCreating(true);
      setError('');
      const token = getToken();
      const response = await axios.post(
        '/api/group-chats',
        {
          name: groupName.trim(),
          memberIds: selectedMembers.map((m) => m._id),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onGroupCreated(response.data.group);
      handleClose();
    } catch (err: any) {
      console.error('Create group error:', err);
      setError(err.response?.data?.message || 'Failed to create group');
      setCreating(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setGroupName('');
    setSelectedMembers([]);
    setSearchQuery('');
    setSearchResults([]);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const displayUsers = searchQuery.trim() ? searchResults : following;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden bg-theme-background"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b border-theme-color"
        >
          <button onClick={handleClose} className="p-1 hover:opacity-70">
            <X
              className="w-6 h-6 text-theme-color"
            />
          </button>
          <h2
            className="text-lg font-semibold text-theme-color"
          >
            {step === 1 ? 'New Group' : 'Group Details'}
          </h2>
          {step === 1 ? (
            <button
              onClick={() => selectedMembers.length > 0 && setStep(2)}
              disabled={selectedMembers.length === 0}
              className="text-sm font-semibold disabled:opacity-40 text-[#0095f6]"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreateGroup}
              disabled={creating || !groupName.trim()}
              className="text-sm font-semibold disabled:opacity-40 flex items-center gap-1 text-[#0095f6]"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Create
            </button>
          )}
        </div>

        {step === 1 ? (
          <>
            {/* Selected members */}
            {selectedMembers.length > 0 && (
              <div
                className="flex gap-2 p-3 overflow-x-auto border-b border-theme-color"
              >
                {selectedMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex flex-col items-center flex-shrink-0"
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
                        {member.profilePicture ? (
                          <img
                            src={member.profilePicture}
                            alt={member.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full rounded-full flex items-center justify-center bg-theme-background"
                          >
                            <span
                              className="text-lg font-semibold text-theme-color"
                            >
                              {member.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleMember(member)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <span
                      className="text-xs mt-1 truncate max-w-[56px] text-theme-color"
                    >
                      {member.username}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div
              className="p-3 border-b border-theme-color"
            >
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-color-50"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
                  style={
                    {
                      backgroundColor: 'var(--hover-bg)',
                      color: 'var(--text-color)',
                      border: 'none',
                      outline: 'none',
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>

            {/* User list */}
            <div className="max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2
                    className="w-6 h-6 animate-spin text-theme-color"
                  />
                </div>
              ) : displayUsers.length === 0 ? (
                <p
                  className="text-center py-8 text-sm text-theme-color-50"
                >
                  {searchQuery
                    ? 'No users found'
                    : 'Follow people to add them to groups'}
                </p>
              ) : (
                displayUsers.map((user) => {
                  const isSelected = selectedMembers.some(
                    (m) => m._id === user._id
                  );
                  return (
                    <div
                      key={user._id}
                      onClick={() => toggleMember(user)}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:opacity-80 transition"
                      style={
                        {
                          backgroundColor: isSelected
                            ? 'var(--hover-bg)'
                            : 'transparent',
                        } as React.CSSProperties
                      }
                    >
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full rounded-full flex items-center justify-center bg-theme-background"
                          >
                            <span
                              className="font-semibold text-theme-color"
                            >
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-sm text-theme-color"
                        >
                          {user.username}
                        </p>
                        {user.name && (
                          <p
                            className="text-xs truncate text-theme-color-50"
                          >
                            {user.name}
                          </p>
                        )}
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${isSelected ? 'bg-blue-500 border-blue-500' : ''}`}
                        style={
                          {
                            borderColor: isSelected
                              ? '#0095f6'
                              : 'var(--border-color)',
                          } as React.CSSProperties
                        }
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[3px]">
                <div
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={
                    { backgroundColor: 'var(--hover-bg)' } as React.CSSProperties
                  }
                >
                  <Users
                    className="w-10 h-10 text-theme-color-50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2 text-theme-color"
              >
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                maxLength={50}
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={
                  {
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-color)',
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                  } as React.CSSProperties
                }
              />
              <p
                className="text-xs mt-1 text-right text-theme-color-50"
              >
                {groupName.length}/50
              </p>
            </div>

            <div>
              <p
                className="text-sm font-medium mb-2 text-theme-color"
              >
                Members ({selectedMembers.length + 1})
              </p>
              <div className="flex -space-x-2">
                {selectedMembers.slice(0, 5).map((member) => (
                  <div
                    key={member._id}
                    className="w-10 h-10 rounded-full border-2 bg-gradient-to-tr from-purple-500 to-pink-500 p-[1px]"
                    style={
                      {
                        borderColor: 'var(--background-color)',
                      } as React.CSSProperties
                    }
                  >
                    {member.profilePicture ? (
                      <img
                        src={member.profilePicture}
                        alt={member.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center"
                        style={
                          {
                            backgroundColor: 'var(--hover-bg)',
                          } as React.CSSProperties
                        }
                      >
                        <span
                          className="text-xs font-semibold text-theme-color"
                        >
                          {member.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {selectedMembers.length > 5 && (
                  <div
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                    style={
                      {
                        borderColor: 'var(--background-color)',
                        backgroundColor: 'var(--hover-bg)',
                      } as React.CSSProperties
                    }
                  >
                    <span
                      className="text-xs font-semibold text-theme-color"
                    >
                      +{selectedMembers.length - 5}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              onClick={() => setStep(1)}
              className="w-full py-2 text-sm font-medium rounded-lg"
              style={
                {
                  backgroundColor: 'var(--hover-bg)',
                  color: 'var(--text-color)',
                } as React.CSSProperties
              }
            >
              Back to member selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateGroupModal;
