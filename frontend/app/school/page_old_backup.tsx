'use client';

import { useState } from 'react';
import ModernSidebar from '../components/layout/ModernSidebar';
import PageHeader from '../components/layout/PageHeader';
import GlassPanel from '../components/ui/GlassPanel';
import ModernStatCard from '../components/ui/ModernStatCard';
import DeliveryCard from '../components/school/DeliveryCard';
import VerificationModal from '../components/school/VerificationModal';
import {
  LayoutDashboard,
  CheckCircle,
  AlertTriangle,
  History,
  School,
  Package,
  Calendar,
  TrendingUp,
  Clock,
} from 'lucide-react';

export default function SchoolDashboard() {
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data
  const schoolInfo = {
    name: 'SDN 01 Bandung',
    npsn: '20219184',
    address: 'Jl. Dipatiukur No. 35, Bandung',
  };

  const stats = {
    pendingVerifications: 3,
    totalVerified: 45,
    issuesReported: 2,
    thisMonthPortions: 1250,
  };

  const todayDeliveries = [
    {
      id: 1,
      catering: 'Katering Sehat Mandiri',
      portions: 100,
      date: '15 Nov 2025, 10:00',
      status: 'pending' as const,
    },
    {
      id: 2,
      catering: 'Boga Rasa Nusantara',
      portions: 85,
      date: '15 Nov 2025, 11:30',
      status: 'pending' as const,
    },
    {
      id: 3,
      catering: 'Gizi Berkah',
      portions: 90,
      date: '15 Nov 2025, 12:00',
      status: 'pending' as const,
    },
  ];

  const recentHistory = [
    {
      id: 4,
      catering: 'Katering Sehat Mandiri',
      portions: 100,
      date: '14 Nov 2025',
      status: 'verified' as const,
    },
    {
      id: 5,
      catering: 'Boga Rasa Nusantara',
      portions: 85,
      date: '14 Nov 2025',
      status: 'verified' as const,
    },
    {
      id: 6,
      catering: 'Gizi Berkah',
      portions: 90,
      date: '13 Nov 2025',
      status: 'issue' as const,
    },
  ];

  const navItems = [
    { label: 'Dashboard', path: '/school', icon: LayoutDashboard },
    { label: 'Verifikasi', path: '/school/verify', icon: CheckCircle, badge: stats.pendingVerifications },
    { label: 'Riwayat', path: '/school/history', icon: History },
    { label: 'Laporan Masalah', path: '/school/issues', icon: AlertTriangle, badge: stats.issuesReported },
  ];

  const handleVerify = (delivery: any) => {
    setSelectedDelivery(delivery);
    setIsModalOpen(true);
  };

  const handleSubmitVerification = (data: any) => {
    console.log('Verification data:', data);
    // TODO: Send to backend
    alert('Verifikasi berhasil! Dana akan segera dicairkan ke katering.');
  };

  return (
    <div className="flex min-h-screen mesh-gradient">
      {/* Sidebar */}
      <ModernSidebar
        navItems={navItems}
        userRole="School"
        userName="Kepala Sekolah"
        userEmail={schoolInfo.name}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Page Header */}
          <PageHeader
            title="Dashboard Sekolah"
            subtitle="Kelola verifikasi penerimaan makanan dengan mudah"
            icon={School}
            breadcrumbs={[
              { label: 'Dashboard' },
            ]}
          />

          {/* School Info Card */}
          <GlassPanel className="mb-8 gradient-overlay">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {schoolInfo.name}
                </h2>
                <p className="text-gray-600">NPSN: {schoolInfo.npsn}</p>
                <p className="text-sm text-gray-500 mt-1">{schoolInfo.address}</p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 gradient-bg-4 text-white rounded-xl shadow-modern">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  <span className="text-sm font-semibold">Status: Aktif</span>
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ModernStatCard
              title="Menunggu Verifikasi"
              value={stats.pendingVerifications}
              icon={Clock}
              gradient="gradient-bg-5"
              subtitle="Pengiriman hari ini"
            />
            <ModernStatCard
              title="Total Terverifikasi"
              value={stats.totalVerified}
              icon={CheckCircle}
              gradient="gradient-bg-4"
              trend={{ value: 12, isPositive: true }}
              subtitle="Bulan ini"
            />
            <ModernStatCard
              title="Laporan Masalah"
              value={stats.issuesReported}
              icon={AlertTriangle}
              gradient="gradient-bg-2"
              subtitle="Perlu tindak lanjut"
            />
            <ModernStatCard
              title="Porsi Bulan Ini"
              value={stats.thisMonthPortions.toLocaleString()}
              icon={Package}
              gradient="gradient-bg-1"
              trend={{ value: 8, isPositive: true }}
              subtitle="Makanan terdistribusi"
            />
          </div>

          {/* Today's Tasks */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Tugas Hari Ini
                </h2>
                <p className="text-gray-600">
                  {todayDeliveries.length} pengiriman perlu diverifikasi
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 glass-subtle rounded-xl">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">
                  15 November 2025
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {todayDeliveries.map((delivery) => (
                <DeliveryCard
                  key={delivery.id}
                  {...delivery}
                  onVerify={() => handleVerify(delivery)}
                  onReportIssue={() => {
                    // TODO: Open issue modal
                    alert('Form laporan masalah akan dibuka');
                  }}
                />
              ))}
            </div>
          </section>

          {/* Recent History */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Riwayat Terkini
                </h2>
                <p className="text-gray-600">
                  Verifikasi 3 hari terakhir
                </p>
              </div>
              <button className="px-4 py-2 glass-subtle rounded-xl font-semibold hover:shadow-modern transition-smooth">
                Lihat Semua
              </button>
            </div>

            <GlassPanel>
              <div className="space-y-4">
                {recentHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 glass-subtle rounded-xl hover:shadow-modern transition-smooth"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          item.status === 'verified'
                            ? 'bg-green-100'
                            : 'bg-red-100'
                        }`}
                      >
                        {item.status === 'verified' ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.catering}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.portions} porsi • {item.date}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'verified'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.status === 'verified' ? 'Terverifikasi' : 'Ada Masalah'}
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </section>

          {/* Quick Stats */}
          <section className="mt-8">
            <GlassPanel className="gradient-overlay">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6">
                  <div className="w-16 h-16 gradient-bg-1 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-modern">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">98.5%</p>
                  <p className="text-sm text-gray-600">Tingkat Verifikasi</p>
                </div>
                <div className="text-center p-6">
                  <div className="w-16 h-16 gradient-bg-4 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-modern">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">2.3 jam</p>
                  <p className="text-sm text-gray-600">Rata-rata Waktu Verifikasi</p>
                </div>
                <div className="text-center p-6">
                  <div className="w-16 h-16 gradient-bg-5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-modern">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">4.8/5</p>
                  <p className="text-sm text-gray-600">Rating Kualitas Rata-rata</p>
                </div>
              </div>
            </GlassPanel>
          </section>
        </div>
      </main>

      {/* Verification Modal */}
      {selectedDelivery && (
        <VerificationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDelivery(null);
          }}
          delivery={selectedDelivery}
          onSubmit={handleSubmitVerification}
        />
      )}
    </div>
  );
}
