'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import ModernSidebar from '../../components/layout/ModernSidebar';
import PageHeader from '../../components/layout/PageHeader';
import GlassPanel from '../../components/ui/GlassPanel';
import {
  LayoutDashboard,
  Users,
  Shield,
  AlertTriangle,
  Settings,
  BarChart3,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Image,
} from 'lucide-react';

export default function IssuesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
    { label: 'Akun', path: '/admin/accounts', icon: Users },
    { label: 'Escrow', path: '/admin/escrow', icon: Shield },
    { label: 'Issues', path: '/admin/issues', icon: AlertTriangle },
    { label: 'Laporan', path: '/admin/reports', icon: BarChart3 },
    { label: 'Pengaturan', path: '/admin/settings', icon: Settings },
  ];

  const issues = [
    {
      id: 1,
      school: 'SDN 01 Bandung',
      catering: 'Katering Sehat',
      issue_type: 'Quantity',
      description: 'Jumlah porsi kurang 20 dari yang dijanjikan',
      status: 'pending',
      reported_at: '2025-11-14T10:30:00',
      has_evidence: true,
    },
    {
      id: 2,
      school: 'SMP 12 Surabaya',
      catering: 'Katering Nutrisi',
      issue_type: 'Quality',
      description: 'Makanan tidak sesuai standar nutrisi',
      status: 'investigating',
      reported_at: '2025-11-13T14:20:00',
      has_evidence: true,
    },
    {
      id: 3,
      school: 'SDN 05 Jakarta',
      catering: 'Katering Sehat',
      issue_type: 'Late Delivery',
      description: 'Pengiriman terlambat 2 jam',
      status: 'resolved',
      reported_at: '2025-11-12T11:00:00',
      resolved_at: '2025-11-12T15:00:00',
      has_evidence: false,
    },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      investigating: { label: 'Investigasi', color: 'bg-blue-500/20 text-blue-400', icon: Eye },
      resolved: { label: 'Selesai', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      rejected: { label: 'Ditolak', color: 'bg-red-500/20 text-red-400', icon: XCircle },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${c.color}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </div>
    );
  };

  const getIssueBadge = (type: string) => {
    const colors: Record<string, string> = {
      Quantity: 'bg-orange-500/20 text-orange-400',
      Quality: 'bg-red-500/20 text-red-400',
      'Late Delivery': 'bg-yellow-500/20 text-yellow-400',
      Other: 'bg-gray-500/20 text-gray-400',
    };
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${colors[type] || colors.Other}`}>
        {type}
      </span>
    );
  };

  if (authLoading || !user) {
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
        userRole="Administrator"
        userName={user.name || 'Admin MBG'}
        userEmail={user.email}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <PageHeader
            title="Investigasi Issues"
            subtitle="Monitor dan selesaikan laporan masalah"
            icon={AlertTriangle}
            breadcrumbs={[
              { label: 'Dashboard', href: '/admin' },
              { label: 'Issues' },
            ]}
          />

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <GlassPanel>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pending</p>
                  <p className="text-xl font-bold text-white">3</p>
                </div>
              </div>
            </GlassPanel>
            <GlassPanel>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Investigasi</p>
                  <p className="text-xl font-bold text-white">2</p>
                </div>
              </div>
            </GlassPanel>
            <GlassPanel>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Selesai</p>
                  <p className="text-xl font-bold text-white">12</p>
                </div>
              </div>
            </GlassPanel>
            <GlassPanel>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Ditolak</p>
                  <p className="text-xl font-bold text-white">5</p>
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* Filters */}
          <GlassPanel className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan sekolah atau katering..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
              >
                <option value="">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="investigating">Investigasi</option>
                <option value="resolved">Selesai</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
          </GlassPanel>

          {/* Issues Table */}
          <GlassPanel>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-4 font-semibold text-white">ID</th>
                    <th className="text-left p-4 font-semibold text-white">Sekolah</th>
                    <th className="text-left p-4 font-semibold text-white">Katering</th>
                    <th className="text-left p-4 font-semibold text-white">Tipe</th>
                    <th className="text-left p-4 font-semibold text-white">Deskripsi</th>
                    <th className="text-left p-4 font-semibold text-white">Status</th>
                    <th className="text-left p-4 font-semibold text-white">Dilaporkan</th>
                    <th className="text-left p-4 font-semibold text-white">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => (
                    <tr key={issue.id} className="border-b border-white/10 hover:bg-white/5 transition-smooth">
                      <td className="p-4">
                        <span className="font-mono text-sm text-gray-300">#{issue.id}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-white">{issue.school}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-300">{issue.catering}</p>
                      </td>
                      <td className="p-4">{getIssueBadge(issue.issue_type)}</td>
                      <td className="p-4">
                        <div className="flex items-start gap-2">
                          <p className="text-sm text-gray-300 max-w-xs">{issue.description}</p>
                          {issue.has_evidence && (
                            <Image className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(issue.status)}</td>
                      <td className="p-4">
                        <p className="text-gray-300 text-sm">
                          {new Date(issue.reported_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => router.push(`/admin/issues/${issue.id}`)}
                          className="px-4 py-2 gradient-bg-1 text-white rounded-lg text-sm font-semibold hover:shadow-glow transition-smooth flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Lihat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </div>
      </main>
    </div>
  );
}
