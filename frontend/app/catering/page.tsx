'use client';

import { useState } from 'react';
import ModernSidebar from '../components/layout/ModernSidebar';
import PageHeader from '../components/layout/PageHeader';
import GlassPanel from '../components/ui/GlassPanel';
import ModernStatCard from '../components/ui/ModernStatCard';
import DeliveryCalendar from '../components/catering/DeliveryCalendar';
import PaymentTimeline from '../components/catering/PaymentTimeline';
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  Calendar,
  Package,
  UtensilsCrossed,
  Receipt,
} from 'lucide-react';

export default function CateringDashboard() {
  const cateringInfo = {
    name: 'Katering Sehat Mandiri',
    license: 'SIUP-123456789',
  };

  const stats = {
    lockedFunds: 'Rp 125 M',
    disbursed: 'Rp 95 M',
    pendingPayments: 'Rp 30 M',
    totalRevenue: 'Rp 280 M',
    schoolsServed: 15,
    todayDeliveries: 8,
  };

  const calendarEvents = [
    {
      id: 1,
      date: '2025-11-15',
      school: 'SDN 01 Bandung',
      portions: 250,
      time: '10:30',
      status: 'scheduled' as const,
    },
    {
      id: 2,
      date: '2025-11-15',
      school: 'SDN 05 Jakarta',
      portions: 180,
      time: '11:00',
      status: 'scheduled' as const,
    },
    {
      id: 3,
      date: '2025-11-16',
      school: 'SMP 12 Surabaya',
      portions: 200,
      time: '09:30',
      status: 'scheduled' as const,
    },
    {
      id: 4,
      date: '2025-11-14',
      school: 'SDN 02 Bandung',
      portions: 220,
      time: '10:00',
      status: 'completed' as const,
    },
  ];

  const payments = [
    {
      id: 1,
      school: 'SDN 01 Bandung',
      amount: 'Rp 15.000.000',
      status: 'released' as const,
      lockedAt: '10 Nov 2025',
      releasedAt: '12 Nov 2025',
      txHash: '0x7f9f...a3b2',
    },
    {
      id: 2,
      school: 'SDN 05 Jakarta',
      amount: 'Rp 12.500.000',
      status: 'pending' as const,
      lockedAt: '12 Nov 2025',
    },
    {
      id: 3,
      school: 'SMP 12 Surabaya',
      amount: 'Rp 18.000.000',
      status: 'locked' as const,
      lockedAt: '14 Nov 2025',
    },
  ];

  const navItems = [
    { label: 'Dashboard', path: '/catering', icon: LayoutDashboard },
    { label: 'Jadwal', path: '/catering/schedule', icon: Calendar },
    { label: 'Pembayaran', path: '/catering/payments', icon: DollarSign, badge: 2 },
    { label: 'Riwayat', path: '/catering/history', icon: Receipt },
  ];

  return (
    <div className="flex min-h-screen bg-gray-950 blockchain-mesh">
      <ModernSidebar
        navItems={navItems}
        userRole="Catering"
        userName="Katering Manager"
        userEmail={cateringInfo.name}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <PageHeader
            title="Dashboard Katering"
            subtitle="Kelola jadwal pengiriman dan status pembayaran"
            icon={UtensilsCrossed}
            breadcrumbs={[{ label: 'Dashboard' }]}
          />

          {/* Catering Info */}
          <GlassPanel className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {cateringInfo.name}
                </h2>
                <p className="text-gray-300">SIUP: {cateringInfo.license}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Melayani {stats.schoolsServed} sekolah
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 gradient-bg-4 text-white rounded-xl shadow-modern transition-smooth">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  <span className="text-sm font-semibold">Status: Aktif</span>
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <ModernStatCard
              title="Dana Terkunci"
              value={stats.lockedFunds}
              icon={DollarSign}
              gradient="gradient-bg-2"
              subtitle="Di escrow smart contract"
            />
            <ModernStatCard
              title="Dana Dicairkan"
              value={stats.disbursed}
              icon={CheckCircle}
              gradient="gradient-bg-4"
              trend={{ value: 12, isPositive: true }}
              subtitle="Bulan ini"
            />
            <ModernStatCard
              title="Menunggu Verifikasi"
              value={stats.pendingPayments}
              icon={Clock}
              gradient="gradient-bg-5"
              subtitle="Akan cair segera"
            />
            <ModernStatCard
              title="Total Revenue"
              value={stats.totalRevenue}
              icon={TrendingUp}
              gradient="gradient-bg-1"
              trend={{ value: 15, isPositive: true }}
              subtitle="Tahun ini"
            />
            <ModernStatCard
              title="Sekolah Dilayani"
              value={stats.schoolsServed}
              icon={Package}
              gradient="gradient-bg-3"
              subtitle="Partner aktif"
            />
            <ModernStatCard
              title="Pengiriman Hari Ini"
              value={stats.todayDeliveries}
              icon={Calendar}
              gradient="gradient-bg-2"
              subtitle="Sudah dijadwalkan"
            />
          </div>

          {/* Calendar Section */}
          <section className="mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">
                Jadwal Pengiriman
              </h2>
              <p className="text-gray-300">
                Kalender lengkap pengiriman makanan ke sekolah
              </p>
            </div>
            <DeliveryCalendar events={calendarEvents} />
          </section>

          {/* Payment Timeline */}
          <section className="mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">
                Status Pembayaran
              </h2>
              <p className="text-gray-300">
                Timeline pencairan dana dari blockchain escrow
              </p>
            </div>
            <PaymentTimeline payments={payments} />
          </section>

          {/* Performance Metrics */}
          <section>
            <GlassPanel>
              <h3 className="text-xl font-bold text-white mb-6">
                Performance Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-6">
                  <div className="w-16 h-16 gradient-bg-1 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-modern">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">98.5%</p>
                  <p className="text-sm text-gray-300">On-Time Delivery</p>
                </div>
                <div className="text-center p-6">
                  <div className="w-16 h-16 gradient-bg-4 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-modern">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">4.8/5</p>
                  <p className="text-sm text-gray-300">Rating Kualitas</p>
                </div>
                <div className="text-center p-6">
                  <div className="w-16 h-16 gradient-bg-2 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-modern">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">2.3 jam</p>
                  <p className="text-sm text-gray-300">Avg. Payment Time</p>
                </div>
                <div className="text-center p-6">
                  <div className="w-16 h-16 gradient-bg-5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-modern">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">15,420</p>
                  <p className="text-sm text-gray-300">Total Porsi Bulan Ini</p>
                </div>
              </div>
            </GlassPanel>
          </section>
        </div>
      </main>
    </div>
  );
}
