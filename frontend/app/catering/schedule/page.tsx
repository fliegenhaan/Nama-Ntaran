'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import ModernSidebar from '../../components/layout/ModernSidebar';
import PageHeader from '../../components/layout/PageHeader';
import GlassPanel from '../../components/ui/GlassPanel';
import DeliveryCalendar from '../../components/catering/DeliveryCalendar';
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  Receipt,
  Loader2,
  Clock,
  MapPin,
  Package,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function SchedulePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

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
  const upcomingDeliveries = [
    {
      id: 1,
      school_name: 'SDN 01 Bandung',
      delivery_date: '2025-11-15T10:30:00',
      portions: 250,
      address: 'Jl. Merdeka No. 123, Bandung',
      status: 'scheduled',
    },
    {
      id: 2,
      school_name: 'SDN 05 Jakarta',
      delivery_date: '2025-11-15T11:00:00',
      portions: 180,
      address: 'Jl. Sudirman No. 45, Jakarta',
      status: 'scheduled',
    },
    {
      id: 3,
      school_name: 'SMP 12 Surabaya',
      delivery_date: '2025-11-16T09:30:00',
      portions: 200,
      address: 'Jl. Pemuda No. 78, Surabaya',
      status: 'scheduled',
    },
  ];

  const calendarEvents = upcomingDeliveries.map(d => ({
    id: d.id,
    date: d.delivery_date.split('T')[0],
    school: d.school_name,
    portions: d.portions,
    time: new Date(d.delivery_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    status: d.status as 'scheduled' | 'completed',
  }));

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
      scheduled: { label: 'Terjadwal', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
      in_progress: { label: 'Dalam Pengiriman', color: 'bg-yellow-500/20 text-yellow-400', icon: Package },
      completed: { label: 'Selesai', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      cancelled: { label: 'Dibatalkan', color: 'bg-red-500/20 text-red-400', icon: AlertCircle },
    };

    const cfg = config[status] || config.scheduled;
    const Icon = cfg.icon;

    return (
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
        <Icon className="w-3 h-3" />
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
            title="Jadwal Pengiriman"
            subtitle="Kelola jadwal pengiriman makanan ke sekolah"
            icon={Calendar}
            breadcrumbs={[
              { label: 'Dashboard', href: '/catering' },
              { label: 'Jadwal' },
            ]}
          />

          {/* Calendar Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Kalender Pengiriman</h2>
            <DeliveryCalendar events={calendarEvents} />
          </div>

          {/* Upcoming Deliveries */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Pengiriman Mendatang</h2>
            <p className="text-gray-300 mb-6">
              {upcomingDeliveries.length} pengiriman dijadwalkan
            </p>
          </div>

          <div className="space-y-4">
            {upcomingDeliveries.map((delivery) => (
              <GlassPanel key={delivery.id} className="p-6 hover:shadow-glow transition-smooth">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{delivery.school_name}</h3>
                      {getStatusBadge(delivery.status)}
                    </div>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span>
                          {new Date(delivery.delivery_date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span>
                          {new Date(delivery.delivery_date).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span>{delivery.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-400" />
                        <span className="font-semibold">{delivery.portions} Porsi</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => router.push(`/catering/deliveries/${delivery.id}`)}
                      className="px-4 py-2 gradient-bg-4 text-white rounded-xl font-semibold hover:shadow-glow transition-smooth"
                    >
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>

          {upcomingDeliveries.length === 0 && (
            <GlassPanel>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">Tidak ada pengiriman yang dijadwalkan</p>
              </div>
            </GlassPanel>
          )}
        </div>
      </main>
    </div>
  );
}
