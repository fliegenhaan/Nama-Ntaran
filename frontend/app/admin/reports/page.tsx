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
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  CheckCircle,
} from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [reportType, setReportType] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState('2025-11');

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

  const monthlyStats = {
    totalDeliveries: 156,
    totalAmount: 125000000,
    totalPortions: 18420,
    verificationRate: 98.5,
    issueRate: 1.5,
    averageProcessingTime: '2.3 jam',
  };

  const handleExport = (format: string) => {
    console.log(`Exporting as ${format}...`);
    alert(`Export ${format} akan segera tersedia!`);
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
            title="Laporan & Analytics"
            subtitle="Generate dan download laporan sistem"
            icon={BarChart3}
            breadcrumbs={[
              { label: 'Dashboard', href: '/admin' },
              { label: 'Laporan' },
            ]}
          />

          {/* Report Filters */}
          <GlassPanel className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-white mb-2">
                  Tipe Laporan
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
                >
                  <option value="daily">Harian</option>
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-white mb-2">
                  Periode
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleExport('PDF')}
                  className="px-6 py-3 gradient-bg-1 text-white rounded-xl font-semibold hover:shadow-glow transition-smooth flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export PDF
                </button>
                <button
                  onClick={() => handleExport('Excel')}
                  className="px-6 py-3 gradient-bg-4 text-white rounded-xl font-semibold hover:shadow-glow transition-smooth flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export Excel
                </button>
              </div>
            </div>
          </GlassPanel>

          {/* Monthly Overview */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Ringkasan November 2025</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <GlassPanel>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-bg-3 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Pengiriman</p>
                    <p className="text-2xl font-bold text-white">{monthlyStats.totalDeliveries}</p>
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-bg-2 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Dana</p>
                    <p className="text-2xl font-bold text-white">
                      Rp {(monthlyStats.totalAmount / 1000000).toFixed(0)} M
                    </p>
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-bg-5 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Porsi</p>
                    <p className="text-2xl font-bold text-white">
                      {monthlyStats.totalPortions.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-bg-4 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Tingkat Verifikasi</p>
                    <p className="text-2xl font-bold text-white">{monthlyStats.verificationRate}%</p>
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-bg-5 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Tingkat Issue</p>
                    <p className="text-2xl font-bold text-white">{monthlyStats.issueRate}%</p>
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-bg-1 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Avg. Processing</p>
                    <p className="text-2xl font-bold text-white">{monthlyStats.averageProcessingTime}</p>
                  </div>
                </div>
              </GlassPanel>
            </div>
          </div>

          {/* Detailed Reports */}
          <GlassPanel>
            <h3 className="text-xl font-bold text-white mb-6">Laporan Detail</h3>
            <div className="space-y-4">
              {[
                { name: 'Laporan Pengiriman Bulanan', date: '1-30 Nov 2025', size: '2.4 MB' },
                { name: 'Laporan Keuangan & Pencairan Dana', date: '1-30 Nov 2025', size: '1.8 MB' },
                { name: 'Laporan Issues & Resolusi', date: '1-30 Nov 2025', size: '890 KB' },
                { name: 'Laporan Performance Katering', date: '1-30 Nov 2025', size: '1.2 MB' },
                { name: 'Laporan Blockchain Transactions', date: '1-30 Nov 2025', size: '3.1 MB' },
              ].map((report, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 glass-subtle rounded-xl hover:shadow-modern transition-smooth"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 gradient-bg-2 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{report.name}</p>
                      <p className="text-sm text-gray-400">
                        {report.date} • {report.size}
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 gradient-bg-4 text-white rounded-lg text-sm font-semibold hover:shadow-glow transition-smooth flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </main>
    </div>
  );
}
