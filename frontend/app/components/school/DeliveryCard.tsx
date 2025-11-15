'use client';

import React from 'react';
import { Calendar, Package, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface DeliveryCardProps {
  id: number;
  catering: string;
  portions: number;
  date: string;
  status: 'pending' | 'verified' | 'issue';
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
  const statusConfig = {
    pending: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: Clock,
      label: 'Menunggu Verifikasi',
    },
    verified: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: CheckCircle,
      label: 'Terverifikasi',
    },
    issue: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: AlertCircle,
      label: 'Ada Masalah',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="glass rounded-2xl p-6 hover:shadow-glow transition-smooth">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">{catering}</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {date}
            </span>
            <span className="font-semibold text-blue-600">{portions} Porsi</span>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full ${config.bg} ${config.border} border flex items-center gap-2`}>
          <StatusIcon className={`w-4 h-4 ${config.text}`} />
          <span className={`text-xs font-semibold ${config.text}`}>
            {config.label}
          </span>
        </div>
      </div>

      {status === 'pending' && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={onVerify}
            className="flex-1 btn-modern gradient-bg-4 text-white py-3 rounded-xl font-semibold hover:shadow-glow transition-smooth"
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Konfirmasi Diterima
          </button>
          <button
            onClick={onReportIssue}
            className="px-4 py-3 glass-subtle rounded-xl font-semibold text-gray-700 hover:shadow-modern transition-smooth"
          >
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Laporkan
          </button>
        </div>
      )}

      {status === 'verified' && (
        <div className="mt-4 p-3 bg-green-50 rounded-xl text-sm text-green-700">
          <CheckCircle className="w-4 h-4 inline mr-2" />
          Terverifikasi pada {date}
        </div>
      )}
    </div>
  );
};

export default DeliveryCard;
