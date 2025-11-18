'use client';

import React from 'react';
import { Calendar, Package, CheckCircle, AlertCircle, Clock, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeliveryCardProps {
  id: number;
  catering: string;
  portions: number;
  date: string;
  status: string;
  onVerify?: () => void;
  onReportIssue?: () => void;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({
  id,
  catering,
  portions,
  date,
  status,
  onVerify,
  onReportIssue,
}) => {
  const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
    pending: {
      bg: 'bg-gray-500/20',
      text: 'text-gray-300',
      icon: Clock,
      label: 'Menunggu',
    },
    scheduled: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      icon: Calendar,
      label: 'Terjadwal',
    },
    delivered: {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-400',
      icon: Truck,
      label: 'Terkirim',
    },
    verified: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      icon: CheckCircle,
      label: 'Terverifikasi',
    },
    issue: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      icon: AlertCircle,
      label: 'Ada Masalah',
    },
    cancelled: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      icon: AlertCircle,
      label: 'Dibatalkan',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-smooth gpu-accelerate"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* header dengan icon package */}
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900">{catering}</h3>
          </div>
          {/* informasi tanggal dan porsi */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {date}
            </span>
            <span className="font-semibold text-purple-600">{portions} Porsi</span>
          </div>
        </div>

        {/* status badge */}
        <div className={`px-3 py-1 rounded-full ${config.bg} flex items-center gap-2`}>
          <StatusIcon className={`w-4 h-4 ${config.text}`} />
          <span className={`text-xs font-semibold ${config.text}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* tombol aksi untuk pengiriman yang belum terverifikasi */}
      {(status === 'pending' || status === 'scheduled' || status === 'delivered') && (
        <div className="flex gap-3 mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onVerify}
            className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 hover:shadow-lg transition-smooth"
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Konfirmasi Diterima
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReportIssue}
            className="px-4 py-3 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 hover:shadow-md transition-smooth gpu-accelerate"
          >
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Laporkan
          </motion.button>
        </div>
      )}

      {/* status terverifikasi */}
      {status === 'verified' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-green-500/20 rounded-xl text-sm text-green-400"
        >
          <CheckCircle className="w-4 h-4 inline mr-2" />
          Terverifikasi Pada {date}
        </motion.div>
      )}
    </motion.div>
  );
};

export default DeliveryCard;
