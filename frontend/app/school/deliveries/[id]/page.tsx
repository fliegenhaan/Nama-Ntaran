'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import ModernSidebar from '../../../components/layout/ModernSidebar';
import PageHeader from '../../../components/layout/PageHeader';
import GlassPanel from '../../../components/ui/GlassPanel';
import {
  ArrowLeft,
  Calendar,
  Package,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Loader2,
  School,
  Store,
  LayoutDashboard,
  History,
  Clock,
  Truck,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import api from '../../../lib/api';

export default function DeliveryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const deliveryId = params.id as string;

  const [delivery, setDelivery] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch delivery details
  useEffect(() => {
    if (!deliveryId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/deliveries/${deliveryId}`);
        setDelivery(response.data.delivery);
        setError(null);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.error || 'Failed to load delivery details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [deliveryId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'school') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 blockchain-mesh">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading delivery details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 blockchain-mesh">
        <GlassPanel className="p-8 max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link
            href="/school/history"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-smooth"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to History
          </Link>
        </GlassPanel>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 blockchain-mesh">
        <p className="text-gray-300">Delivery not found</p>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', path: '/school', icon: LayoutDashboard },
    { label: 'Verifikasi', path: '/school/verify', icon: CheckCircle },
    { label: 'Riwayat', path: '/school/history', icon: History },
    { label: 'Laporan Masalah', path: '/school/issues', icon: AlertTriangle },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'Pending', color: 'bg-gray-500/20 text-gray-300', icon: Clock },
      scheduled: { label: 'Terjadwal', color: 'bg-blue-500/20 text-blue-400', icon: Calendar },
      delivered: { label: 'Terkirim', color: 'bg-yellow-500/20 text-yellow-400', icon: Truck },
      verified: { label: 'Terverifikasi', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      cancelled: { label: 'Dibatalkan', color: 'bg-red-500/20 text-red-400', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${config.color}`}>
        <Icon className="w-5 h-5" />
        {config.label}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-950 blockchain-mesh">
      <ModernSidebar
        navItems={navItems}
        userRole="School"
        userName="Kepala Sekolah"
        userEmail={user?.school_name || 'Sekolah'}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <PageHeader
            title="Detail Pengiriman"
            subtitle={`Pengiriman #${deliveryId}`}
            icon={Package}
            breadcrumbs={[
              { label: 'Dashboard', href: '/school' },
              { label: 'Riwayat', href: '/school/history' },
              { label: 'Detail Pengiriman' },
            ]}
          />

          {/* Back Button */}
          <Link
            href="/school/history"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-smooth"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Riwayat
          </Link>

          {/* Status Badge */}
          <div className="mb-6">
            {getStatusBadge(delivery.status)}
          </div>

          {/* Delivery Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <GlassPanel className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <School className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Sekolah</h3>
              </div>
              <p className="text-xl font-bold text-white mb-2">{delivery.school_name || user?.school_name}</p>
              <p className="text-gray-400">NPSN: {delivery.school_npsn || user?.school_npsn}</p>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Store className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Katering</h3>
              </div>
              <p className="text-xl font-bold text-white">{delivery.catering_name}</p>
              <p className="text-gray-400">{delivery.catering_company || 'Perusahaan Katering'}</p>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Tanggal Pengiriman</h3>
              </div>
              <p className="text-xl font-bold text-white">
                {new Date(delivery.delivery_date).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-gray-400">
                {new Date(delivery.delivery_date).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </GlassPanel>
          </div>

          {/* Delivery Details */}
          <GlassPanel className="p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">Informasi Pengiriman</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400 mb-1">Jumlah Porsi</p>
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-400" />
                  <p className="text-2xl font-bold text-white">{delivery.portions}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Total Biaya</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-green-400" />
                  <p className="text-2xl font-bold text-white">
                    Rp {delivery.amount?.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Dibuat Pada</p>
                <p className="text-lg font-semibold text-white">
                  {new Date(delivery.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Terakhir Diperbarui</p>
                <p className="text-lg font-semibold text-white">
                  {new Date(delivery.updated_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </GlassPanel>

          {/* Actions */}
          {(delivery.status === 'scheduled' || delivery.status === 'delivered') && (
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/school/verify')}
                className="flex items-center gap-2 px-6 py-3 gradient-bg-4 text-white rounded-xl font-bold hover:shadow-glow transition-smooth"
              >
                <CheckCircle className="w-5 h-5" />
                Verifikasi Pengiriman
              </button>
              <button
                onClick={() => router.push(`/school/issues/new?delivery_id=${delivery.id}`)}
                className="flex items-center gap-2 px-6 py-3 glass-subtle text-white rounded-xl font-semibold hover:shadow-modern transition-smooth"
              >
                <AlertTriangle className="w-5 h-5" />
                Laporkan Masalah
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
