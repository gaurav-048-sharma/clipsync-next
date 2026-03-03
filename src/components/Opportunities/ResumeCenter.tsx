'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  ArrowLeft, Upload, FileText, Star, MessageSquare, X, Award, Eye,
} from 'lucide-react';

interface ResumeUser {
  profilePicture?: string;
  authId?: { name?: string };
}

interface ReviewSection {
  score: number;
  feedback: string;
}

interface ReviewData {
  reviewerId?: ResumeUser;
  isAlumni?: boolean;
  alumniCompany?: string;
  overallScore: number;
  overallFeedback: string;
  strengths?: string[];
  improvements?: string[];
}

interface ResumeData {
  _id: string;
  resumeUrl: string;
  targetRole?: string;
  targetCompanies?: string[];
  reviewType: string;
  currentStatus?: string;
  created_at?: string;
  userId?: ResumeUser;
  reviews?: ReviewData[];
}

interface NewResume {
  resumeUrl: string;
  targetRole: string;
  targetCompanies: string;
  reviewType: string;
}

interface NewReview {
  overallScore: number;
  overallFeedback: string;
  sections: Record<string, ReviewSection>;
  strengths: string;
  improvements: string;
}

const ResumeCenter = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingResumes, setPendingResumes] = useState<ResumeData[]>([]);
  const [myResumes, setMyResumes] = useState<ResumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState<ResumeData | null>(null);

  const [newResume, setNewResume] = useState<NewResume>({
    resumeUrl: '',
    targetRole: '',
    targetCompanies: '',
    reviewType: 'general',
  });

  const [newReview, setNewReview] = useState<NewReview>({
    overallScore: 7,
    overallFeedback: '',
    sections: {
      format: { score: 7, feedback: '' },
      content: { score: 7, feedback: '' },
      impact: { score: 7, feedback: '' },
      skills: { score: 7, feedback: '' },
    },
    strengths: '',
    improvements: '',
  });

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingResumes();
    } else {
      fetchMyResumes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchPendingResumes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/opportunities/resume-reviews/pending', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setPendingResumes(response.data.resumes || []);
    } catch (error) {
      console.error('Error fetching pending resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyResumes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/opportunities/resume-reviews/my', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setMyResumes(response.data.resumes || []);
    } catch (error) {
      console.error('Error fetching my resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResume = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        '/api/opportunities/resume-reviews',
        {
          ...newResume,
          targetCompanies: newResume.targetCompanies.split(',').map((c) => c.trim()).filter((c) => c),
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setShowSubmitForm(false);
      setNewResume({ resumeUrl: '', targetRole: '', targetCompanies: '', reviewType: 'general' });
      fetchMyResumes();
      setActiveTab('my');
    } catch (error) {
      console.error('Error submitting resume:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!showReviewForm) return;
    try {
      await axios.post(
        `/api/opportunities/resume-reviews/${showReviewForm._id}/review`,
        {
          ...newReview,
          strengths: newReview.strengths.split('\n').filter((s) => s.trim()),
          improvements: newReview.improvements.split('\n').filter((s) => s.trim()),
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setShowReviewForm(null);
      setNewReview({
        overallScore: 7,
        overallFeedback: '',
        sections: {
          format: { score: 7, feedback: '' },
          content: { score: 7, feedback: '' },
          impact: { score: 7, feedback: '' },
          skills: { score: 7, feedback: '' },
        },
        strengths: '',
        improvements: '',
      });
      fetchPendingResumes();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const ScoreIndicator = ({ score }: { score: number }) => (
    <div
      className={`px-2 py-1 rounded text-xs font-bold ${
        score >= 8
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : score >= 6
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}
    >
      {score}/10
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/opportunities')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Review Center</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Get your resume reviewed by peers &amp; alumni</p>
            </div>
          </div>
          <button onClick={() => setShowSubmitForm(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
            <Upload className="w-4 h-4" />
            Submit Resume
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 flex items-center gap-4">
          <Award className="w-10 h-10 text-purple-500" />
          <div>
            <h3 className="font-semibold text-purple-800 dark:text-purple-200">Earn Karma by Reviewing Resumes!</h3>
            <p className="text-sm text-purple-600 dark:text-purple-300">Help fellow students improve their resumes and earn +5 karma per review</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'pending' ? 'bg-purple-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
          >
            Review Others
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'my' ? 'bg-purple-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
          >
            My Submissions
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : activeTab === 'pending' ? (
          pendingResumes.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No pending resumes</h3>
              <p className="text-gray-600 dark:text-gray-400">Check back later for new resumes to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingResumes.map((resume) => (
                <div key={resume._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                        <FileText className="w-6 h-6 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{resume.targetRole || 'General Review'}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <img src={resume.userId?.profilePicture || '/default-avatar.svg'} alt="" className="w-5 h-5 rounded-full" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">{resume.userId?.authId?.name || 'Anonymous'}</span>
                        </div>
                        {resume.targetCompanies && resume.targetCompanies.length > 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Target: {resume.targetCompanies.join(', ')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${resume.reviewType === 'technical' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {resume.reviewType}
                      </span>
                      <a href={resume.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-500 hover:text-purple-600">
                        <Eye className="w-4 h-4" />
                        View
                      </a>
                      <button onClick={() => setShowReviewForm(resume)} className="flex items-center gap-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                        <MessageSquare className="w-4 h-4" />
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : myResumes.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No resumes submitted</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Submit your resume to get feedback from peers</p>
            <button onClick={() => setShowSubmitForm(true)} className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600">Submit Resume</button>
          </div>
        ) : (
          <div className="space-y-4">
            {myResumes.map((resume) => (
              <div key={resume._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{resume.targetRole || 'General Review'}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Submitted {resume.created_at ? new Date(resume.created_at).toLocaleDateString() : ''}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${resume.currentStatus === 'reviewed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                      {resume.currentStatus === 'reviewed' ? 'Reviewed' : 'Pending'}
                    </div>
                  </div>
                </div>

                {resume.reviews && resume.reviews.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-700/30">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Reviews ({resume.reviews.length})</h4>
                    <div className="space-y-4">
                      {resume.reviews.map((review, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <img src={review.reviewerId?.profilePicture || '/default-avatar.svg'} alt="" className="w-8 h-8 rounded-full" />
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">{review.reviewerId?.authId?.name || 'Reviewer'}</span>
                                {review.isAlumni && (
                                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded">
                                    Alumni @ {review.alumniCompany}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ScoreIndicator score={review.overallScore} />
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">{review.overallFeedback}</p>
                          {review.strengths && review.strengths.length > 0 && (
                            <div className="mt-3">
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">Strengths:</span>
                              <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {review.strengths.map((s, i) => <li key={i}>&#10003; {s}</li>)}
                              </ul>
                            </div>
                          )}
                          {review.improvements && review.improvements.length > 0 && (
                            <div className="mt-3">
                              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Areas to Improve:</span>
                              <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {review.improvements.map((s, i) => <li key={i}>&bull; {s}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submit Resume Modal */}
        {showSubmitForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Submit Resume for Review</h2>
                <button onClick={() => setShowSubmitForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitResume} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resume URL *</label>
                  <input type="url" required value={newResume.resumeUrl} onChange={(e) => setNewResume((prev) => ({ ...prev, resumeUrl: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="https://drive.google.com/..." />
                  <p className="text-xs text-gray-500 mt-1">Upload to Google Drive and share the link (make sure it&apos;s viewable)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Role</label>
                  <input type="text" value={newResume.targetRole} onChange={(e) => setNewResume((prev) => ({ ...prev, targetRole: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., SDE Intern" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Companies</label>
                  <input type="text" value={newResume.targetCompanies} onChange={(e) => setNewResume((prev) => ({ ...prev, targetCompanies: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Google, Microsoft, Amazon (comma separated)" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Review Type</label>
                  <select value={newResume.reviewType} onChange={(e) => setNewResume((prev) => ({ ...prev, reviewType: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="general">General Review</option>
                    <option value="technical">Technical Role</option>
                    <option value="non-technical">Non-Technical Role</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowSubmitForm(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">Submit</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Review Resume</h2>
                <button onClick={() => setShowReviewForm(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{showReviewForm.targetRole || 'General Review'}</h3>
                    <p className="text-sm text-gray-500">by {showReviewForm.userId?.authId?.name}</p>
                  </div>
                  <a href={showReviewForm.resumeUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">Open Resume</a>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Overall Score</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="1" max="10" value={newReview.overallScore} onChange={(e) => setNewReview((prev) => ({ ...prev, overallScore: parseInt(e.target.value) }))} className="flex-1" />
                    <span className="text-2xl font-bold text-purple-500 w-12 text-center">{newReview.overallScore}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Overall Feedback *</label>
                  <textarea required value={newReview.overallFeedback} onChange={(e) => setNewReview((prev) => ({ ...prev, overallFeedback: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Your overall thoughts on the resume..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(newReview.sections).map(([section, data]) => (
                    <div key={section} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{section}</span>
                        <input
                          type="number" min="1" max="10" value={data.score}
                          onChange={(e) => setNewReview((prev) => ({ ...prev, sections: { ...prev.sections, [section]: { ...prev.sections[section], score: parseInt(e.target.value) } } }))}
                          className="w-16 px-2 py-1 rounded border text-center"
                        />
                      </div>
                      <input
                        type="text" value={data.feedback}
                        onChange={(e) => setNewReview((prev) => ({ ...prev, sections: { ...prev.sections, [section]: { ...prev.sections[section], feedback: e.target.value } } }))}
                        className="w-full px-2 py-1 rounded border text-sm" placeholder="Quick feedback..."
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Strengths (one per line)</label>
                    <textarea value={newReview.strengths} onChange={(e) => setNewReview((prev) => ({ ...prev, strengths: e.target.value }))} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="Clean formatting&#10;Good use of metrics&#10;..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Improvements (one per line)</label>
                    <textarea value={newReview.improvements} onChange={(e) => setNewReview((prev) => ({ ...prev, improvements: e.target.value }))} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="Add more projects&#10;Quantify achievements&#10;..." />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowReviewForm(null)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                  <button onClick={handleSubmitReview} className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">Submit Review (+5 Karma)</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeCenter;
