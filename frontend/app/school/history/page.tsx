'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import useDeliveries from '../../hooks/useDeliveries';
import ModernSidebar from '../../components/layout/ModernSidebar';
import PageHeader from '../../components/layout/PageHeader';
import GlassPanel from '../../components/ui/GlassPanel';
import {
  History,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Calendar,
  Filter,
  Download,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
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

  const { deliveries, isLoading, refetch } = useDeliveries({
    school_id: user?.school_id,
    status: statusFilter,
    date_from: dateFrom,
    date_to: dateTo,
    page: currentPage,
    limit: 10,
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

  const handleApplyFilters = () => {
    setCurrentPage(1);
    refetch();
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
    setCurrentPage(1);
    refetch();
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    alert('Fitur export akan segera hadir!');
  };

  // Filter deliveries by search query (client-side)
  const filteredDeliveries = deliveries.filter(d => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.catering_name?.toLowerCase().includes(query) ||
      d.id.toString().includes(query)
    );
  });

  const navItems = [
    { label: 'Dashboard', path: '/school' },
    { label: 'Riwayat', path: '/school/history' },
    { label: 'Laporan Masalah', path: '/school/issues' },
  ];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-gradient">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
      scheduled: { label: 'Terjadwal', color: 'bg-blue-100 text-blue-700', icon: Calendar },
      delivered: { label: 'Terkirim', color: 'bg-yellow-100 text-yellow-700', icon: Package },
      verified: { label: 'Terverifikasi', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700', icon: XCircle },
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
    <div className="flex min-h-screen mesh-gradient">
      <ModernSidebar
        navItems={navItems}
        userRole="School"
        userName="Kepala Sekolah"
        userEmail={user.school_name || 'Sekolah'}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <PageHeader
            title="Riwayat Pengiriman"
            subtitle="Lihat semua riwayat pengiriman dan verifikasi"
            icon={History}
            breadcrumbs={[
              { label: 'Dashboard', href: '/school' },
              { label: 'Riwayat' },
            ]}
          />

          {/* Filters */}
          <GlassPanel className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filter & Pencarian</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 glass-subtle rounded-xl hover:shadow-modern transition-smooth"
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
                placeholder="Cari berdasarkan katering atau ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 glass-subtle rounded-xl outline-none focus-ring"
              />
            </div>

            {showFilters && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full glass-subtle rounded-xl p-3 outline-none focus-ring"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full glass-subtle rounded-xl p-3 outline-none focus-ring"
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tanggal Akhir
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full glass-subtle rounded-xl p-3 outline-none focus-ring"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleApplyFilters}
                    className="flex-1 gradient-bg-4 text-white py-3 rounded-xl font-semibold hover:shadow-glow transition-smooth"
                  >
                    Terapkan Filter
                  </button>
                  <button
                    onClick={handleResetFilters}
                    className="flex-1 glass-subtle py-3 rounded-xl font-semibold hover:shadow-modern transition-smooth"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </GlassPanel>

          {/* Actions */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              Menampilkan {filteredDeliveries.length} hasil
            </p>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 glass-subtle rounded-xl hover:shadow-modern transition-smooth"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Deliveries Table */}
          <GlassPanel>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Memuat data...</p>
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada riwayat ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-4 font-semibold text-gray-700">ID</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Katering</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Tanggal</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Porsi</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Jumlah</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeliveries.map((delivery) => (
                      <tr
                        key={delivery.id}
                        className="border-b border-gray-100 hover:bg-gray-50/50 transition-smooth"
                      >
                        <td className="p-4">
                          <span className="font-mono text-sm">#{delivery.id}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-gray-900">{delivery.catering_name}</p>
                          <p className="text-sm text-gray-500">{delivery.catering_company}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-gray-900">
                            {new Date(delivery.delivery_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-gray-900">{delivery.portions}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-gray-900">
                            Rp {delivery.amount?.toLocaleString('id-ID')}
                          </p>
                        </td>
                        <td className="p-4">{getStatusBadge(delivery.status)}</td>
                        <td className="p-4">
                          <button
                            onClick={() => router.push(`/school/deliveries/${delivery.id}`)}
                            className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
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
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 glass-subtle rounded-xl hover:shadow-modern transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Sebelumnya
                </button>

                <p className="text-gray-600">Halaman {currentPage}</p>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={filteredDeliveries.length < 10}
                  className="flex items-center gap-2 px-4 py-2 glass-subtle rounded-xl hover:shadow-modern transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
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
