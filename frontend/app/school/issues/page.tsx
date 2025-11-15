'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import useIssues from '../../hooks/useIssues';
import ModernSidebar from '../../components/layout/ModernSidebar';
import PageHeader from '../../components/layout/PageHeader';
import GlassPanel from '../../components/ui/GlassPanel';
import {
  LayoutDashboard,
  CheckCircle,
  AlertTriangle,
  History,
  Loader2,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function IssuesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const { issues, stats, isLoading } = useIssues({
    autoFetch: true,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'school') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const navItems = [
    { label: 'Dashboard', path: '/school', icon: LayoutDashboard },
    { label: 'Verifikasi', path: '/school/verify', icon: CheckCircle },
    { label: 'Riwayat', path: '/school/history', icon: History },
    { label: 'Laporan Masalah', path: '/school/issues', icon: AlertTriangle },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      open: { label: 'Terbuka', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      in_progress: { label: 'Diproses', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
      resolved: { label: 'Selesai', color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
      closed: { label: 'Ditutup', color: 'bg-gray-500/20 text-gray-300', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </div>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig: Record<string, { label: string; color: string }> = {
      low: { label: 'Rendah', color: 'bg-green-500/20 text-green-400' },
      medium: { label: 'Sedang', color: 'bg-yellow-500/20 text-yellow-400' },
      high: { label: 'Tinggi', color: 'bg-orange-500/20 text-orange-400' },
      critical: { label: 'Kritis', color: 'bg-red-500/20 text-red-400' },
    };

    const config = severityConfig[severity] || severityConfig.medium;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (authLoading || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 blockchain-mesh">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950 blockchain-mesh">
      <ModernSidebar
        navItems={navItems}
        userRole="School"
        userName="Kepala Sekolah"
        userEmail={user.school_name || 'Sekolah'}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <PageHeader
            title="Laporan Masalah"
            subtitle="Kelola laporan masalah terkait pengiriman makanan"
            icon={AlertTriangle}
            breadcrumbs={[
              { label: 'Dashboard', href: '/school' },
              { label: 'Laporan Masalah' },
            ]}
          />

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Terbuka</p>
                  <p className="text-3xl font-bold text-white">{stats?.open || 0}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Diproses</p>
                  <p className="text-3xl font-bold text-white">{stats?.in_progress || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Selesai</p>
                  <p className="text-3xl font-bold text-white">{stats?.resolved || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* Action Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Daftar Laporan</h2>
            <button
              onClick={() => router.push('/school/issues/new')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-smooth"
            >
              <Plus className="w-5 h-5" />
              Buat Laporan Baru
            </button>
          </div>

          {/* Issues List */}
          <GlassPanel>
            {issues.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">Belum ada laporan masalah</p>
              </div>
            ) : (
              <div className="space-y-4">
                {issues.map((issue: any) => (
                  <div
                    key={issue.id}
                    className="p-4 glass-subtle rounded-xl hover:shadow-modern transition-smooth cursor-pointer"
                    onClick={() => router.push(`/school/issues/${issue.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">
                            {issue.issue_type?.replace('_', ' ').toUpperCase()}
                          </h3>
                          {getSeverityBadge(issue.severity)}
                        </div>
                        <p className="text-sm text-gray-300 mb-2">
                          {issue.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Delivery #{issue.delivery_id}</span>
                          <span>•</span>
                          <span>{new Date(issue.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                      <div>
                        {getStatusBadge(issue.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>
      </main>
    </div>
  );
}
