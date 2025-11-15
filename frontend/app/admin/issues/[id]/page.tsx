'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import ModernSidebar from '../../../components/layout/ModernSidebar';
import PageHeader from '../../../components/layout/PageHeader';
import GlassPanel from '../../../components/ui/GlassPanel';
import {
  LayoutDashboard,
  Users,
  Shield,
  AlertTriangle,
  Settings,
  BarChart3,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Image as ImageIcon,
  FileText,
  MapPin,
  Calendar,
  User,
  Building2,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';

export default function IssueDetailPage() {
  const router = useRouter();
  const params = useParams();
  const issueId = params.id as string;
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [issue, setIssue] = useState<any>(null);
  const [resolution, setResolution] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    // Mock data - replace with actual API call
    setIssue({
      id: parseInt(issueId),
      school_name: 'SDN 01 Bandung',
      school_id: 1,
      catering_name: 'Katering Sehat Mandiri',
      catering_id: 1,
      delivery_id: 36,
      issue_type: 'Quantity',
      description: 'Jumlah porsi makanan yang diterima kurang 20 dari yang seharusnya (dijanjikan 250 porsi, diterima 230 porsi)',
      status: 'pending',
      severity: 'medium',
      reported_at: '2025-11-14T10:30:00',
      reporter_name: 'Kepala Sekolah SDN 01',
      reporter_contact: 'kepala@sdn01bandung.sch.id',
      expected_quantity: 250,
      received_quantity: 230,
      delivery_date: '2025-11-14',
      delivery_time: '10:00',
      location: 'Jl. Merdeka No. 123, Bandung',
      evidence_photos: [
        '/uploads/evidence/photo1.jpg',
        '/uploads/evidence/photo2.jpg',
      ],
      timeline: [
        {
          timestamp: '2025-11-14T10:30:00',
          action: 'Issue Dilaporkan',
          actor: 'Kepala Sekolah SDN 01',
          description: 'Laporan masalah kekurangan porsi dibuat',
        },
        {
          timestamp: '2025-11-14T10:35:00',
          action: 'Notifikasi Terkirim',
          actor: 'System',
          description: 'Email notifikasi dikirim ke katering dan admin',
        },
      ],
    });
  }, [issueId]);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Akun', path: '/admin/accounts', icon: Users },
    { label: 'Escrow', path: '/admin/escrow', icon: Shield },
    { label: 'Issues', path: '/admin/issues', icon: AlertTriangle },
    { label: 'Laporan', path: '/admin/reports', icon: BarChart3 },
    { label: 'Pengaturan', path: '/admin/settings', icon: Settings },
  ];

  const handleResolve = () => {
    console.log('Resolving issue...', { issueId, resolution, actionNotes });
    alert('Issue berhasil diselesaikan!');
    router.push('/admin/issues');
  };

  const handleReject = () => {
    if (!actionNotes) {
      alert('Mohon berikan alasan penolakan');
      return;
    }
    console.log('Rejecting issue...', { issueId, actionNotes });
    alert('Issue ditolak');
    router.push('/admin/issues');
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      investigating: { label: 'Investigasi', color: 'bg-blue-500/20 text-blue-400', icon: AlertTriangle },
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

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-500/20 text-blue-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      high: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[severity]}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  if (authLoading || !user || !issue) {
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
        <div className="max-w-6xl mx-auto p-8">
          <PageHeader
            title={`Issue #${issueId}`}
            subtitle="Detail investigasi dan resolusi masalah"
            icon={AlertTriangle}
            breadcrumbs={[
              { label: 'Dashboard', href: '/admin' },
              { label: 'Issues', href: '/admin/issues' },
              { label: `#${issueId}` },
            ]}
            actions={
              <button
                onClick={() => router.push('/admin/issues')}
                className="flex items-center gap-2 px-4 py-2 glass-subtle rounded-xl text-white hover:shadow-modern transition-smooth"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
            }
          />

          {/* Issue Header */}
          <GlassPanel className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">
                    {issue.issue_type} Issue
                  </h2>
                  {getStatusBadge(issue.status)}
                  {getSeverityBadge(issue.severity)}
                </div>
                <p className="text-gray-300">{issue.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Dilaporkan</p>
                <p className="font-semibold text-white">
                  {new Date(issue.reported_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Delivery ID</p>
                <p className="font-semibold text-white">#{issue.delivery_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Expected</p>
                <p className="font-semibold text-white">{issue.expected_quantity} porsi</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Received</p>
                <p className="font-semibold text-red-400">{issue.received_quantity} porsi</p>
              </div>
            </div>
          </GlassPanel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* School Info */}
            <GlassPanel>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 gradient-bg-3 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Informasi Sekolah</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Nama Sekolah</p>
                  <p className="font-semibold text-white">{issue.school_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pelapor</p>
                  <p className="font-semibold text-white">{issue.reporter_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Kontak</p>
                  <p className="text-gray-300">{issue.reporter_contact}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Lokasi</p>
                  <p className="text-gray-300 flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                    {issue.location}
                  </p>
                </div>
              </div>
            </GlassPanel>

            {/* Catering Info */}
            <GlassPanel>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 gradient-bg-5 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Informasi Katering</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Nama Katering</p>
                  <p className="font-semibold text-white">{issue.catering_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Tanggal Pengiriman</p>
                  <p className="text-gray-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(issue.delivery_date).toLocaleDateString('id-ID')} - {issue.delivery_time}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status Pengiriman</p>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 mt-1">
                    <Clock className="w-3 h-3" />
                    Under Investigation
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* Evidence Photos */}
          {issue.evidence_photos && issue.evidence_photos.length > 0 && (
            <GlassPanel className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 gradient-bg-1 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Bukti Foto</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {issue.evidence_photos.map((photo: string, idx: number) => (
                  <div
                    key={idx}
                    className="aspect-square bg-white/10 rounded-xl border border-white/20 flex items-center justify-center hover:shadow-modern transition-smooth cursor-pointer"
                  >
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}

          {/* Timeline */}
          <GlassPanel className="mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 gradient-bg-2 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Timeline</h3>
            </div>
            <div className="space-y-4">
              {issue.timeline.map((event: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                    {idx < issue.timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-white/20 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">{event.action}</p>
                      <span className="text-xs text-gray-400">
                        {new Date(event.timestamp).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">oleh {event.actor}</p>
                    <p className="text-sm text-gray-300 mt-1">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* Resolution Actions */}
          {issue.status === 'pending' || issue.status === 'investigating' ? (
            <GlassPanel>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 gradient-bg-4 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Tindakan Resolusi</h3>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Tipe Resolusi
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
                  >
                    <option value="">Pilih resolusi...</option>
                    <option value="refund">Pengembalian Dana Sebagian</option>
                    <option value="redelivery">Pengiriman Ulang</option>
                    <option value="compensation">Kompensasi</option>
                    <option value="penalty">Penalti Katering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Catatan Tindakan
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth resize-none"
                    placeholder="Jelaskan tindakan yang akan diambil dan alasannya..."
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleResolve}
                  disabled={!resolution || !actionNotes}
                  className="flex-1 px-6 py-4 gradient-bg-4 text-white rounded-xl font-semibold hover:shadow-glow transition-smooth flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
                  Selesaikan Issue
                </button>
                <button
                  onClick={handleReject}
                  className="px-6 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold transition-smooth flex items-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Tolak Issue
                </button>
              </div>
            </GlassPanel>
          ) : (
            <GlassPanel>
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-xl font-bold text-white mb-2">
                  Issue telah {issue.status === 'resolved' ? 'diselesaikan' : 'ditolak'}
                </p>
                <p className="text-gray-400">
                  Tindakan telah diambil untuk issue ini
                </p>
              </div>
            </GlassPanel>
          )}
        </div>
      </main>
    </div>
  );
}
