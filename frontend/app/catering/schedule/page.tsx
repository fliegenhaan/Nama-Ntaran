'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import CateringSidebar from '../../components/catering/CateringSidebar';
import CateringFooter from '../../components/catering/CateringFooter';
import ScheduleCard from '../../components/catering/ScheduleCard';
import ScheduleFilterTabs, { FilterType } from '../../components/catering/ScheduleFilterTabs';
import ScheduleDetailModal from '../../components/catering/ScheduleDetailModal';
import { useScheduleData, ScheduleItem } from '../../hooks/useScheduleData';
import { Calendar, RefreshCw, AlertTriangle } from 'lucide-react';

export default function SchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ambil filter dari URL query params atau default ke 'today'
  const initialFilter = (searchParams.get('filter') as FilterType) || 'today';
  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter);

  // state untuk modal detail
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // hook untuk data schedule dengan filtering
  const { schedules, isLoading, error, refetch } = useScheduleData(activeFilter);

  // handler untuk perubahan filter dengan URL update
  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
    // update URL query params
    const params = new URLSearchParams(searchParams.toString());
    params.set('filter', filter);
    router.push(`/catering/schedule?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // handler untuk buka modal detail
  const handleCardClick = useCallback((schedule: ScheduleItem) => {
    setSelectedSchedule({
      ...schedule,
      contactName: 'Kepala Sekolah',
      contactPhone: '081234567890',
      contactEmail: 'sekolah@email.com',
      notes: 'Mohon pastikan makanan diantar tepat waktu.',
    });
    setIsModalOpen(true);
  }, []);

  // handler untuk update status pengiriman
  const handleUpdateStatus = useCallback(async (id: string, newStatus: 'in_progress' | 'scheduled' | 'delivered') => {
    console.log('\n🎯 [CATERING] UPDATE STATUS REQUEST');
    console.log('Schedule ID:', id);
    console.log('New UI Status:', newStatus);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      // Map UI status to database status
      // IMPORTANT: Catering can ONLY update status up to 'delivered'
      // School must verify to change status to 'verified'
      // UI: 'scheduled' -> 'in_progress' -> 'delivered' (STOPPED HERE)
      // DB: 'pending/scheduled' -> 'delivered' -> (wait for school verification)
      let dbStatus: string;
      if (newStatus === 'in_progress') {
        dbStatus = 'delivered'; // Mulai pengiriman = delivered di database
      } else if (newStatus === 'delivered') {
        // FIXED: Catering marks as delivered, NOT verified
        // School will verify later via verifications endpoint
        dbStatus = 'delivered'; // Already delivered, waiting for school verification
      } else {
        dbStatus = 'scheduled'; // Fallback
      }

      console.log('Mapped DB Status:', dbStatus);

      // Update status via API
      const response = await fetch(`${apiUrl}/api/deliveries/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: dbStatus }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to update status');
      }

      console.log('✅ Status updated successfully');

      // Clear cache untuk force fresh data
      localStorage.removeItem('schedule_data_cache');

      // Refetch data setelah berhasil update
      await refetch();

      // Update selectedSchedule jika modal masih terbuka
      if (selectedSchedule && selectedSchedule.id === id) {
        setSelectedSchedule(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('❌ Error updating delivery status:', error);
      throw error; // Re-throw untuk handling di modal
    }
  }, [refetch, selectedSchedule]);

  // animasi untuk list
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  // loading skeleton
  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-6">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="ml-8 h-32 bg-gray-200 rounded-xl" />
      ))}
    </div>
  );

  // error display
  const ErrorDisplay = () => (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-red-700 mb-2">Terjadi Kesalahan</h3>
      <p className="text-red-600 text-sm mb-4">{error}</p>
      <button
        onClick={refetch}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Coba Lagi</span>
      </button>
    </div>
  );

  // empty state
  const EmptyState = () => (
    <div className="text-center py-12">
      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Jadwal</h3>
      <p className="text-gray-500 text-sm">
        Tidak ada pengiriman yang dijadwalkan untuk periode ini
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* sidebar */}
      <CateringSidebar />

      {/* konten utama */}
      <main
        className="min-h-screen ml-72"
        style={{
          willChange: 'margin-left',
          transform: 'translateZ(0)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* header halaman */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Jadwal Pengiriman
            </h1>

            {/* filter tabs */}
            <ScheduleFilterTabs
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* konten jadwal */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingSkeleton />
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ErrorDisplay />
              </motion.div>
            ) : schedules.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6 pl-5"
              >
                {schedules.map((schedule, index) => (
                  <ScheduleCard
                    key={schedule.id}
                    id={schedule.id}
                    schoolName={schedule.schoolName}
                    address={schedule.address}
                    timeRange={schedule.timeRange}
                    portions={schedule.portions}
                    status={schedule.status}
                    iconVariant={schedule.iconVariant}
                    index={index}
                    onClick={() => handleCardClick(schedule)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* footer */}
          <CateringFooter />
        </div>
      </main>

      {/* modal detail */}
      <ScheduleDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schedule={selectedSchedule}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
