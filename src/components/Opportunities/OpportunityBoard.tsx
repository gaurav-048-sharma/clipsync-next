'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  Briefcase, TrendingUp, Users, Star, ChevronRight,
  FileText, BookOpen, ArrowLeft, Award
} from 'lucide-react';

interface StatsData {
  experiences: number;
  referrals: number;
  pendingResumes: number;
  prepGroups: number;
}

interface ExperienceItem {
  _id: string;
  role: string;
  company: string;
  location?: string;
  duration?: string;
  stipend?: string;
  ratings?: {
    overall: number;
  };
}

interface ReferralItem {
  _id: string;
  type: 'offer' | 'request';
  role: string;
  company: string;
  deadline?: string;
}

interface LeaderboardEntry {
  _id: string;
  userId?: {
    profilePicture?: string;
    authId?: {
      name?: string;
    };
  };
  totalKarma: number;
}

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  count: number;
}

const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null;

const axiosConfig = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

const OpportunityBoard = () => {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData>({
    experiences: 0,
    referrals: 0,
    pendingResumes: 0,
    prepGroups: 0,
  });
  const [karma, setKarma] = useState(0);
  const [recentExperiences, setRecentExperiences] = useState<ExperienceItem[]>([]);
  const [activeReferrals, setActiveReferrals] = useState<ReferralItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, refRes, karmaRes, leaderRes] = await Promise.all([
        axios.get('/api/opportunities/experiences?limit=3', axiosConfig()),
        axios.get('/api/opportunities/referrals?limit=3', axiosConfig()),
        axios.get('/api/opportunities/karma', axiosConfig()),
        axios.get('/api/opportunities/leaderboard', axiosConfig()),
      ]);

      setRecentExperiences(expRes.data.experiences || []);
      setActiveReferrals(refRes.data.referrals || []);
      setKarma(karmaRes.data.karma || 0);
      setLeaderboard(leaderRes.data.leaderboard || []);
      setStats({
        experiences: expRes.data.total || 0,
        referrals: refRes.data.total || 0,
        pendingResumes: karmaRes.data.pendingResumes || 0,
        prepGroups: karmaRes.data.prepGroups || 0,
      });
    } catch (error) {
      console.error('Error fetching opportunity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features: FeatureCard[] = [
    {
      title: 'Experiences',
      description: 'Share & discover internship experiences',
      icon: Briefcase,
      path: '/opportunities/experiences',
      color: 'from-blue-500 to-blue-600',
      count: stats.experiences,
    },
    {
      title: 'Referral Board',
      description: 'Request or offer referrals',
      icon: Users,
      path: '/opportunities/referrals',
      color: 'from-green-500 to-green-600',
      count: stats.referrals,
    },
    {
      title: 'Resume Reviews',
      description: 'Get your resume reviewed by peers',
      icon: FileText,
      path: '/opportunities/resume-center',
      color: 'from-purple-500 to-purple-600',
      count: stats.pendingResumes,
    },
    {
      title: 'Prep Groups',
      description: 'Join interview prep groups',
      icon: BookOpen,
      path: '/opportunities/prep-groups',
      color: 'from-orange-500 to-orange-600',
      count: stats.prepGroups,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Opportunity Hub
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your gateway to career opportunities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-full">
            <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="font-bold text-yellow-700 dark:text-yellow-400">{karma}</span>
            <span className="text-sm text-yellow-600 dark:text-yellow-500">Karma</span>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                href={feature.path}
                className={`bg-gradient-to-r ${feature.color} rounded-xl p-6 text-white hover:opacity-90 transition-opacity`}
              >
                <Icon className="w-8 h-8 mb-3" />
                <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                <p className="text-white/80 text-sm mb-3">{feature.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{feature.count}</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Experiences */}
        {recentExperiences.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Experiences
              </h2>
              <Link
                href="/opportunities/experiences"
                className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentExperiences.map((exp) => (
                <div
                  key={exp._id}
                  onClick={() => router.push(`/opportunities/experiences?id=${exp._id}`)}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {exp.role} @ {exp.company}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {exp.location && <span>{exp.location}</span>}
                      {exp.duration && <span>{exp.duration}</span>}
                      {exp.stipend && <span>₹{exp.stipend}</span>}
                    </div>
                  </div>
                  {exp.ratings?.overall && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-medium">{exp.ratings.overall}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Karma Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🏆 Karma Leaderboard
            </h2>
            <div className="space-y-3">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div
                  key={entry._id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : index === 1
                        ? 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                        : index === 2
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <img
                    src={entry.userId?.profilePicture || '/default-avatar.svg'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.svg';
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {entry.userId?.authId?.name || 'User'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                    <Award className="w-4 h-4" />
                    <span className="font-bold">{entry.totalKarma}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Referrals */}
        {activeReferrals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Active Referrals
              </h2>
              <Link
                href="/opportunities/referrals"
                className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeReferrals.map((ref) => (
                <div
                  key={ref._id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${
                      ref.type === 'offer'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {ref.type === 'offer' ? 'Offering' : 'Seeking'}
                  </span>
                  <h3 className="font-medium text-gray-900 dark:text-white">{ref.role}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{ref.company}</p>
                  {ref.deadline && (
                    <p className="text-xs text-gray-400 mt-2">
                      Deadline: {new Date(ref.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityBoard;
