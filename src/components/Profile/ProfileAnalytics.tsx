'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Eye, Heart, MessageCircle, Film, Users, UserPlus } from 'lucide-react';

interface OverviewData {
  totalReels: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  followers: number;
  following: number;
}

interface TopReel {
  id: string;
  mediaUrl?: string;
  caption?: string;
  created_at: string;
  views: number;
  likes: number;
  comments: number;
}

interface AnalyticsData {
  overview: OverviewData;
  topReels: TopReel[];
}

interface ProfileAnalyticsProps {
  username: string;
}

const ProfileAnalytics = ({ username }: ProfileAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    fetchAnalytics();
  }, [username]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/users/${username}/analytics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalytics(response.data.analytics);
      setLoading(false);
    } catch (err) {
      console.error('Fetch analytics error:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { overview, topReels } = analytics;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-6 p-4">
      {/* Overview Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border theme-card">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center mb-2">
                <Film className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-theme-color">
                {formatNumber(overview.totalReels)}
              </p>
              <p className="text-xs text-theme-color-60">
                Reels
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border theme-card">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center mb-2">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-theme-color">
                {formatNumber(overview.totalViews)}
              </p>
              <p className="text-xs text-theme-color-60">
                Views
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border theme-card">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-500 to-pink-500 flex items-center justify-center mb-2">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-theme-color">
                {formatNumber(overview.totalLikes)}
              </p>
              <p className="text-xs text-theme-color-60">
                Likes
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border theme-card">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-teal-500 flex items-center justify-center mb-2">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-theme-color">
                {formatNumber(overview.totalComments)}
              </p>
              <p className="text-xs text-theme-color-60">
                Comments
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border theme-card">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-theme-color">
                {formatNumber(overview.followers)}
              </p>
              <p className="text-xs text-theme-color-60">
                Followers
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border theme-card">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center mb-2">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-theme-color">
                {formatNumber(overview.following)}
              </p>
              <p className="text-xs text-theme-color-60">
                Following
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Reels */}
      {topReels && topReels.length > 0 && (
        <Card className="border theme-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-theme-color">
              <TrendingUp className="w-5 h-5" />
              Top Performing Reels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topReels.map((reel, index) => (
                <div
                  key={reel.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:shadow-md transition-shadow border-theme-color"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 flex-shrink-0">
                    <span className="text-white font-bold text-sm">#{index + 1}</span>
                  </div>

                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {reel.mediaUrl && (
                      <video
                        src={reel.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate text-theme-color"
                    >
                      {reel.caption || 'No caption'}
                    </p>
                    <p className="text-xs text-theme-color-60">
                      {new Date(reel.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-theme-color-60" />
                      <span className="text-sm font-semibold text-theme-color">
                        {formatNumber(reel.views)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-semibold text-theme-color">
                        {formatNumber(reel.likes)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-theme-color">
                        {formatNumber(reel.comments)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileAnalytics;
