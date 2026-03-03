'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import {
  ArrowLeft, Plus, Search, Building2, MapPin, Clock, Star,
  ThumbsUp, MessageSquare, Eye, X, ChevronLeft, ChevronRight,
  Briefcase, Calendar, IndianRupee, Filter
} from 'lucide-react';

/* ─── Interfaces ─────────────────────────────────────── */

interface Compensation {
  stipend: string;
  currency: string;
  otherBenefits: string;
}

interface Ratings {
  overall: number;
  workLifeBalance: number;
  learning: number;
  mentorship: number;
  culture: number;
}

interface InterviewProcess {
  rounds: string;
  duration: string;
  difficulty: string;
  tips: string;
}

interface NewExperienceState {
  company: string;
  role: string;
  location: string;
  duration: string;
  year: string;
  type: string;
  compensation: Compensation;
  ratings: Ratings;
  tips: string;
  interviewProcess: InterviewProcess;
  isAnonymous: boolean;
  wouldRecommend: boolean;
}

interface ExperienceUser {
  _id: string;
  profilePicture?: string;
  authId?: {
    name?: string;
  };
}

interface ExperienceData {
  _id: string;
  company: string;
  role: string;
  location?: string;
  duration?: string;
  year?: string;
  type?: string;
  compensation?: Compensation;
  ratings?: Ratings;
  tips?: string;
  interviewProcess?: InterviewProcess;
  isAnonymous?: boolean;
  wouldRecommend?: boolean;
  userId?: ExperienceUser;
  likes?: string[];
  comments?: { _id: string }[];
  views?: number;
  created_at?: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  total: number;
}

interface FiltersState {
  company: string;
  role: string;
  location: string;
  sortBy: string;
}

/* ─── Helpers ────────────────────────────────────────── */

const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null;

const axiosConfig = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

/* ─── Sub-component ──────────────────────────────────── */

const RatingStars = ({ rating, size = 'sm' }: { rating: number; size?: string }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ${
          star <= rating
            ? 'text-yellow-500 fill-current'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ))}
  </div>
);

/* ─── Main Component ─────────────────────────────────── */

const ExperiencesFeed = () => {
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const [experiences, setExperiences] = useState<ExperienceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceData | null>(null);
  const [filters, setFilters] = useState<FiltersState>({
    company: '',
    role: '',
    location: '',
    sortBy: 'newest',
  });

  const [newExperience, setNewExperience] = useState<NewExperienceState>({
    company: '',
    role: '',
    location: '',
    duration: '',
    year: new Date().getFullYear().toString(),
    type: 'internship',
    compensation: { stipend: '', currency: 'INR', otherBenefits: '' },
    ratings: { overall: 3, workLifeBalance: 3, learning: 3, mentorship: 3, culture: 3 },
    tips: '',
    interviewProcess: { rounds: '', duration: '', difficulty: 'medium', tips: '' },
    isAnonymous: false,
    wouldRecommend: true,
  });

  useEffect(() => {
    fetchExperiences();
  }, [page, filters.sortBy]);

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy: filters.sortBy,
        ...(filters.company && { company: filters.company }),
        ...(filters.role && { role: filters.role }),
        ...(filters.location && { location: filters.location }),
      });

      const response = await axios.get(`/api/opportunities/experiences?${params}`, axiosConfig());
      setExperiences(response.data.experiences || []);
      setPagination(response.data.pagination || { currentPage: 1, totalPages: 1, total: 0 });
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/opportunities/experiences', newExperience, axiosConfig());
      setShowNewForm(false);
      setNewExperience({
        company: '',
        role: '',
        location: '',
        duration: '',
        year: new Date().getFullYear().toString(),
        type: 'internship',
        compensation: { stipend: '', currency: 'INR', otherBenefits: '' },
        ratings: { overall: 3, workLifeBalance: 3, learning: 3, mentorship: 3, culture: 3 },
        tips: '',
        interviewProcess: { rounds: '', duration: '', difficulty: 'medium', tips: '' },
        isAnonymous: false,
        wouldRecommend: true,
      });
      fetchExperiences();
    } catch (error) {
      console.error('Error submitting experience:', error);
    }
  };

  const handleLike = async (id: string) => {
    try {
      await axios.post(`/api/opportunities/experiences/${id}/like`, {}, axiosConfig());
      fetchExperiences();
    } catch (error) {
      console.error('Error liking:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
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
                Internship Experiences
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Real experiences from fellow students
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            Share Experience
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Company..."
                value={filters.company}
                onChange={(e) => setFilters((prev) => ({ ...prev, company: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && fetchExperiences()}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <input
              type="text"
              placeholder="Role..."
              value={filters.role}
              onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && fetchExperiences()}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <input
              type="text"
              placeholder="Location..."
              value={filters.location}
              onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && fetchExperiences()}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest-rated">Highest Rated</option>
              <option value="most-liked">Most Liked</option>
            </select>
          </div>
        </div>

        {/* Experience List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No experiences yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Be the first to share your internship experience!
            </p>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Share Experience
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div
                key={exp._id}
                onClick={() => setSelectedExperience(exp)}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                      <Building2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {exp.role} @ {exp.company}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {exp.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {exp.location}
                          </span>
                        )}
                        {exp.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {exp.duration}
                          </span>
                        )}
                        {exp.year && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {exp.year}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {exp.compensation?.stipend && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                      <IndianRupee className="w-4 h-4" />
                      {exp.compensation.stipend}/mo
                    </span>
                  )}
                </div>

                {exp.ratings && (
                  <div className="flex items-center gap-2 mb-3">
                    <RatingStars rating={exp.ratings.overall} />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {exp.ratings.overall}/5
                    </span>
                  </div>
                )}

                {exp.tips && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {exp.tips}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    {!exp.isAnonymous && exp.userId && (
                      <>
                        <img
                          src={exp.userId.profilePicture || '/default-avatar.svg'}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {exp.userId.authId?.name}
                        </span>
                      </>
                    )}
                    {exp.isAnonymous && (
                      <span className="text-sm text-gray-400 italic">Anonymous</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(exp._id);
                      }}
                      className="flex items-center gap-1 hover:text-blue-500"
                    >
                      <ThumbsUp className="w-4 h-4" /> {exp.likes?.length || 0}
                    </button>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" /> {exp.comments?.length || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" /> {exp.views || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
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
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* New Experience Modal */}
        {showNewForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Share Your Experience
                </h2>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitExperience} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company *
                    </label>
                    <input
                      type="text"
                      required
                      value={newExperience.company}
                      onChange={(e) =>
                        setNewExperience((prev) => ({ ...prev, company: e.target.value }))
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
                      value={newExperience.role}
                      onChange={(e) =>
                        setNewExperience((prev) => ({ ...prev, role: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., SDE Intern"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newExperience.location}
                      onChange={(e) =>
                        setNewExperience((prev) => ({ ...prev, location: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Bangalore"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={newExperience.duration}
                      onChange={(e) =>
                        setNewExperience((prev) => ({ ...prev, duration: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="3 months"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Year
                    </label>
                    <input
                      type="text"
                      value={newExperience.year}
                      onChange={(e) =>
                        setNewExperience((prev) => ({ ...prev, year: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="2024"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stipend (per month)
                  </label>
                  <input
                    type="text"
                    value={newExperience.compensation.stipend}
                    onChange={(e) =>
                      setNewExperience((prev) => ({
                        ...prev,
                        compensation: { ...prev.compensation, stipend: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="₹25,000"
                  />
                </div>

                {/* Ratings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Ratings
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ['overall', 'Overall'],
                        ['workLifeBalance', 'Work-Life Balance'],
                        ['learning', 'Learning'],
                        ['mentorship', 'Mentorship'],
                        ['culture', 'Culture'],
                      ] as [keyof Ratings, string][]
                    ).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={newExperience.ratings[key]}
                            onChange={(e) =>
                              setNewExperience((prev) => ({
                                ...prev,
                                ratings: { ...prev.ratings, [key]: parseInt(e.target.value) },
                              }))
                            }
                            className="w-20"
                          />
                          <span className="text-sm font-bold text-blue-500 w-6 text-center">
                            {newExperience.ratings[key]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tips & Advice
                  </label>
                  <textarea
                    value={newExperience.tips}
                    onChange={(e) =>
                      setNewExperience((prev) => ({ ...prev, tips: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Any tips for future interns..."
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newExperience.isAnonymous}
                      onChange={(e) =>
                        setNewExperience((prev) => ({ ...prev, isAnonymous: e.target.checked }))
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Post anonymously
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newExperience.wouldRecommend}
                      onChange={(e) =>
                        setNewExperience((prev) => ({ ...prev, wouldRecommend: e.target.checked }))
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Would recommend
                    </span>
                  </label>
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
                    className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Share Experience
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Experience Detail Modal */}
        {selectedExperience && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-blue-500" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedExperience.role} @ {selectedExperience.company}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedExperience(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {selectedExperience.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {selectedExperience.location}
                    </span>
                  )}
                  {selectedExperience.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {selectedExperience.duration}
                    </span>
                  )}
                  {selectedExperience.year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {selectedExperience.year}
                    </span>
                  )}
                </div>

                {selectedExperience.compensation?.stipend && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <span className="text-green-700 dark:text-green-400 font-semibold text-lg">
                      ₹{selectedExperience.compensation.stipend}/month
                    </span>
                    {selectedExperience.compensation.otherBenefits && (
                      <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                        {selectedExperience.compensation.otherBenefits}
                      </p>
                    )}
                  </div>
                )}

                {selectedExperience.ratings && (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Ratings</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          ['overall', 'Overall'],
                          ['workLifeBalance', 'Work-Life Balance'],
                          ['learning', 'Learning'],
                          ['mentorship', 'Mentorship'],
                          ['culture', 'Culture'],
                        ] as [keyof Ratings, string][]
                      ).map(([key, label]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"
                        >
                          <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                          <div className="flex items-center gap-2">
                            <RatingStars rating={selectedExperience.ratings![key]} size="md" />
                            <span className="text-sm font-bold">
                              {selectedExperience.ratings![key]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedExperience.tips && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Tips & Advice
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300">
                      {selectedExperience.tips}
                    </p>
                  </div>
                )}

                {selectedExperience.interviewProcess && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-800 dark:text-purple-200 mb-3">
                      Interview Process
                    </h3>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {selectedExperience.interviewProcess.rounds && (
                        <div>
                          <span className="text-purple-600 dark:text-purple-300">Rounds:</span>
                          <span className="ml-2 font-medium">
                            {selectedExperience.interviewProcess.rounds}
                          </span>
                        </div>
                      )}
                      {selectedExperience.interviewProcess.duration && (
                        <div>
                          <span className="text-purple-600 dark:text-purple-300">Duration:</span>
                          <span className="ml-2 font-medium">
                            {selectedExperience.interviewProcess.duration}
                          </span>
                        </div>
                      )}
                      {selectedExperience.interviewProcess.difficulty && (
                        <div>
                          <span className="text-purple-600 dark:text-purple-300">Difficulty:</span>
                          <span className="ml-2 font-medium">
                            {selectedExperience.interviewProcess.difficulty}
                          </span>
                        </div>
                      )}
                    </div>
                    {selectedExperience.interviewProcess.tips && (
                      <p className="mt-2 text-purple-700 dark:text-purple-300">
                        {selectedExperience.interviewProcess.tips}
                      </p>
                    )}
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

export default ExperiencesFeed;
