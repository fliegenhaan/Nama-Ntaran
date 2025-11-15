'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import ModernSidebar from '../../components/layout/ModernSidebar';
import PageHeader from '../../components/layout/PageHeader';
import GlassPanel from '../../components/ui/GlassPanel';
import AIQualityScores from '../../components/ai/AIQualityScores';
import {
  LayoutDashboard,
  Users,
  Lock,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import api from '../../lib/api';

interface PendingReview {
  verification_id: number;
  delivery_id: number;
  school_name: string;
  catering_name: string;
  verified_at: string;
  quality_score: number;
  meets_bgn_standards: boolean;
  issues: string[];
  warnings: string[];
  reasoning: string;
  photo_url?: string;
  // Full AI analysis fields
  freshness_score: number;
  presentation_score: number;
  hygiene_score: number;
  detected_items: string[];
  portion_estimate: number;
  portion_confidence: number;
  confidence: number;
  recommendations: string[];
}

export default function ManualReviewPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch pending reviews
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    fetchPendingReviews();
  }, [user]);

  const fetchPendingReviews = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/manual-review/pending');
      setPendingReviews(response.data.reviews || []);
    } catch (error: any) {
      console.error('Fetch pending reviews error:', error);
      alert(error.response?.data?.error || 'Failed to load pending reviews');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle approve
  const handleApprove = async (verificationId: number) => {
    if (!confirm('Are you sure you want to APPROVE this verification?\n\nThis will release escrow funds to the catering.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/manual-review/${verificationId}/approve`, {
        adminNotes,
      });

      alert('✅ Verification approved successfully!\n\nEscrow funds will be released to catering.');

      // Refresh list
      fetchPendingReviews();
      setSelectedReview(null);
      setAdminNotes('');
      setExpandedId(null);
    } catch (error: any) {
      console.error('Approve error:', error);
      alert(error.response?.data?.error || 'Failed to approve verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject
  const handleReject = async (verificationId: number) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!confirm('Are you sure you want to REJECT this verification?\n\nEscrow funds will be HELD and an issue will be created.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/manual-review/${verificationId}/reject`, {
        reason: rejectionReason,
        adminNotes,
      });

      alert('❌ Verification rejected.\n\nAn issue has been created and catering has been notified.');

      // Refresh list
      fetchPendingReviews();
      setSelectedReview(null);
      setAdminNotes('');
      setRejectionReason('');
      setExpandedId(null);
    } catch (error: any) {
      console.error('Reject error:', error);
      alert(error.response?.data?.error || 'Failed to reject verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Manual Review', path: '/admin/manual-review', icon: Eye, badge: pendingReviews.length },
    { label: 'Anomaly Detection', path: '/admin/anomalies', icon: AlertTriangle },
    { label: 'Budget Optimization', path: '/admin/budget', icon: Lock },
    { label: 'Accounts', path: '/admin/accounts', icon: Users },
  ];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-gradient">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading manual reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen mesh-gradient">
      <ModernSidebar items={navItems} />

      <div className="flex-1 ml-64">
        <PageHeader
          title="AI Manual Review"
          subtitle="Review AI-flagged verifications and make final decisions"
        />

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 mb-1">Pending Reviews</p>
                  <p className="text-3xl font-bold text-white">{pendingReviews.length}</p>
                </div>
                <Eye className="w-12 h-12 text-blue-400" />
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 mb-1">High Priority</p>
                  <p className="text-3xl font-bold text-red-400">
                    {pendingReviews.filter(r => !r.meets_bgn_standards).length}
                  </p>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 mb-1">Low Quality</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {pendingReviews.filter(r => r.quality_score < 70).length}
                  </p>
                </div>
                <XCircle className="w-12 h-12 text-yellow-400" />
              </div>
            </GlassPanel>
          </div>

          {/* Pending Reviews List */}
          {pendingReviews.length === 0 ? (
            <GlassPanel className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">All Clear!</h3>
              <p className="text-gray-300">No pending manual reviews at this time.</p>
            </GlassPanel>
          ) : (
            <div className="space-y-6">
              {pendingReviews.map((review) => (
                <GlassPanel
                  key={review.verification_id}
                  className={`overflow-hidden transition-all ${
                    expandedId === review.verification_id ? 'border-blue-500/50' : ''
                  }`}
                >
                  {/* Review Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedId(expandedId === review.verification_id ? null : review.verification_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className="text-xl font-bold text-white">#{review.verification_id}</h3>
                          <span className="text-gray-400">|</span>
                          <span className="text-white font-semibold">{review.school_name}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-white">{review.catering_name}</span>
                        </div>

                        <div className="flex items-center gap-6">
                          {/* Quality Score */}
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">Quality:</span>
                            <span className={`font-bold ${
                              review.quality_score >= 80 ? 'text-green-400' :
                              review.quality_score >= 60 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {review.quality_score}/100
                            </span>
                          </div>

                          {/* BGN Standards */}
                          {!review.meets_bgn_standards && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30">
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <span className="text-red-300 text-sm font-semibold">Fails BGN Standards</span>
                            </div>
                          )}

                          {/* Issues Count */}
                          {review.issues && review.issues.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/20 rounded-full border border-orange-500/30">
                              <AlertTriangle className="w-4 h-4 text-orange-400" />
                              <span className="text-orange-300 text-sm">{review.issues.length} issues</span>
                            </div>
                          )}

                          {/* Warnings Count */}
                          {review.warnings && review.warnings.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                              <AlertTriangle className="w-4 h-4 text-yellow-400" />
                              <span className="text-yellow-300 text-sm">{review.warnings.length} warnings</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(review.verification_id);
                          }}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Approve
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReview(review);
                            setExpandedId(review.verification_id);
                          }}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-5 h-5" />
                          Reject
                        </button>

                        {expandedId === review.verification_id ? (
                          <ChevronUp className="w-6 h-6 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedId === review.verification_id && (
                    <div className="border-t border-white/10 p-6 bg-black/20">
                      {/* Photo */}
                      {review.photo_url && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-white mb-3">Photo Evidence</h4>
                          <img
                            src={review.photo_url}
                            alt="Food photo"
                            className="rounded-lg max-w-2xl w-full border border-white/20"
                          />
                        </div>
                      )}

                      {/* AI Analysis */}
                      <AIQualityScores
                        aiAnalysis={{
                          qualityScore: review.quality_score,
                          freshnessScore: review.freshness_score,
                          presentationScore: review.presentation_score,
                          hygieneScore: review.hygiene_score,
                          detectedItems: review.detected_items,
                          portionEstimate: review.portion_estimate,
                          compliance: {
                            menuMatch: true, // Assume true if not failed
                            portionMatch: true,
                            qualityAcceptable: review.quality_score >= 70,
                            meetsBGNStandards: review.meets_bgn_standards,
                          },
                          confidence: review.confidence,
                          needsManualReview: true,
                          issues: review.issues || [],
                          warnings: review.warnings || [],
                          recommendations: review.recommendations || [],
                          reasoning: review.reasoning,
                        }}
                      />

                      {/* Admin Decision Form */}
                      <GlassPanel className="p-6 mt-6 border-purple-500/30">
                        <h4 className="text-xl font-bold text-white mb-4">Admin Decision</h4>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-gray-300 mb-2">Admin Notes (Optional)</label>
                            <textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                              rows={3}
                              placeholder="Add any notes about this decision..."
                            />
                          </div>

                          {selectedReview?.verification_id === review.verification_id && (
                            <div>
                              <label className="block text-red-300 mb-2 font-semibold">
                                Rejection Reason * (Required for rejection)
                              </label>
                              <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                                rows={3}
                                placeholder="Why are you rejecting this verification? This will be shared with school and catering."
                              />
                            </div>
                          )}

                          <div className="flex gap-4">
                            <button
                              onClick={() => handleApprove(review.verification_id)}
                              disabled={isSubmitting}
                              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-5 h-5" />
                              )}
                              Approve & Release Funds
                            </button>

                            <button
                              onClick={() => handleReject(review.verification_id)}
                              disabled={isSubmitting || !rejectionReason.trim()}
                              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <XCircle className="w-5 h-5" />
                              )}
                              Reject & Hold Funds
                            </button>
                          </div>
                        </div>
                      </GlassPanel>
                    </div>
                  )}
                </GlassPanel>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
