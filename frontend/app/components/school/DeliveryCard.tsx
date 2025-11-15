'use client';

import React from 'react';
import { Calendar, Package, CheckCircle, AlertCircle, Clock, Truck } from 'lucide-react';

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
    <div className="glass rounded-2xl p-6 hover:shadow-glow transition-smooth">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white">{catering}</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {date}
            </span>
            <span className="font-semibold text-blue-400">{portions} Porsi</span>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full ${config.bg} flex items-center gap-2`}>
          <StatusIcon className={`w-4 h-4 ${config.text}`} />
          <span className={`text-xs font-semibold ${config.text}`}>
            {config.label}
          </span>
        </div>
      </div>

      {(status === 'pending' || status === 'scheduled' || status === 'delivered') && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={onVerify}
            className="flex-1 gradient-bg-4 text-white py-3 rounded-xl font-semibold hover:shadow-glow transition-smooth"
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Konfirmasi Diterima
          </button>
          <button
            onClick={onReportIssue}
            className="px-4 py-3 glass-subtle rounded-xl font-semibold text-white hover:shadow-modern transition-smooth"
          >
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Laporkan
          </button>
        </div>
      )}

      {status === 'verified' && (
        <div className="mt-4 p-3 bg-green-500/20 rounded-xl text-sm text-green-400">
          <CheckCircle className="w-4 h-4 inline mr-2" />
          Terverifikasi pada {date}
        </div>
      )}
    </div>
  );
};

export default DeliveryCard;
