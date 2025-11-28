'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/app/context/AuthContext';
import ModernSidebar from '@/app/components/layout/ModernSidebar';
import { useSchoolLogo } from '@/app/hooks/useSchoolLogo';
import {
  LayoutDashboard,
  CheckCircle,
  AlertTriangle,
  History,
  QrCode,
  AlertCircle,
  Loader2,
  Camera,
  Upload,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import axios from 'axios';

interface QRScanLog {
  id: number;
  delivery_id: number | null;
  scan_method: 'camera' | 'upload';
  scan_result: 'success' | 'invalid' | 'error';
  error_message: string | null;
  blockchain_verified: boolean;
  blockchain_tx_hash: string | null;
  created_at: string;
  delivery_date?: string;
  delivery_portions?: number;
  catering_name?: string;
  school_name?: string;
}

interface ScanStats {
  total_scans: number;
  successful_scans: number;
  failed_scans: number;
  blockchain_verified_scans: number;
  camera_scans: number;
  upload_scans: number;
  success_rate: number;
  today_scans: number;
  week_scans: number;
  month_scans: number;
}

export default function QRHistoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { logoUrl } = useSchoolLogo();

  const [scanLogs, setScanLogs] = useState<QRScanLog[]>([]);
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [filterResult, setFilterResult] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;

  const navItems = [
    { label: 'Dashboard', path: '/school', icon: LayoutDashboard },
    { label: 'Verifikasi Pengiriman', path: '/school/verify', icon: CheckCircle },
    { label: 'Verifikasi QR', path: '/school/verify-qr', icon: QrCode },
    { label: 'Riwayat QR Scan', path: '/school/qr-history', icon: History },
    { label: 'Riwayat Verifikasi', path: '/school/history', icon: History },
    { label: 'Masalah', path: '/school/issues', icon: AlertTriangle },
    { label: 'Laporan Masalah Baru', path: '/school/issues/new', icon: AlertCircle },
  ];

  const handleLogout = () => {
    router.push('/login');
  };

  const schoolInfo = {
    name: user?.school_name || 'Sekolah',
  };

  // Fetch scan logs
  const fetchScanLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (filterResult) params.append('scan_result', filterResult);
      if (filterStartDate) params.append('start_date', filterStartDate);
      if (filterEndDate) params.append('end_date', filterEndDate);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/qr-scans?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setScanLogs(response.data.scan_logs);
        setTotalPages(response.data.pagination.total_pages);
        setTotalRecords(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching scan logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/qr-scans/stats/summary`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    if (!authLoading && user) {
      fetchScanLogs();
      fetchStats();
    }
  }, [authLoading, user, currentPage, filterResult, filterStartDate, filterEndDate]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filterResult, filterStartDate, filterEndDate]);

  // Filter logs by search query
  const filteredLogs = scanLogs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.delivery_id?.toString().includes(query) ||
      log.catering_name?.toLowerCase().includes(query) ||
      log.scan_result.toLowerCase().includes(query)
    );
  });

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'success':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Sukses</span>;
      case 'invalid':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">Invalid</span>;
      case 'error':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">Error</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">{result}</span>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 smooth-scroll">
      {/* Sidebar */}
      <ModernSidebar
        navItems={navItems}
        userRole="School"
        userName={user?.name || 'Kepala Sekolah'}
        userEmail={user?.email || 'sekolah@mbg.id'}
        schoolName={schoolInfo.name}
        schoolLogoUrl={logoUrl}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="ml-72 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-8 gpu-accelerate">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Riwayat Scan QR Code
            </h1>
            <p className="text-gray-600 text-lg">
              Lihat riwayat dan statistik semua scan QR code verifikasi pengiriman
            </p>
          </motion.div>

          {/* Statistics Cards */}
          {!statsLoading && stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Scan</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_scans}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Scan Sukses</p>
                    <p className="text-2xl font-bold text-green-600">{stats.successful_scans}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Blockchain</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.blockchain_verified_scans}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.success_rate}%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
            className="bg-white rounded-xl p-6 mb-6 border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">Filter & Pencarian</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari delivery ID, catering..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Result filter */}
              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Semua Status</option>
                <option value="success">Sukses</option>
                <option value="invalid">Invalid</option>
                <option value="error">Error</option>
              </select>

              {/* Date range */}
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Dari tanggal"
              />

              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Sampai tanggal"
              />
            </div>

            {/* Reset filters */}
            {(filterResult || filterStartDate || filterEndDate || searchQuery) && (
              <button
                onClick={() => {
                  setFilterResult('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setSearchQuery('');
                }}
                className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-semibold"
              >
                Reset Filter
              </button>
            )}
          </motion.div>

          {/* Scan logs table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Riwayat Scan</h3>
                  <p className="text-sm text-gray-600">{totalRecords} total scan</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada riwayat scan QR code</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Delivery ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Catering
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Metode
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Blockchain
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Waktu
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredLogs.map((log, index) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {log.delivery_id ? `#${log.delivery_id}` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {log.catering_name || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {log.scan_method === 'camera' ? (
                                <>
                                  <Camera className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm text-gray-700">Kamera</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 text-purple-600" />
                                  <span className="text-sm text-gray-700">Upload</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getResultBadge(log.scan_result)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log.blockchain_verified ? (
                              <span className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                Verified
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {new Date(log.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Halaman {currentPage} dari {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth flex items-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Sebelumnya
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth flex items-center gap-2"
                      >
                        Selanjutnya
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-12 text-center"
          >
            <p className="text-gray-500 text-sm">
              &copy; 2025 MBG School Portal. All Rights Reserved.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
