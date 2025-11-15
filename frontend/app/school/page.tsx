'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import useDeliveries from '../hooks/useDeliveries';
import useVerifications from '../hooks/useVerifications';
import useIssues from '../hooks/useIssues';
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
  Loader2,
} from 'lucide-react';

export default function SchoolDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch deliveries for this school
  const { deliveries, isLoading: deliveriesLoading, refetch: refetchDeliveries } = useDeliveries({
    school_id: user?.school_id,
  });

  // Fetch verification stats
  const { stats: verificationStats, createVerification } = useVerifications({
    school_id: user?.school_id,
  });

  // Fetch issues
  const { issues, stats: issueStats } = useIssues({
    autoFetch: true,
  });

  // Redirect if not authenticated or not a school user
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'school') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Filter today's deliveries
  const today = new Date().toISOString().split('T')[0];
  const todayDeliveries = deliveries.filter(d => {
    const deliveryDate = new Date(d.delivery_date).toISOString().split('T')[0];
    return deliveryDate === today && (d.status === 'scheduled' || d.status === 'delivered');
  });

  // Recent verified deliveries (last 3)
  const recentHistory = deliveries
    .filter(d => d.status === 'verified')
    .slice(0, 3);

  // Calculate stats
  const pendingVerifications = todayDeliveries.length;
  const totalVerified = verificationStats?.total || deliveries.filter(d => d.status === 'verified').length;
  const issuesReported = issueStats?.open || 0;

  // Calculate this month portions
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthPortions = deliveries
    .filter(d => {
      const deliveryDate = new Date(d.delivery_date);
      return deliveryDate.getMonth() === currentMonth &&
             deliveryDate.getFullYear() === currentYear &&
             d.status === 'verified';
    })
    .reduce((sum, d) => sum + d.portions, 0);

  const navItems = [
    { label: 'Dashboard', path: '/school', icon: LayoutDashboard },
    { label: 'Verifikasi', path: '/school/verify', icon: CheckCircle, badge: pendingVerifications },
    { label: 'Riwayat', path: '/school/history', icon: History },
    { label: 'Laporan Masalah', path: '/school/issues', icon: AlertTriangle, badge: issuesReported },
  ];

  const handleVerify = (delivery: any) => {
    setSelectedDelivery(delivery);
    setIsModalOpen(true);
  };

  const handleSubmitVerification = async (data: any) => {
    try {
      const response = await createVerification({
        delivery_id: selectedDelivery.id,
        status: 'approved',
        portions_received: data.portionsReceived,
        quality_rating: data.quality,
        notes: data.notes,
        photo_url: data.photoUrl || null,
      });

      // Show success message with blockchain info
      let message = '✅ Verifikasi berhasil!';

      if (response?.blockchain?.released) {
        message += `\n\n🔗 Dana telah dicairkan ke katering via blockchain!`;
        message += `\nTx Hash: ${response.blockchain.transactionHash.substring(0, 20)}...`;
        message += `\nBlock: ${response.blockchain.blockNumber}`;
      } else {
        message += '\n\n⚠️ Verifikasi tersimpan, namun blockchain belum dikonfigurasi.';
      }

      alert(message);
      setIsModalOpen(false);
      setSelectedDelivery(null);
      refetchDeliveries();
    } catch (error: any) {
      alert(`❌ Error: ${error.message || 'Gagal melakukan verifikasi'}`);
    }
  };

  // Loading state
  if (authLoading || deliveriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 blockchain-mesh">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Memuat data...</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!user || user.role !== 'school') {
    return null;
  }

  // School info from user data
  const schoolInfo = {
    name: user.school_name || 'Sekolah',
    npsn: user.school_npsn || '-',
    address: user.school_address || '-',
  };

  return (
    <div className="flex min-h-screen bg-gray-950 blockchain-mesh">
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
          <GlassPanel className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {schoolInfo.name}
                </h2>
                <p className="text-gray-300">NPSN: {schoolInfo.npsn}</p>
                <p className="text-sm text-gray-400 mt-1">{schoolInfo.address}</p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 gradient-bg-4 text-white rounded-xl shadow-modern transition-smooth">
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
              value={pendingVerifications}
              icon={Clock}
              gradient="gradient-bg-5"
              subtitle="Pengiriman hari ini"
            />
            <ModernStatCard
              title="Total Terverifikasi"
              value={totalVerified}
              icon={CheckCircle}
              gradient="gradient-bg-4"
              subtitle="Bulan ini"
            />
            <ModernStatCard
              title="Laporan Masalah"
              value={issuesReported}
              icon={AlertTriangle}
              gradient="gradient-bg-2"
              subtitle="Perlu tindak lanjut"
            />
            <ModernStatCard
              title="Porsi Bulan Ini"
              value={thisMonthPortions.toLocaleString()}
              icon={Package}
              gradient="gradient-bg-1"
              subtitle="Makanan terdistribusi"
            />
          </div>

          {/* Today's Tasks */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Tugas Hari Ini
                </h2>
                <p className="text-gray-300">
                  {todayDeliveries.length} pengiriman perlu diverifikasi
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 glass-subtle rounded-xl">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-white">
                  {new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {todayDeliveries.length === 0 ? (
              <GlassPanel>
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">Tidak ada pengiriman hari ini</p>
                </div>
              </GlassPanel>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {todayDeliveries.map((delivery) => (
                  <DeliveryCard
                    key={delivery.id}
                    id={delivery.id}
                    catering={delivery.catering_name || 'Katering'}
                    portions={delivery.portions}
                    date={new Date(delivery.delivery_date).toLocaleString('id-ID')}
                    status={delivery.status}
                    onVerify={() => handleVerify(delivery)}
                    onReportIssue={() => {
                      router.push(`/school/issues/new?delivery_id=${delivery.id}`);
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Recent History */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Riwayat Terkini
                </h2>
                <p className="text-gray-300">
                  Verifikasi terakhir
                </p>
              </div>
              <button
                onClick={() => router.push('/school/history')}
                className="px-4 py-2 glass-subtle rounded-xl font-semibold text-white hover:shadow-modern transition-smooth"
              >
                Lihat Semua
              </button>
            </div>

            <GlassPanel>
              {recentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-300">Belum ada riwayat verifikasi</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 glass-subtle rounded-xl hover:shadow-modern transition-smooth"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-500/20">
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {item.catering_name || 'Katering'}
                          </p>
                          <p className="text-sm text-gray-300">
                            {item.portions} porsi • {new Date(item.delivery_date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                        Terverifikasi
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>
          </section>

          {/* Quick Stats */}
          <section className="mt-8">
            <GlassPanel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6">
                  <div className="w-16 h-16 gradient-bg-1 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-modern">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {totalVerified > 0 ? ((totalVerified / deliveries.length) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-sm text-gray-300">Tingkat Verifikasi</p>
                </div>
                <div className="text-center p-6">
                  <div className="w-16 h-16 gradient-bg-4 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-modern">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{totalVerified}</p>
                  <p className="text-sm text-gray-300">Total Verifikasi</p>
                </div>
                <div className="text-center p-6">
                  <div className="w-16 h-16 gradient-bg-5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-modern">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{thisMonthPortions}</p>
                  <p className="text-sm text-gray-300">Porsi Bulan Ini</p>
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
