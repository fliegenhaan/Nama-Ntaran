'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import AIQualityScores from '../../components/ai/AIQualityScores';
import {
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Image as ImageIcon,
  FileText,
  Info,
} from 'lucide-react';
import api from '@/lib/api';

// TODO: Integrasi dengan backend API untuk fetch pending reviews
// TODO: Implementasi actual API call untuk approve/reject verification
// TODO: Tambahkan fitur filter berdasarkan quality score dan BGN standards
// TODO: Implementasi pagination untuk large datasets
// TODO: Tambahkan fitur search by school name atau catering name
// TODO: Implementasi sorting by date, quality score, priority
// TODO: Tambahkan bulk actions (approve/reject multiple at once)
// TODO: Implementasi notification system untuk new pending reviews
// TODO: Tambahkan audit trail untuk semua admin decisions
// TODO: Implementasi photo zoom/lightbox untuk better image viewing

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
  // full AI analysis fields
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
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const shouldReduceMotion = useReducedMotion();

  // fetch pending reviews
  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/manual-review/pending');
      // Handle response based on structure
      const reviewsData = response.success
        ? (response.data?.reviews || [])
        : (response.reviews || response.data?.reviews || []);
      setPendingReviews(reviewsData);
    } catch (error: any) {
      console.error('Fetch pending reviews error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Gagal Memuat Data Pending Reviews';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // handle approve
  const handleApprove = async (verificationId: number) => {
    if (!confirm('Apakah Anda Yakin Ingin APPROVE Verifikasi Ini?\n\nDana Escrow Akan Dirilis Ke Katering.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/api/manual-review/${verificationId}/approve`, {
        adminNotes,
      });

      alert('✅ Verifikasi Berhasil Diapprove!\n\nDana Escrow Akan Dirilis Ke Katering.');

      // refresh list
      fetchPendingReviews();
      setSelectedReview(null);
      setAdminNotes('');
      setExpandedId(null);
    } catch (error: any) {
      console.error('Approve error:', error);
      alert(error.response?.data?.error || 'Gagal Approve Verifikasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // handle reject
  const handleReject = async (verificationId: number) => {
    if (!rejectionReason.trim()) {
      alert('Mohon Berikan Alasan Rejection');
      return;
    }

    if (!confirm('Apakah Anda Yakin Ingin REJECT Verifikasi Ini?\n\nDana Escrow Akan DITAHAN Dan Issue Akan Dibuat.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/api/manual-review/${verificationId}/reject`, {
        reason: rejectionReason,
        adminNotes,
      });

      alert('❌ Verifikasi Ditolak.\n\nIssue Telah Dibuat Dan Katering Telah Diberitahu.');

      // refresh list
      fetchPendingReviews();
      setSelectedReview(null);
      setAdminNotes('');
      setRejectionReason('');
      setExpandedId(null);
    } catch (error: any) {
      console.error('Reject error:', error);
      alert(error.response?.data?.error || 'Gagal Reject Verifikasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.05,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat Data Manual Reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Manual Review</h1>
        <p className="text-sm text-gray-600 mt-0.5">
          Review Verifikasi Yang Di-Flag Oleh AI Dan Buat Keputusan Final Untuk Release Atau Hold Escrow Funds.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Stats Summary */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ringkasan Pending Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pending Reviews */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 stat-card-hover card-optimized">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-blue-600 stat-number">{pendingReviews.length}</p>
                </div>
              </div>
            </div>

            {/* High Priority */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 stat-card-hover card-optimized">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-red-600 stat-number">
                    {pendingReviews.filter(r => !r.meets_bgn_standards).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Low Quality */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 stat-card-hover card-optimized">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Low Quality</p>
                  <p className="text-2xl font-bold text-yellow-600 stat-number">
                    {pendingReviews.filter(r => r.quality_score < 70).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pending Reviews List */}
        {pendingReviews.length === 0 ? (
          <motion.div variants={itemVariants} className="bg-green-50 rounded-xl p-12 text-center border border-green-200 card-optimized">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">All Clear!</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tidak Ada Pending Manual Review Saat Ini. Semua Verifikasi Sudah Diproses.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {pendingReviews.map((review, index) => (
              <motion.div
                key={review.verification_id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0.01 : 0.3,
                  delay: shouldReduceMotion ? 0 : index * 0.05,
                  ease: [0.4, 0, 0.2, 1] as const,
                }}
                className={`bg-white rounded-xl border-2 card-optimized overflow-hidden ${
                  expandedId === review.verification_id ? 'border-purple-300' : 'border-gray-200'
                }`}
              >
                {/* Review Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-smooth"
                  onClick={() => setExpandedId(expandedId === review.verification_id ? null : review.verification_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">#{review.verification_id}</h3>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-900 font-semibold">{review.school_name}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-700">{review.catering_name}</span>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Quality Score */}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 text-sm">Quality:</span>
                          <span className={`font-bold text-sm ${
                            review.quality_score >= 80 ? 'text-green-600' :
                            review.quality_score >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {review.quality_score}/100
                          </span>
                        </div>

                        {/* BGN Standards */}
                        {!review.meets_bgn_standards && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full border border-red-200">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600 text-xs font-semibold">Fails BGN Standards</span>
                          </div>
                        )}

                        {/* Issues Count */}
                        {review.issues && review.issues.length > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full border border-orange-200">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <span className="text-orange-600 text-xs font-semibold">{review.issues.length} Issues</span>
                          </div>
                        )}

                        {/* Warnings Count */}
                        {review.warnings && review.warnings.length > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 rounded-full border border-yellow-200">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-yellow-600 text-xs font-semibold">{review.warnings.length} Warnings</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(review.verification_id);
                        }}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-smooth flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReview(review);
                          setExpandedId(review.verification_id);
                        }}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-smooth flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                      >
                        <XCircle className="w-4 h-4" />
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
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    {/* Photo */}
                    {review.photo_url && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <ImageIcon className="w-5 h-5 text-gray-600" />
                          <h4 className="text-lg font-semibold text-gray-900">Photo Evidence</h4>
                        </div>
                        <img
                          src={review.photo_url}
                          alt="Food photo"
                          className="rounded-lg max-w-2xl w-full border-2 border-gray-300"
                        />
                      </div>
                    )}

                    {/* AI Analysis */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <h4 className="text-lg font-semibold text-gray-900">Analisis AI</h4>
                      </div>
                      <AIQualityScores
                        aiAnalysis={{
                          qualityScore: review.quality_score,
                          freshnessScore: review.freshness_score,
                          presentationScore: review.presentation_score,
                          hygieneScore: review.hygiene_score,
                          detectedItems: review.detected_items,
                          portionEstimate: review.portion_estimate,
                          compliance: {
                            menuMatch: true,
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
                    </div>

                    {/* Admin Decision Form */}
                    <div className="bg-white rounded-xl p-6 border-2 border-purple-200">
                      <h4 className="text-xl font-bold text-gray-900 mb-4">Admin Decision</h4>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-900 font-semibold mb-2 text-sm">Admin Notes (Optional)</label>
                          <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-smooth"
                            rows={3}
                            placeholder="Tambahkan Catatan Tentang Keputusan Ini..."
                          />
                        </div>

                        {selectedReview?.verification_id === review.verification_id && (
                          <div>
                            <label className="block text-red-600 font-bold mb-2 text-sm">
                              Alasan Rejection * (Wajib Untuk Rejection)
                            </label>
                            <textarea
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="w-full px-4 py-3 bg-red-50 border border-red-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-smooth"
                              rows={3}
                              placeholder="Mengapa Anda Menolak Verifikasi Ini? Alasan Ini Akan Dibagikan Dengan Sekolah Dan Katering."
                            />
                          </div>
                        )}

                        <div className="flex gap-4">
                          <button
                            onClick={() => handleApprove(review.verification_id)}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-smooth flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
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
                            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-smooth flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
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
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Panel */}
        <motion.div variants={itemVariants} className="bg-blue-50 rounded-xl p-6 border border-blue-200 card-optimized">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Tentang Manual Review</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sistem AI kami secara otomatis menganalisis setiap verifikasi delivery makanan. Ketika AI mendeteksi potential issues, low quality scores, atau non-compliance dengan BGN standards, verifikasi tersebut akan di-flag untuk manual review oleh admin. Anda dapat melihat detailed AI analysis, photo evidence, dan semua metrics sebelum membuat keputusan final untuk approve (release escrow funds) atau reject (hold funds dan create issue).
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center py-4">
          <p className="text-sm text-gray-500">
            © 2025 MBG Admin. All Rights Reserved.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
