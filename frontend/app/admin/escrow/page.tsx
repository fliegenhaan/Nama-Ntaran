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
  Lock,
  Unlock,
  ExternalLink,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function EscrowPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');

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

  const escrows = [
    {
      id: 1,
      school: 'SDN 01 Bandung',
      catering: 'Katering Sehat',
      amount: 15000000,
      status: 'locked',
      lockedAt: '2025-11-10',
      releaseDate: '2025-11-15',
      txHash: '0x7f9fade234b567c89012d3456e78f9a01234b567c890a3b2',
    },
    {
      id: 2,
      school: 'SMP 12 Surabaya',
      catering: 'Katering Nutrisi',
      amount: 18000000,
      status: 'pending_release',
      lockedAt: '2025-11-12',
      releaseDate: '2025-11-16',
      txHash: '0x8a1bcde345c678d90123e4567f89a12345c678d901b4c3',
    },
    {
      id: 3,
      school: 'SDN 05 Jakarta',
      catering: 'Katering Sehat',
      amount: 12500000,
      status: 'released',
      lockedAt: '2025-11-08',
      releaseDate: '2025-11-12',
      releasedAt: '2025-11-12',
      txHash: '0x9b2cdef456d789e01234f5678a90b23456d789e012c5d4',
    },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      locked: { label: 'Terkunci', color: 'bg-blue-500/20 text-blue-400', icon: Lock },
      pending_release: { label: 'Menunggu Rilis', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      released: { label: 'Tercairkan', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
    };
    const c = config[status] || config.locked;
    const Icon = c.icon;
    return (
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${c.color}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </div>
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
            title="Kontrol Escrow"
            subtitle="Monitor dan kelola smart contract escrow"
            icon={Shield}
            breadcrumbs={[
              { label: 'Dashboard', href: '/admin' },
              { label: 'Escrow' },
            ]}
          />

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <GlassPanel>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 gradient-bg-2 rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Terkunci</p>
                  <p className="text-2xl font-bold text-white">Rp 125 M</p>
                </div>
              </div>
            </GlassPanel>
            <GlassPanel>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 gradient-bg-4 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Tercair</p>
                  <p className="text-2xl font-bold text-white">Rp 95 M</p>
                </div>
              </div>
            </GlassPanel>
            <GlassPanel>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 gradient-bg-5 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pending Release</p>
                  <p className="text-2xl font-bold text-white">Rp 30 M</p>
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* Filter */}
          <GlassPanel className="mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
            >
              <option value="">Semua Status</option>
              <option value="locked">Terkunci</option>
              <option value="pending_release">Menunggu Rilis</option>
              <option value="released">Tercairkan</option>
            </select>
          </GlassPanel>

          {/* Escrow Table */}
          <GlassPanel>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-4 font-semibold text-white">ID</th>
                    <th className="text-left p-4 font-semibold text-white">Sekolah</th>
                    <th className="text-left p-4 font-semibold text-white">Katering</th>
                    <th className="text-left p-4 font-semibold text-white">Jumlah</th>
                    <th className="text-left p-4 font-semibold text-white">Status</th>
                    <th className="text-left p-4 font-semibold text-white">Terkunci</th>
                    <th className="text-left p-4 font-semibold text-white">TX Hash</th>
                    <th className="text-left p-4 font-semibold text-white">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {escrows.map((escrow) => (
                    <tr key={escrow.id} className="border-b border-white/10 hover:bg-white/5 transition-smooth">
                      <td className="p-4">
                        <span className="font-mono text-sm text-gray-300">#{escrow.id}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-white">{escrow.school}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-300">{escrow.catering}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-white">
                          Rp {escrow.amount.toLocaleString('id-ID')}
                        </p>
                      </td>
                      <td className="p-4">{getStatusBadge(escrow.status)}</td>
                      <td className="p-4">
                        <p className="text-gray-300">
                          {new Date(escrow.lockedAt).toLocaleDateString('id-ID')}
                        </p>
                      </td>
                      <td className="p-4">
                        <a
                          href={`https://etherscan.io/tx/${escrow.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs font-mono flex items-center gap-1"
                        >
                          {escrow.txHash.substring(0, 10)}...
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="p-4">
                        {escrow.status === 'pending_release' && (
                          <button className="px-4 py-2 gradient-bg-4 text-white rounded-lg text-sm font-semibold hover:shadow-glow transition-smooth flex items-center gap-2">
                            <Unlock className="w-4 h-4" />
                            Release
                          </button>
                        )}
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
