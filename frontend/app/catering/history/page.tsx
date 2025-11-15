'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import ModernSidebar from '../../components/layout/ModernSidebar';
import PageHeader from '../../components/layout/PageHeader';
import GlassPanel from '../../components/ui/GlassPanel';
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  Receipt,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Filter,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Truck,
} from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

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
  const deliveries = [
    {
      id: 1,
      school_name: 'SDN 01 Bandung',
      delivery_date: '2025-11-14T10:30:00',
      portions: 250,
      amount: 15000000,
      status: 'verified',
    },
    {
      id: 2,
      school_name: 'SDN 05 Jakarta',
      delivery_date: '2025-11-13T11:00:00',
      portions: 180,
      amount: 12500000,
      status: 'verified',
    },
    {
      id: 3,
      school_name: 'SMP 12 Surabaya',
      delivery_date: '2025-11-12T09:30:00',
      portions: 200,
      amount: 18000000,
      status: 'verified',
    },
    {
      id: 4,
      school_name: 'SDN 02 Bandung',
      delivery_date: '2025-11-11T10:00:00',
      portions: 220,
      amount: 16000000,
      status: 'cancelled',
    },
  ];

  const handleApplyFilters = () => {
    setCurrentPage(1);
    // Implement filter logic
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleExport = () => {
    alert('Fitur export akan segera hadir!');
  };

  // Filter deliveries by search query
  const filteredDeliveries = deliveries.filter(d => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.school_name?.toLowerCase().includes(query) ||
      d.id.toString().includes(query)
    );
  });

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
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
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
            title="Riwayat Pengiriman"
            subtitle="Lihat semua riwayat pengiriman dan pembayaran"
            icon={Receipt}
            breadcrumbs={[
              { label: 'Dashboard', href: '/catering' },
              { label: 'Riwayat' },
            ]}
          />

          {/* Filters */}
          <GlassPanel className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Filter & Pencarian</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 glass-subtle rounded-xl text-white hover:shadow-modern transition-smooth"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Sembunyikan' : 'Tampilkan'} Filter
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan sekolah atau ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth outline-none"
              />
            </div>

            {showFilters && (
              <div className="space-y-4 pt-4 border-t border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
                    >
                      <option value="">Semua Status</option>
                      <option value="pending">Pending</option>
                      <option value="scheduled">Terjadwal</option>
                      <option value="delivered">Terkirim</option>
                      <option value="verified">Terverifikasi</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                  </div>

                  {/* Date From */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Tanggal Akhir
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleApplyFilters}
                    className="flex-1 gradient-bg-4 text-white py-3 rounded-xl font-bold hover:shadow-glow transition-smooth"
                  >
                    Terapkan Filter
                  </button>
                  <button
                    onClick={handleResetFilters}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-smooth"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </GlassPanel>

          {/* Actions */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-300">
              Menampilkan {filteredDeliveries.length} hasil
            </p>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 glass-subtle rounded-xl text-white hover:shadow-modern transition-smooth"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Deliveries Table */}
          <GlassPanel>
            {filteredDeliveries.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">Tidak ada riwayat ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left p-4 font-semibold text-white">ID</th>
                      <th className="text-left p-4 font-semibold text-white">Sekolah</th>
                      <th className="text-left p-4 font-semibold text-white">Tanggal</th>
                      <th className="text-left p-4 font-semibold text-white">Porsi</th>
                      <th className="text-left p-4 font-semibold text-white">Jumlah</th>
                      <th className="text-left p-4 font-semibold text-white">Status</th>
                      <th className="text-left p-4 font-semibold text-white">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeliveries.map((delivery) => (
                      <tr
                        key={delivery.id}
                        className="border-b border-white/10 hover:bg-white/5 transition-smooth"
                      >
                        <td className="p-4">
                          <span className="font-mono text-sm text-gray-300">#{delivery.id}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-white">{delivery.school_name}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-gray-300">
                            {new Date(delivery.delivery_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-white">{delivery.portions}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-white">
                            Rp {delivery.amount?.toLocaleString('id-ID')}
                          </p>
                        </td>
                        <td className="p-4">{getStatusBadge(delivery.status)}</td>
                        <td className="p-4">
                          <button
                            onClick={() => router.push(`/catering/deliveries/${delivery.id}`)}
                            className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition-smooth"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {filteredDeliveries.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/20">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 glass-subtle rounded-xl text-white hover:shadow-modern transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Sebelumnya
                </button>

                <p className="text-gray-300">Halaman {currentPage}</p>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={filteredDeliveries.length < 10}
                  className="flex items-center gap-2 px-4 py-2 glass-subtle rounded-xl text-white hover:shadow-modern transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </GlassPanel>
        </div>
      </main>
    </div>
  );
}
