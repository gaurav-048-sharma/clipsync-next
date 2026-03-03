'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import {
  ArrowLeft, Plus, Search, Building2, Clock, Users,
  ChevronRight, X, Filter, Check, AlertCircle
} from 'lucide-react';

/* ─── Interfaces ─────────────────────────────────────── */

interface ReferralApplication {
  _id: string;
  message?: string;
  resumeUrl?: string;
}

interface ReferralUser {
  _id: string;
  profilePicture?: string;
  authId?: {
    name?: string;
  };
}

interface ReferralData {
  _id: string;
  type: 'offer' | 'request';
  company: string;
  role: string;
  description?: string;
  requirements?: string;
  deadline?: string;
  maxApplications: number;
  applications?: ReferralApplication[];
  userId?: ReferralUser;
}

interface PaginationData {
  totalPages: number;
}

interface NewReferralState {
  type: string;
  company: string;
  role: string;
  description: string;
  requirements: string;
  deadline: string;
  maxApplications: number;
}

interface ApplyData {
  message: string;
  resumeUrl: string;
}

interface TabOption {
  id: string;
  label: string;
}

/* ─── Helpers ────────────────────────────────────────── */

const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null;

const axiosConfig = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

/* ─── Main Component ─────────────────────────────────── */

const ReferralBoard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<ReferralData | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyData, setApplyData] = useState<ApplyData>({ message: '', resumeUrl: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({ totalPages: 1 });

  const [newReferral, setNewReferral] = useState<NewReferralState>({
    type: 'request',
    company: '',
    role: '',
    description: '',
    requirements: '',
    deadline: '',
    maxApplications: 10,
  });

  useEffect(() => {
    fetchReferrals();
  }, [activeTab, page]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(activeTab !== 'all' && { type: activeTab }),
      });

      const response = await axios.get(`/api/opportunities/referrals?${params}`, axiosConfig());
      setReferrals(response.data.referrals || []);
      setPagination(response.data.pagination || { totalPages: 1 });
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/opportunities/referrals', newReferral, axiosConfig());
      setShowNewForm(false);
      fetchReferrals();
      setNewReferral({
        type: 'request',
        company: '',
        role: '',
        description: '',
        requirements: '',
        deadline: '',
        maxApplications: 10,
      });
    } catch (error) {
      console.error('Error creating referral:', error);
    }
  };

  const handleApply = async () => {
    try {
      await axios.post(
        `/api/opportunities/referrals/${selectedReferral!._id}/apply`,
        applyData,
        axiosConfig()
      );
      setShowApplyModal(false);
      setSelectedReferral(null);
      setApplyData({ message: '', resumeUrl: '' });
      fetchReferrals();
    } catch (error: any) {
      console.error('Error applying:', error);
      alert(error.response?.data?.message || 'Failed to apply');
    }
  };

  const tabs: TabOption[] = [
    { id: 'all', label: 'All' },
    { id: 'offer', label: '🎯 Offering Referrals' },
    { id: 'request', label: '🙋 Seeking Referrals' },
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
                Referral Board
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Connect with peers for referrals
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            New Referral
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Referrals Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No referrals yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start by requesting or offering a referral
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setNewReferral((prev) => ({ ...prev, type: 'request' }));
                  setShowNewForm(true);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Request Referral
              </button>
              <button
                onClick={() => {
                  setNewReferral((prev) => ({ ...prev, type: 'offer' }));
                  setShowNewForm(true);
                }}
                className="px-4 py-2 border border-green-500 text-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                Offer Referral
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {referrals.map((referral) => (
              <div
                key={referral._id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
              >
                <div
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                    referral.type === 'offer'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  {referral.type === 'offer' ? '🎯 Offering Referral' : '🙋 Seeking Referral'}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {referral.role}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-3">
                  <Building2 className="w-4 h-4" />
                  {referral.company}
                </p>

                {referral.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                    {referral.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {referral.deadline
                      ? new Date(referral.deadline).toLocaleDateString()
                      : 'No deadline'}
                  </span>
                  {referral.type === 'offer' && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {referral.applications?.length || 0}/{referral.maxApplications}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <img
                      src={referral.userId?.profilePicture || '/default-avatar.svg'}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {referral.userId?.authId?.name || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedReferral(referral);
                      setShowApplyModal(true);
                    }}
                    className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-sm font-medium"
                  >
                    {referral.type === 'offer' ? 'Apply' : 'Help'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
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
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* New Referral Modal */}
        {showNewForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {newReferral.type === 'offer' ? 'Offer a Referral' : 'Request a Referral'}
                </h2>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateReferral} className="p-6 space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNewReferral((prev) => ({ ...prev, type: 'request' }))
                    }
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      newReferral.type === 'request'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    🙋 I Need a Referral
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewReferral((prev) => ({ ...prev, type: 'offer' }))
                    }
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      newReferral.type === 'offer'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    🎯 I Can Give Referral
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={newReferral.company}
                    onChange={(e) =>
                      setNewReferral((prev) => ({ ...prev, company: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Google"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={newReferral.role}
                    onChange={(e) =>
                      setNewReferral((prev) => ({ ...prev, role: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., SDE Intern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newReferral.description}
                    onChange={(e) =>
                      setNewReferral((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={
                      newReferral.type === 'offer'
                        ? 'Any specific requirements?'
                        : 'Tell them about yourself...'
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={newReferral.deadline}
                      onChange={(e) =>
                        setNewReferral((prev) => ({ ...prev, deadline: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  {newReferral.type === 'offer' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Applications
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={newReferral.maxApplications}
                        onChange={(e) =>
                          setNewReferral((prev) => ({
                            ...prev,
                            maxApplications: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

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
                    className={`flex-1 py-2 text-white rounded-lg ${
                      newReferral.type === 'offer'
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {newReferral.type === 'offer' ? 'Offer Referral' : 'Request Referral'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Apply Modal */}
        {showApplyModal && selectedReferral && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedReferral.type === 'offer'
                    ? 'Apply for Referral'
                    : 'Offer Help'}
                </h2>
                <button
                  onClick={() => {
                    setShowApplyModal(false);
                    setSelectedReferral(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedReferral.role}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    @ {selectedReferral.company}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message *
                  </label>
                  <textarea
                    required
                    value={applyData.message}
                    onChange={(e) =>
                      setApplyData((prev) => ({ ...prev, message: e.target.value }))
                    }
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Introduce yourself and explain why you're a good fit..."
                  />
                </div>

                {selectedReferral.type === 'offer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Resume URL (optional)
                    </label>
                    <input
                      type="url"
                      value={applyData.resumeUrl}
                      onChange={(e) =>
                        setApplyData((prev) => ({ ...prev, resumeUrl: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplyModal(false);
                      setSelectedReferral(null);
                    }}
                    className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Submit Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralBoard;
