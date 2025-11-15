'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import ModernSidebar from '../components/layout/ModernSidebar';
import PageHeader from '../components/layout/PageHeader';
import GlassPanel from '../components/ui/GlassPanel';
import ModernStatCard from '../components/ui/ModernStatCard';
import MonitoringMap from '../components/admin/MonitoringMap';
import AccountManagementTable from '../components/admin/AccountManagementTable';
import IssuePanel from '../components/admin/IssuePanel';
import EscrowController from '../components/admin/EscrowController';
import {
  LayoutDashboard,
  Users,
  Shield,
  AlertTriangle,
  Settings,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  Building2,
  UtensilsCrossed,
  Map,
  Download,
  BarChart3,
  Loader2,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'accounts' | 'escrow' | 'issues'>('overview');

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const adminInfo = {
    name: 'Admin MBG',
    email: 'admin@mbg.gov.id',
  };

  const stats = {
    totalSchools: 24,
    totalCaterings: 8,
    activeEscrows: 15,
    totalFundsLocked: 'Rp 125 M',
    totalDisbursed: 'Rp 95 M',
    pendingIssues: 3,
    resolvedIssues: 12,
    systemUptime: '99.8%',
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Akun', path: '/admin/accounts', icon: Users },
    { label: 'Escrow', path: '/admin/escrow', icon: Shield, badge: 5 },
    { label: 'Issues', path: '/admin/issues', icon: AlertTriangle, badge: stats.pendingIssues },
    { label: 'Laporan', path: '/admin/reports', icon: BarChart3 },
    { label: 'Pengaturan', path: '/admin/settings', icon: Settings },
  ];

  const handleExportReport = () => {
    console.log('Exporting report...');
    // TODO: Implement report export functionality
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 blockchain-mesh">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950 blockchain-mesh">
      <ModernSidebar
        navItems={navItems}
        userRole="Administrator"
        userName={user.name || adminInfo.name}
        userEmail={user.email || adminInfo.email}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <PageHeader
            title="Dashboard Administrator"
            subtitle="Monitoring dan kelola sistem MBG (Makan Bergizi Gabocor)"
            icon={Shield}
            breadcrumbs={[{ label: 'Dashboard' }]}
            actions={
              <button
                onClick={handleExportReport}
                className="btn-modern gradient-bg-1 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-glow transition-smooth flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export Laporan
              </button>
            }
          />

          {/* Admin Info */}
          <GlassPanel className="mb-8 gradient-overlay">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Sistem MBG - Control Center
                </h2>
                <p className="text-gray-600">Blockchain-based School Food Distribution</p>
                <p className="text-sm text-gray-500 mt-1">
                  Monitoring {stats.totalSchools} sekolah dan {stats.totalCaterings} katering
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 gradient-bg-4 text-white rounded-xl shadow-modern">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  <span className="text-sm font-semibold">System Uptime: {stats.systemUptime}</span>
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ModernStatCard
              title="Total Sekolah"
              value={stats.totalSchools}
              icon={Building2}
              gradient="gradient-bg-3"
              subtitle="Partner aktif"
            />
            <ModernStatCard
              title="Total Katering"
              value={stats.totalCaterings}
              icon={UtensilsCrossed}
              gradient="gradient-bg-5"
              subtitle="Vendor terdaftar"
            />
            <ModernStatCard
              title="Dana Terkunci"
              value={stats.totalFundsLocked}
              icon={DollarSign}
              gradient="gradient-bg-2"
              subtitle="Di smart contract"
            />
            <ModernStatCard
              title="Dana Tercair"
              value={stats.totalDisbursed}
              icon={CheckCircle}
              gradient="gradient-bg-4"
              trend={{ value: 12, isPositive: true }}
              subtitle="Bulan ini"
            />
            <ModernStatCard
              title="Escrow Aktif"
              value={stats.activeEscrows}
              icon={Shield}
              gradient="gradient-bg-1"
              subtitle="Transaksi berjalan"
            />
            <ModernStatCard
              title="Issues Pending"
              value={stats.pendingIssues}
              icon={AlertTriangle}
              gradient="gradient-bg-5"
              subtitle="Perlu investigasi"
            />
            <ModernStatCard
              title="Issues Selesai"
              value={stats.resolvedIssues}
              icon={CheckCircle}
              gradient="gradient-bg-4"
              subtitle="7 hari terakhir"
            />
            <ModernStatCard
              title="Rata-rata Pencairan"
              value="2.3 jam"
              icon={Clock}
              gradient="gradient-bg-2"
              subtitle="Waktu proses"
            />
          </div>

          {/* Section Tabs */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-6 py-3 rounded-xl font-semibold transition-smooth ${
                activeSection === 'overview'
                  ? 'gradient-bg-1 text-white shadow-glow'
                  : 'glass-subtle text-gray-700 hover:shadow-modern'
              }`}
            >
              <Map className="w-4 h-4 inline mr-2" />
              Monitoring
            </button>
            <button
              onClick={() => setActiveSection('accounts')}
              className={`px-6 py-3 rounded-xl font-semibold transition-smooth ${
                activeSection === 'accounts'
                  ? 'gradient-bg-1 text-white shadow-glow'
                  : 'glass-subtle text-gray-700 hover:shadow-modern'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Manajemen Akun
            </button>
            <button
              onClick={() => setActiveSection('escrow')}
              className={`px-6 py-3 rounded-xl font-semibold transition-smooth ${
                activeSection === 'escrow'
                  ? 'gradient-bg-1 text-white shadow-glow'
                  : 'glass-subtle text-gray-700 hover:shadow-modern'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Kontrol Escrow
            </button>
            <button
              onClick={() => setActiveSection('issues')}
              className={`px-6 py-3 rounded-xl font-semibold transition-smooth relative ${
                activeSection === 'issues'
                  ? 'gradient-bg-1 text-white shadow-glow'
                  : 'glass-subtle text-gray-700 hover:shadow-modern'
              }`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Investigasi Issues
              {stats.pendingIssues > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {stats.pendingIssues}
                </span>
              )}
            </button>
          </div>

          {/* Dynamic Content Based on Active Section */}
          {activeSection === 'overview' && (
            <section className="mb-8">
              <MonitoringMap height="600px" />
            </section>
          )}

          {activeSection === 'accounts' && (
            <section className="mb-8">
              <AccountManagementTable
                onAdd={() => console.log('Add account')}
                onEdit={(id) => console.log('Edit account', id)}
                onDelete={(id) => console.log('Delete account', id)}
              />
            </section>
          )}

          {activeSection === 'escrow' && (
            <section className="mb-8">
              <EscrowController
                onLock={(id) => console.log('Lock funds', id)}
                onRelease={(id) => console.log('Release funds', id)}
              />
            </section>
          )}

          {activeSection === 'issues' && (
            <section className="mb-8">
              <IssuePanel
                onInvestigate={(id) => console.log('Investigate issue', id)}
                onResolve={(id) => console.log('Resolve issue', id)}
                onReject={(id) => console.log('Reject issue', id)}
              />
            </section>
          )}

          {/* AI Priority & Analytics Section */}
          {activeSection === 'overview' && (
            <section className="mb-8">
              <GlassPanel className="gradient-overlay">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 gradient-bg-1 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">AI Priority Allocation</h3>
                    <p className="text-gray-600">Sistem AI menentukan prioritas berdasarkan berbagai faktor</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* High Priority Schools */}
                  <div className="glass-subtle rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <h4 className="font-bold text-gray-900">Prioritas Tinggi (80-100)</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">SMP 12 Surabaya</span>
                        <span className="font-bold text-red-600">92</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">SDN 01 Bandung</span>
                        <span className="font-bold text-red-600">85</span>
                      </div>
                    </div>
                  </div>

                  {/* Medium Priority Schools */}
                  <div className="glass-subtle rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <h4 className="font-bold text-gray-900">Prioritas Sedang (60-79)</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">SDN 05 Jakarta</span>
                        <span className="font-bold text-yellow-600">78</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">SDN 03 Yogyakarta</span>
                        <span className="font-bold text-yellow-600">65</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Factors */}
                  <div className="glass-subtle rounded-xl p-6">
                    <h4 className="font-bold text-gray-900 mb-4">Faktor Perhitungan AI</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Jumlah siswa</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Lokasi geografis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Riwayat pengiriman</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Status ekonomi daerah</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Jarak dari katering</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            </section>
          )}

          {/* Recent Activity Log */}
          {activeSection === 'overview' && (
            <section>
              <GlassPanel className="gradient-overlay">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Activity Log (Real-Time)</h3>
                <div className="space-y-3">
                  {[
                    { time: '10:30', action: 'Dana tercairkan untuk SDN 01 Bandung', type: 'success', amount: 'Rp 15.000.000' },
                    { time: '10:15', action: 'Verifikasi diterima dari SMP 12 Surabaya', type: 'info' },
                    { time: '09:45', action: 'Masalah dilaporkan oleh SDN 05 Jakarta', type: 'warning' },
                    { time: '09:30', action: 'Dana terkunci untuk pengiriman hari ini', type: 'success', amount: 'Rp 30.000.000' },
                    { time: '09:00', action: 'Akun katering baru terdaftar: Katering Sehat', type: 'info' },
                  ].map((log, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 glass-subtle rounded-xl hover:shadow-modern transition-smooth">
                      <div className={`w-2 h-2 rounded-full ${
                        log.type === 'success' ? 'bg-green-500' :
                        log.type === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      } animate-pulse`}></div>
                      <span className="text-sm text-gray-600 min-w-[60px]">{log.time}</span>
                      <span className="flex-1 text-sm text-gray-900">{log.action}</span>
                      {log.amount && (
                        <span className="text-sm font-bold text-green-600">{log.amount}</span>
                      )}
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
