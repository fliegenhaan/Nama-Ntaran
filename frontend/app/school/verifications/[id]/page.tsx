'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import ModernSidebar from '../../../components/layout/ModernSidebar';
import PageHeader from '../../../components/layout/PageHeader';
import GlassPanel from '../../../components/ui/GlassPanel';
import AIQualityScores from '../../../components/ai/AIQualityScores';
import {
  ArrowLeft,
  Calendar,
  Package,
  CheckCircle,
  AlertTriangle,
  Loader2,
  School,
  Store,
  LayoutDashboard,
  History,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import api from '../../../lib/api';

export default function VerificationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const verificationId = params.id as string;

  const [verification, setVerification] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch verification details
  useEffect(() => {
    if (!verificationId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch verification details
        const verificationResponse = await api.get(`/verifications/${verificationId}`);
        setVerification(verificationResponse.data.verification);

        // Fetch AI analysis if ai_analysis_id exists
        if (verificationResponse.data.verification.ai_analysis_id) {
          try {
            const aiResponse = await api.get(`/ai-food-analyses/${verificationResponse.data.verification.ai_analysis_id}`);
            setAiAnalysis(aiResponse.data.analysis);
          } catch (aiError) {
            console.warn('AI analysis not found or failed to load');
          }
        }

        setError(null);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.error || 'Failed to load verification details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [verificationId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'school') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 blockchain-mesh">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading verification details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 blockchain-mesh">
        <GlassPanel className="p-8 max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link
            href="/school/history"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-smooth"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to History
          </Link>
        </GlassPanel>
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 blockchain-mesh">
        <p className="text-gray-300">Verification not found</p>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', path: '/school', icon: LayoutDashboard },
    { label: 'Verifikasi Pengiriman', path: '/school/verify', icon: CheckCircle },
    { label: 'Verifikasi QR', path: '/school/verify-qr', icon: QrCode },
    { label: 'Riwayat Verifikasi', path: '/school/history', icon: History },
    { label: 'Masalah', path: '/school/issues', icon: AlertTriangle },
    { label: 'Laporan Masalah Baru', path: '/school/issues/new', icon: AlertCircle },
  ];

  return (
    <div className="flex min-h-screen bg-gray-950 blockchain-mesh">
      <ModernSidebar
        navItems={navItems}
        userRole="School"
        userName="Kepala Sekolah"
        userEmail={user?.school_name || 'Sekolah'}
      />

      <main className="flex-1 overflow-y-auto">
        <PageHeader
          title="Verification Details"
          subtitle={`Verification #${verificationId}`}
        />

        <div className="p-8">
          {/* Back Button */}
          <Link
            href="/school/history"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-smooth"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to History
          </Link>

          {/* Verification Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <GlassPanel className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <School className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">School</h3>
              </div>
              <p className="text-xl font-bold text-white mb-2">{verification.school_name}</p>
              <p className="text-gray-400">NPSN: {verification.npsn}</p>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Store className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Catering</h3>
              </div>
              <p className="text-xl font-bold text-white">{verification.catering_name}</p>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Delivery Date</h3>
              </div>
              <p className="text-xl font-bold text-white">
                {new Date(verification.delivery_date).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </GlassPanel>
          </div>

          {/* Verification Details */}
          <GlassPanel className="p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">Verification Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400 mb-1">Portions Received</p>
                <p className="text-2xl font-bold text-white flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-400" />
                  {verification.portions_received} / {verification.delivery_portions}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Quality Rating</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-2xl ${
                        star <= verification.quality_rating ? 'text-yellow-400' : 'text-gray-600'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-xl font-bold text-white ml-2">
                    {verification.quality_rating}/5
                  </span>
                </div>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {verification.status === 'approved' ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                  )}
                  <span className="text-xl font-bold text-white capitalize">{verification.status}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Verified At</p>
                <p className="text-xl font-bold text-white">
                  {new Date(verification.verified_at).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {verification.notes && (
              <div className="mt-6 p-4 glass-subtle rounded-xl">
                <p className="text-gray-400 mb-2">Notes</p>
                <p className="text-white">{verification.notes}</p>
              </div>
            )}

            {verification.photo_url && (
              <div className="mt-6">
                <p className="text-gray-400 mb-4">Photo Evidence</p>
                <img
                  src={verification.photo_url}
                  alt="Verification photo"
                  className="rounded-xl max-w-full h-auto border border-white/20"
                />
              </div>
            )}
          </GlassPanel>

          {/* AI Analysis Section */}
          {aiAnalysis && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">AI Quality Analysis</h2>
              <AIQualityScores aiAnalysis={aiAnalysis} />
            </div>
          )}

          {!aiAnalysis && verification.photo_url && (
            <GlassPanel className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">AI Analysis Not Available</h3>
              <p className="text-gray-300">
                Photo was uploaded but AI analysis is not available for this verification.
              </p>
            </GlassPanel>
          )}
        </div>
      </main>
    </div>
  );
}
