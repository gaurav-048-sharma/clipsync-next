'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  ArrowLeft, Plus, Search, Users, BookOpen, Code, Video,
  Lock, Unlock, Calendar, ChevronRight, X, Link2,
  MessageSquare, Trophy, Target
} from 'lucide-react';

/* ─── Interfaces ─────────────────────────────────────── */

interface GroupMember {
  _id: string;
  role?: string;
  userId?: {
    profilePicture?: string;
    authId?: {
      name?: string;
    };
  };
}

interface GroupResource {
  title: string;
  url: string;
  type?: string;
}

interface GroupData {
  _id: string;
  name: string;
  description?: string;
  type: string;
  targetCompany?: string;
  topics?: string[];
  maxMembers: number;
  isPrivate: boolean;
  memberCount?: number;
  members?: GroupMember[];
  resources?: GroupResource[];
}

interface PaginationData {
  totalPages: number;
}

interface NewGroupState {
  name: string;
  description: string;
  type: string;
  targetCompany: string;
  topics: string;
  maxMembers: number;
  isPrivate: boolean;
}

interface TypeIconsMap {
  [key: string]: React.ComponentType<{ className?: string }>;
}

interface TypeOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/* ─── Helpers ────────────────────────────────────────── */

const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null;

const axiosConfig = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

/* ─── Main Component ─────────────────────────────────── */

const PrepGroups = () => {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({ totalPages: 1 });

  const [newGroup, setNewGroup] = useState<NewGroupState>({
    name: '',
    description: '',
    type: 'general',
    targetCompany: '',
    topics: '',
    maxMembers: 20,
    isPrivate: false,
  });

  useEffect(() => {
    fetchGroups();
  }, [activeType, searchQuery, page]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(activeType !== 'all' && { type: activeType }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await axios.get(`/api/opportunities/prep-groups?${params}`, axiosConfig());
      setGroups(response.data.groups || []);
      setPagination(response.data.pagination || { totalPages: 1 });
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        '/api/opportunities/prep-groups',
        {
          ...newGroup,
          topics: newGroup.topics
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t),
        },
        axiosConfig()
      );
      setShowNewForm(false);
      setNewGroup({
        name: '',
        description: '',
        type: 'general',
        targetCompany: '',
        topics: '',
        maxMembers: 20,
        isPrivate: false,
      });
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await axios.post(`/api/opportunities/prep-groups/${groupId}/join`, {}, axiosConfig());
      fetchGroups();
      if (selectedGroup?._id === groupId) {
        fetchGroupDetails(groupId);
      }
    } catch (error: any) {
      console.error('Error joining group:', error);
      alert(error.response?.data?.message || 'Failed to join');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await axios.post(`/api/opportunities/prep-groups/${groupId}/leave`, {}, axiosConfig());
      fetchGroups();
      setSelectedGroup(null);
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const fetchGroupDetails = async (groupId: string) => {
    try {
      const response = await axios.get(`/api/opportunities/prep-groups/${groupId}`, axiosConfig());
      setSelectedGroup(response.data.group);
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  const typeIcons: TypeIconsMap = {
    general: BookOpen,
    company: Target,
    dsa: Code,
    mock: Video,
    behavioral: MessageSquare,
  };

  const types: TypeOption[] = [
    { id: 'all', label: 'All Groups', icon: Users },
    { id: 'general', label: 'General Prep', icon: BookOpen },
    { id: 'company', label: 'Company Specific', icon: Target },
    { id: 'dsa', label: 'DSA Practice', icon: Code },
    { id: 'mock', label: 'Mock Interviews', icon: Video },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/opportunities')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Interview Prep Groups
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Join study groups & practice together
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </button>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups by name or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {types.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => {
                  setActiveType(type.id);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeType === type.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No groups found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Be the first to create a prep group!
            </p>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Create Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => {
              const TypeIcon = typeIcons[group.type] || BookOpen;
              return (
                <div
                  key={group._id}
                  onClick={() => fetchGroupDetails(group._id)}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-orange-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg ${
                        group.type === 'company'
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : group.type === 'dsa'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : group.type === 'mock'
                          ? 'bg-purple-100 dark:bg-purple-900/30'
                          : 'bg-orange-100 dark:bg-orange-900/30'
                      }`}
                    >
                      <TypeIcon
                        className={`w-6 h-6 ${
                          group.type === 'company'
                            ? 'text-blue-500'
                            : group.type === 'dsa'
                            ? 'text-green-500'
                            : group.type === 'mock'
                            ? 'text-purple-500'
                            : 'text-orange-500'
                        }`}
                      />
                    </div>
                    {group.isPrivate ? (
                      <Lock className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {group.name}
                  </h3>
                  {group.targetCompany && (
                    <p className="text-sm text-blue-500 mb-2">🎯 {group.targetCompany}</p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                    {group.description}
                  </p>

                  {group.topics && group.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {group.topics.slice(0, 3).map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
                        >
                          {topic}
                        </span>
                      ))}
                      {group.topics.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{group.topics.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.memberCount || group.members?.length || 0}/{group.maxMembers}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-4 py-2 rounded-lg ${
                  p === page
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        {showNewForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create Prep Group
                </h2>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGroup.name}
                    onChange={(e) => setNewGroup((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Google SDE Prep 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newGroup.description}
                    onChange={(e) =>
                      setNewGroup((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Describe what this group is about..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      value={newGroup.type}
                      onChange={(e) =>
                        setNewGroup((prev) => ({ ...prev, type: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="general">General Prep</option>
                      <option value="company">Company Specific</option>
                      <option value="dsa">DSA Practice</option>
                      <option value="mock">Mock Interviews</option>
                      <option value="behavioral">Behavioral</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Members
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="50"
                      value={newGroup.maxMembers}
                      onChange={(e) =>
                        setNewGroup((prev) => ({
                          ...prev,
                          maxMembers: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {newGroup.type === 'company' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Company
                    </label>
                    <input
                      type="text"
                      value={newGroup.targetCompany}
                      onChange={(e) =>
                        setNewGroup((prev) => ({ ...prev, targetCompany: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Google"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Topics (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newGroup.topics}
                    onChange={(e) =>
                      setNewGroup((prev) => ({ ...prev, topics: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Arrays, Trees, System Design"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newGroup.isPrivate}
                    onChange={(e) =>
                      setNewGroup((prev) => ({ ...prev, isPrivate: e.target.checked }))
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Private group (requires approval to join)
                  </span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Group Details Modal */}
        {selectedGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedGroup.name}
                </h2>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    {selectedGroup.targetCompany && (
                      <p className="text-blue-500 font-medium mb-2">
                        🎯 {selectedGroup.targetCompany}
                      </p>
                    )}
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedGroup.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoinGroup(selectedGroup._id)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Join Group
                  </button>
                </div>

                {selectedGroup.topics && selectedGroup.topics.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGroup.topics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Members ({selectedGroup.members?.length || 0}/{selectedGroup.maxMembers})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedGroup.members?.slice(0, 8).map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <img
                          src={member.userId?.profilePicture || '/default-avatar.svg'}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {member.userId?.authId?.name || 'Member'}
                          </p>
                          {member.role === 'moderator' && (
                            <span className="text-xs text-orange-500">Moderator</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedGroup.resources && selectedGroup.resources.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Resources</h4>
                    <div className="space-y-2">
                      {selectedGroup.resources.slice(0, 5).map((resource, idx) => (
                        <a
                          key={idx}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Link2 className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {resource.title}
                            </p>
                            <p className="text-xs text-gray-500">{resource.type}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrepGroups;
