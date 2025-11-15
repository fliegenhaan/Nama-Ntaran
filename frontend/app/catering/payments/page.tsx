'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import ModernSidebar from '../../components/layout/ModernSidebar';
import PageHeader from '../../components/layout/PageHeader';
import GlassPanel from '../../components/ui/GlassPanel';
import PaymentTimeline from '../../components/catering/PaymentTimeline';
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  Receipt,
  Loader2,
  CheckCircle,
  Clock,
  Lock,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';

export default function PaymentsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'catering') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Mock data - replace with actual API call
  const payments = [
    {
      id: 1,
      school: 'SDN 01 Bandung',
      amount: 'Rp 15.000.000',
      status: 'released' as const,
      lockedAt: '10 Nov 2025',
      releasedAt: '12 Nov 2025',
      txHash: '0x7f9fade234b567c89012d3456e78f9a01234b567c890a3b2',
      blockNumber: 12345678,
    },
    {
      id: 2,
      school: 'SDN 05 Jakarta',
      amount: 'Rp 12.500.000',
      status: 'pending' as const,
      lockedAt: '12 Nov 2025',
      txHash: '0x1234567890abcdef1234567890abcdef12345678',
    },
    {
      id: 3,
      school: 'SMP 12 Surabaya',
      amount: 'Rp 18.000.000',
      status: 'locked' as const,
      lockedAt: '14 Nov 2025',
      txHash: '0xabcdef1234567890abcdef1234567890abcdef12',
    },
  ];

  const stats = {
    totalLocked: 'Rp 125.000.000',
    totalReleased: 'Rp 95.000.000',
    pendingRelease: 'Rp 30.000.000',
  };

  const navItems = [
    { label: 'Dashboard', path: '/catering', icon: LayoutDashboard },
    { label: 'Jadwal', path: '/catering/schedule', icon: Calendar },
    { label: 'Pembayaran', path: '/catering/payments', icon: DollarSign },
    { label: 'Riwayat', path: '/catering/history', icon: Receipt },
  ];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 blockchain-mesh">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      locked: { label: 'Terkunci', color: 'bg-blue-500/20 text-blue-400', icon: Lock },
      pending: { label: 'Menunggu Verifikasi', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      released: { label: 'Dicairkan', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
    };

    const cfg = config[status] || config.locked;
    const Icon = cfg.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${cfg.color}`}>
        <Icon className="w-4 h-4" />
        {cfg.label}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-950 blockchain-mesh">
      <ModernSidebar
        navItems={navItems}
        userRole="Catering"
        userName="Katering Manager"
        userEmail={user.company_name || 'Katering'}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <PageHeader
            title="Pembayaran & Escrow"
            subtitle="Status pencairan dana dari blockchain smart contract"
            icon={DollarSign}
            breadcrumbs={[
              { label: 'Dashboard', href: '/catering' },
              { label: 'Pembayaran' },
            ]}
          />

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Terkunci</p>
                  <p className="text-3xl font-bold text-white">{stats.totalLocked}</p>
                  <p className="text-sm text-gray-400 mt-1">Di smart contract</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Menunggu Verifikasi</p>
                  <p className="text-3xl font-bold text-white">{stats.pendingRelease}</p>
                  <p className="text-sm text-gray-400 mt-1">Akan cair segera</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Dicairkan</p>
                  <p className="text-3xl font-bold text-white">{stats.totalReleased}</p>
                  <p className="text-sm text-gray-400 mt-1">Bulan ini</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* Payment Timeline */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Timeline Pembayaran</h2>
            <PaymentTimeline payments={payments} />
          </div>

          {/* Payment List */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Daftar Pembayaran</h2>
          </div>

          <GlassPanel>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-4 font-semibold text-white">Sekolah</th>
                    <th className="text-left p-4 font-semibold text-white">Jumlah</th>
                    <th className="text-left p-4 font-semibold text-white">Status</th>
                    <th className="text-left p-4 font-semibold text-white">Terkunci Pada</th>
                    <th className="text-left p-4 font-semibold text-white">Dicairkan Pada</th>
                    <th className="text-left p-4 font-semibold text-white">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-white/10 hover:bg-white/5 transition-smooth"
                    >
                      <td className="p-4">
                        <p className="font-semibold text-white">{payment.school}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-white">{payment.amount}</p>
                      </td>
                      <td className="p-4">{getStatusBadge(payment.status)}</td>
                      <td className="p-4">
                        <p className="text-gray-300">{payment.lockedAt}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-300">{payment.releasedAt || '-'}</p>
                      </td>
                      <td className="p-4">
                        {payment.txHash && (
                          <a
                            href={`https://etherscan.io/tx/${payment.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-semibold transition-smooth"
                          >
                            Lihat TX
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>

          {/* Info Panel */}
          <GlassPanel className="mt-8 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Bagaimana Sistem Pembayaran Bekerja?</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>1. Dana dikunci di smart contract saat delivery dibuat</p>
                  <p>2. Sekolah memverifikasi penerimaan makanan</p>
                  <p>3. Smart contract otomatis mencairkan dana ke katering</p>
                  <p>4. Semua transaksi tercatat di blockchain untuk transparansi</p>
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </main>
    </div>
  );
}
