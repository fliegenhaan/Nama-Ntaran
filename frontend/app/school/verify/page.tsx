'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import useDeliveries from '../../hooks/useDeliveries';
import ModernSidebar from '../../components/layout/ModernSidebar';
import PageHeader from '../../components/layout/PageHeader';
import GlassPanel from '../../components/ui/GlassPanel';
import DeliveryCard from '../../components/school/DeliveryCard';
import VerificationModal from '../../components/school/VerificationModal';
import {
  LayoutDashboard,
  CheckCircle,
  AlertTriangle,
  History,
  Loader2,
  QrCode,
} from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { deliveries, isLoading, refetch, createVerification } = useDeliveries({
    school_id: user?.school_id,
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

  // Filter pending deliveries
  const pendingDeliveries = deliveries.filter(
    (d) => d.status === 'scheduled' || d.status === 'delivered'
  );

  const navItems = [
    { label: 'Dashboard', path: '/school', icon: LayoutDashboard },
    { label: 'Verifikasi', path: '/school/verify', icon: CheckCircle },
    { label: 'Riwayat', path: '/school/history', icon: History },
    { label: 'Laporan Masalah', path: '/school/issues', icon: AlertTriangle },
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
      refetch();
    } catch (error: any) {
      alert(`❌ Error: ${error.message || 'Gagal melakukan verifikasi'}`);
    }
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
            title="Verifikasi Pengiriman"
            subtitle="Verifikasi penerimaan makanan dari katering"
            icon={CheckCircle}
            breadcrumbs={[
              { label: 'Dashboard', href: '/school' },
              { label: 'Verifikasi' },
            ]}
          />

          {/* Quick Actions */}
          <GlassPanel className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white mb-1">Metode Verifikasi</h3>
                <p className="text-sm text-gray-300">
                  Pilih metode verifikasi yang sesuai
                </p>
              </div>
              <button
                onClick={() => router.push('/school/verify-qr')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-smooth"
              >
                <QrCode className="w-5 h-5" />
                Scan QR Code
              </button>
            </div>
          </GlassPanel>

          {/* Pending Deliveries */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Pengiriman Menunggu Verifikasi
            </h2>
            <p className="text-gray-300 mb-6">
              {pendingDeliveries.length} pengiriman perlu diverifikasi
            </p>
          </div>

          {pendingDeliveries.length === 0 ? (
            <GlassPanel>
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">Tidak ada pengiriman yang perlu diverifikasi</p>
              </div>
            </GlassPanel>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingDeliveries.map((delivery) => (
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
