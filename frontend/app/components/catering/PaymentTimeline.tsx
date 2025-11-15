'use client';

import React from 'react';
import { Lock, Clock, CheckCircle, ExternalLink, DollarSign } from 'lucide-react';

interface Payment {
  id: number;
  school: string;
  amount: string;
  status: 'locked' | 'pending' | 'released';
  lockedAt?: string;
  releasedAt?: string;
  txHash?: string;
}

interface PaymentTimelineProps {
  payments: Payment[];
}

const PaymentTimeline: React.FC<PaymentTimelineProps> = ({ payments }) => {
  const getStatusConfig = (status: Payment['status']) => {
    switch (status) {
      case 'locked':
        return {
          icon: Lock,
          color: 'blue',
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          border: 'border-blue-300',
          label: 'Dana Terkunci',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'yellow',
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          border: 'border-yellow-300',
          label: 'Menunggu Verifikasi',
        };
      case 'released':
        return {
          icon: CheckCircle,
          color: 'green',
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-300',
          label: 'Dana Cair',
        };
    }
  };

  return (
    <div className="space-y-4">
      {payments.map((payment, index) => {
        const config = getStatusConfig(payment.status);
        const StatusIcon = config.icon;

        return (
          <div
            key={payment.id}
            className="glass rounded-2xl p-6 hover:shadow-glow transition-smooth relative"
          >
            {/* Timeline connector */}
            {index !== payments.length - 1 && (
              <div className="absolute left-[52px] top-[80px] w-0.5 h-[calc(100%+16px)] bg-gradient-to-b from-blue-300 to-transparent" />
            )}

            <div className="flex gap-4">
              {/* Status icon */}
              <div className={`w-12 h-12 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-modern`}>
                <StatusIcon className={`w-6 h-6 ${config.text}`} />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                      {payment.school}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {payment.status === 'locked' && payment.lockedAt && `Dikunci: ${payment.lockedAt}`}
                      {payment.status === 'pending' && 'Menunggu konfirmasi sekolah'}
                      {payment.status === 'released' && payment.releasedAt && `Dicairkan: ${payment.releasedAt}`}
                    </p>
                  </div>
                  <div className={`px-3 py-1 ${config.bg} ${config.border} border rounded-full`}>
                    <span className={`text-xs font-semibold ${config.text}`}>
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {payment.amount}
                  </span>
                </div>

                {/* TX Hash */}
                {payment.txHash && (
                  <div className="flex items-center gap-2 p-3 glass-subtle rounded-xl">
                    <code className="text-xs text-gray-700 font-mono flex-1">
                      TX: {payment.txHash}
                    </code>
                    <button className="p-1 hover:bg-white/50 rounded transition-smooth">
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                )}

                {/* Progress bar for pending */}
                {payment.status === 'pending' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>75%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-bg-3 rounded-full animate-pulse" style={{ width: '75%' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PaymentTimeline;
