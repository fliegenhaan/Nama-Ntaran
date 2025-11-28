'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';
import { AlertCircle, CheckCircle, ChevronRight, Clock, ExternalLink, Loader2, Lock, MoreHorizontal, Search, Shield } from 'lucide-react';

interface ChartDataItem {
  month: string;
  alokasi: number;
  distribusi: number;
}

interface PrioritySchool {
  nama: string;
  kota: string;
  anggaran: string;
  status: string;
  statusColor: string;
}

interface Escrow {
  id: number;
  school: string;
  catering: string;
  amount: number;
  status: string;
  lockedAt: string;
  releaseDate: string;
  releasedAt?: string;
  txHash: string;
}

interface Stats {
  totalTerkunci: number;
  totalTercair: number;
  pendingRelease: number;
}

export default function Home() {
  const heroRef = useRef(null);
  const whatsPokeRef = useRef(null);
  const chartRef = useRef(null);
  const contentRef = useRef(null);
  const tableRef = useRef(null);

  // State untuk data dari backend
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [prioritySchools, setPrioritySchools] = useState<PrioritySchool[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);

  // menggunakan useInView untuk trigger animasi saat scroll
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const whatsPokeInView = useInView(whatsPokeRef, { once: true, amount: 0.3 });
  const chartInView = useInView(chartRef, { once: true, amount: 0.2 });
  const contentInView = useInView(contentRef, { once: true, amount: 0.3 });
  const tableInView = useInView(tableRef, { once: true, amount: 0.2 });

  // scroll parallax untuk hero image
  const { scrollY } = useScroll();
  const heroImageY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroImageOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [allEscrows, setAllEscrows] = useState<Escrow[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTerkunci: 0,
    totalTercair: 0,
    pendingRelease: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isReleasing, setIsReleasing] = useState<number | null>(null);
  const itemsPerPage = 6;
  const shouldReduceMotion = useReducedMotion();

  // Fetch data dari backend saat component mount
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/public/allocation-chart`);
        const data = await response.json();
        setChartData(data.chartData || []);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoadingChart(false);
      }
    };

    const fetchPrioritySchools = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/public/priority-schools?limit=6`);
        const data = await response.json();
        setPrioritySchools(data.prioritySchools || []);
      } catch (error) {
        console.error('Error fetching priority schools:', error);
      } finally {
        setIsLoadingSchools(false);
      }
    };

    const fetchEscrowData = async () => {
      setIsLoading(true);
      try {
        const [escrowsResponse, statsResponse] = await Promise.all([
          api.get('/api/escrow'),
          api.get('/api/escrow/stats'),
        ]);
        setStats(statsResponse.stats || {
        totalTerkunci: 0,
        totalTercair: 0,
        pendingRelease: 0,
      });
        setAllEscrows(escrowsResponse.escrows || []);
      } catch (error: any) {
        console.error('Error fetching escrow data:', error);
        alert(error.response?.data?.error || 'Gagal memuat data escrow');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEscrowData();
    fetchChartData();
    fetchPrioritySchools();
  }, []);

  // variasi animasi untuk stagger effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const filteredEscrows = allEscrows.filter((escrow) => {
    const matchesSearch =
      escrow.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      escrow.catering.toLowerCase().includes(searchQuery.toLowerCase()) ||
      escrow.txHash.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '' || escrow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEscrows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEscrows = filteredEscrows.slice(startIndex, endIndex);

  const containerEscrowVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.03,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemEscrowVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Terkunci':
        return 'bg-blue-100 text-blue-700';
      case 'Menunggu Rilis':
        return 'bg-yellow-100 text-yellow-700';
      case 'Tercairkan':
        return 'bg-green-100 text-green-700';
      case 'Tertunda':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat data escrow...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white">
      <Navbar role="public" />

      {/* hero section */}
      <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* text content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
              className="space-y-6"
            >
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                Transparansi Dan Program Distribusi Pangan
              </motion.h1>
              <motion.p
                className="text-lg text-gray-600 leading-relaxed text-justify"
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                MBG berkomitmen untuk memastikan bahwa setiap dana Program Makan
                Bergizi Gratis mencapai tujuan yang diinginkan, memberdayakan
                komunitas pendidikan dan memberikan nutrisi penting kepada para
                penerima manfaat yang paling membutuhkannya.
              </motion.p>
            </motion.div>

            {/* hero image dengan parallax */}
            <motion.div
              className="relative"
              style={{ y: heroImageY, opacity: heroImageOpacity }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/aesthetic view.jpg"
                  alt="Program Distribusi Pangan"
                  className="w-full h-[400px] md:h-[500px] object-cover transform hover:scale-105 transition-transform duration-700"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent" />
              </div>
              {/* floating decoration */}
              <motion.div
                className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full blur-3xl opacity-50"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* what's poke section */}
      <section ref={whatsPokeRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={whatsPokeInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Apa Itu MBG?
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed text-justify">
              Program Makan Bergizi Gratis merupakan program makan siang gratis Indonesia pada
              pemerintahan Prabowo Subianto yang berjalan secara bertahap sejak 6 Januari 2025.
              Program ini menargetkan para pelajar dan kelompok rentan termasuk ibu hamil dan menyusui.
              MBG (Makan Bergizi Ga Bocor) hadir sebagai platform transparansi berbasis blockchain
              yang memastikan setiap dana program tersalurkan tepat sasaran tanpa kebocoran. Melalui
              teknologi smart contract, kami menciptakan ekosistem distribusi yang akuntabel, di mana
              setiap transaksi tercatat secara permanen dan dapat diverifikasi oleh publik. Bersama MBG,
              wujudkan program bantuan pangan yang benar-benar sampai kepada yang membutuhkan.
            </p>
          </motion.div>
        </div>
      </section>

      {/* chart section - status alokasi */}
      <section ref={chartRef} className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={chartInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
              Status Alokasi Dan Distribusi Dana (Jutaan Rupiah)
            </h2>
            <p className="text-gray-600 text-center mb-12">
              Grafik hasil analisa menampilkan program
            </p>

            <motion.div
              className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={chartInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
              style={{ willChange: 'transform' }}
            >
              {isLoadingChart ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data chart...</p>
                  </div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-gray-600">Tidak ada data chart tersedia</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#6b7280', fontSize: 14 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 14 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="alokasi"
                      name="Alokasi"
                      fill="#8b5cf6"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1500}
                      animationBegin={0}
                    />
                    <Bar
                      dataKey="distribusi"
                      name="Distribusi"
                      fill="#ec4899"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1500}
                      animationBegin={200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* content section dengan image */}
      <section ref={contentRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* text content */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -30 }}
              animate={contentInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Teknologi Blockchain untuk Transparansi Maksimal
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed text-justify">
                Dengan memanfaatkan teknologi blockchain, setiap alokasi dan distribusi dana
                Program Makan Bergizi Gratis tercatat secara permanen dan tidak dapat dimanipulasi.
                Smart contract memastikan dana otomatis tersalur sesuai kriteria yang telah
                ditetapkan, menjamin bahwa bantuan pangan benar-benar sampai kepada seluruh
                penerima manfaat tanpa potongan atau kebocoran sedikitpun.
              </p>
              <h3 className="text-2xl font-bold text-gray-900 pt-6">
                Akuntabilitas dari Sumber hingga Penerima
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed text-justify">
                Sistem kami memberikan visibilitas penuh terhadap alur dana dari pemerintah, katering,
                hingga ke sekolah-sekolah penerima manfaat. Masyarakat dapat memantau secara real-time
                distribusi bantuan pangan Program Makan Bergizi Gratis, memastikan tidak ada kebocoran
                atau penyalahgunaan anggaran di setiap tahapan distribusi. Transparansi ini menjadi
                kunci keberhasilan program yang bertujuan memberikan nutrisi berkualitas bagi generasi
                masa depan Indonesia.
              </p>
            </motion.div>

            {/* image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={contentInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/aesthetic view 2.jpg"
                  alt="Program Pangan"
                  className="w-full h-[400px] md:h-[500px] object-cover transform hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* table section - sekolah prioritas */}
      <section ref={tableRef} className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={tableInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
              Sekolah Prioritas Teratas
            </h2>
            <p className="text-gray-600 text-center mb-12">
              Daftar sekolah penerima manfaat berdasarkan program
            </p>

            <motion.div
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={tableInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {isLoadingSchools ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data sekolah...</p>
                  </div>
                </div>
              ) : prioritySchools.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-gray-600">Tidak ada data sekolah tersedia</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                          Sekolah
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                          Kota
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                          Anggaran Dialokasikan
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <motion.tbody
                      variants={containerVariants}
                      initial="hidden"
                      animate={tableInView ? 'visible' : 'hidden'}
                      className="divide-y divide-gray-100"
                    >
                      {prioritySchools.map((school, index) => (
                        <motion.tr
                          key={index}
                          variants={itemVariants as any}
                          className="hover:bg-gray-50 transition-colors"
                          whileHover={{ scale: 1.01 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {school.nama}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {school.kota}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                            {school.anggaran}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${school.statusColor}`}
                            >
                              {school.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </table>
                </div>
              )}
            </motion.div>
            <motion.div variants={itemEscrowVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Terkunci */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 stat-card-hover card-optimized">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Terkunci</p>
                <p className="text-2xl font-bold text-gray-900 stat-number">
                  {formatCurrency(stats.totalTerkunci)}
                </p>
              </div>
            </div>
          </div>

          {/* Total Tercair */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 stat-card-hover card-optimized">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Tercair</p>
                <p className="text-2xl font-bold text-gray-900 stat-number">
                  {formatCurrency(stats.totalTercair)}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Release */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 stat-card-hover card-optimized">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Release</p>
                <p className="text-2xl font-bold text-gray-900 stat-number">
                  {formatCurrency(stats.pendingRelease)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemEscrowVariants} className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari Berdasarkan Sekolah, Katering, Atau TX Hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-smooth outline-none text-sm"
              />
            </div>

            {/* Filter Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-smooth appearance-none bg-white text-sm min-w-[180px]"
              >
                <option value="">Semua Status</option>
                <option value="Terkunci">Terkunci</option>
                <option value="Menunggu Rilis">Menunggu Rilis</option>
                <option value="Tercairkan">Tercairkan</option>
                <option value="Tertunda">Tertunda</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* Escrow Table */}
        <motion.div variants={itemEscrowVariants} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm">ID</th>
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm">Sekolah</th>
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm">Katering</th>
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm">Jumlah</th>
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm">Tanggal Terkunci</th>
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm">TX Hash</th>
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentEscrows.map((escrow, index) => (
                  <motion.tr
                    key={escrow.id}
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: shouldReduceMotion ? 0.01 : 0.2,
                      delay: shouldReduceMotion ? 0 : index * 0.03,
                      ease: [0.4, 0, 0.2, 1] as const,
                    }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-smooth"
                  >
                    <td className="p-4">
                      <span className="font-mono text-sm text-gray-600">#{escrow.id}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{escrow.school}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-600 text-sm">{escrow.catering}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-gray-900 text-sm stat-number">
                        {formatCurrency(escrow.amount)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                          escrow.status
                        )}`}
                      >
                        {escrow.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-600 text-sm">
                        {new Date(escrow.lockedAt).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td className="p-4">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${escrow.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 text-xs font-mono flex items-center gap-1 transition-smooth"
                      >
                        {escrow.txHash.substring(0, 10)}...
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Menampilkan {startIndex + 1} Dari {Math.min(endIndex, filteredEscrows.length)} Escrow
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </motion.div>
        <motion.div variants={itemEscrowVariants} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Informasi Smart Contract Escrow</h4>
              <p className="text-sm text-blue-700">
                Semua transaksi escrow dikelola melalui smart contract blockchain untuk transparansi dan keamanan maksimal.
                Dana akan otomatis tercairkan ketika semua kondisi terpenuhi atau dapat di-release secara manual oleh admin.
              </p>
            </div>
          </div>
        </motion.div>
          </motion.div>
        </div>
      </section>

      {/* footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* logo dan copyright */}
            <div className="col-span-1">
              <div className="mb-4">
                <Image
                  src="/MBG-removebg-preview.png"
                  alt="MBG Logo"
                  width={120}
                  height={40}
                  className="object-contain brightness-0 invert"
                  style={{ height: 'auto' }}
                />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                2025 MBG. Semua Hak Dilindungi Undang-Undang.
              </p>
            </div>

            {/* perusahaan */}
            <div>
              <h3 className="font-bold text-lg mb-4">Perusahaan</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Tentang Kami
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Karir
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Tim
                  </a>
                </li>
              </ul>
            </div>

            {/* sumber daya */}
            <div>
              <h3 className="font-bold text-lg mb-4">Sumber Daya</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            {/* hukum */}
            <div>
              <h3 className="font-bold text-lg mb-4">Hukum</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Kebijakan Privasi
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Syarat Layanan
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-gray-400 text-sm">
              Made with Love in Indonesia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
