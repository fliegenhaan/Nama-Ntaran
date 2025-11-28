'use client';

import React, { useState } from 'react';
import { Lock, Unlock, DollarSign, AlertCircle, CheckCircle, ExternalLink, Shield } from 'lucide-react';

interface EscrowTransaction {
  id: number;
  school: string;
  catering: string;
  amount: string;
  status: 'locked' | 'pending_release' | 'released';
  lockedAt: string;
  releaseAt?: string;
  txHash: string;
  verificationStatus: 'verified' | 'pending' | 'issue';
}

interface EscrowControllerProps {
  onLock?: (id: number) => void;
  onRelease?: (id: number) => void;
}

const EscrowController: React.FC<EscrowControllerProps> = ({
  onLock,
  onRelease,
}) => {
  const [selectedTx, setSelectedTx] = useState<EscrowTransaction | null>(null);

  const transactions: EscrowTransaction[] = [
    {
      id: 1,
      school: 'SDN 01 Bandung',
      catering: 'Katering Sehat Mandiri',
      amount: 'Rp 15.000.000',
      status: 'pending_release',
      lockedAt: '10 Nov 2025',
      txHash: '0x7f9f...a3b2',
      verificationStatus: 'verified',
    },
    {
      id: 2,
      school: 'SDN 05 Jakarta',
      catering: 'Katering Prima',
      amount: 'Rp 12.500.000',
      status: 'locked',
      lockedAt: '12 Nov 2025',
      txHash: '0x8a3c...b5d1',
      verificationStatus: 'pending',
    },
    {
      id: 3,
      school: 'SMP 12 Surabaya',
      catering: 'Katering Bergizi',
      amount: 'Rp 18.000.000',
      status: 'released',
      lockedAt: '08 Nov 2025',
      releaseAt: '10 Nov 2025',
      txHash: '0x2c1e...9f4a',
      verificationStatus: 'verified',
    },
  ];

  const getStatusConfig = (status: EscrowTransaction['status']) => {
    switch (status) {
      case 'locked':
        return {
          icon: Lock,
          label: 'Dana Terkunci',
          color: 'blue',
          bgClass: 'bg-blue-100',
          textClass: 'text-blue-700',
        };
      case 'pending_release':
        return {
          icon: AlertCircle,
          label: 'Menunggu Pencairan',
          color: 'yellow',
          bgClass: 'bg-yellow-100',
          textClass: 'text-yellow-700',
        };
      case 'released':
        return {
          icon: CheckCircle,
          label: 'Dana Tercair',
          color: 'green',
          bgClass: 'bg-green-100',
          textClass: 'text-green-700',
        };
    }
  };

  const getVerificationConfig = (status: EscrowTransaction['verificationStatus']) => {
    switch (status) {
      case 'verified':
        return { icon: CheckCircle, label: 'Terverifikasi', color: 'green' };
      case 'pending':
        return { icon: AlertCircle, label: 'Menunggu', color: 'yellow' };
      case 'issue':
        return { icon: AlertCircle, label: 'Ada Masalah', color: 'red' };
    }
  };

  const stats = {
    totalLocked: 'Rp 125 M',
    pendingRelease: 'Rp 30 M',
    totalReleased: 'Rp 95 M',
    totalTransactions: transactions.length,
  };

  return (
    <div className="glass rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 gradient-bg-1 rounded-xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Kontrol Escrow</h3>
          <p className="text-gray-600">Kelola dana di smart contract</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-subtle rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-600">Total Terkunci</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalLocked}</p>
        </div>
        <div className="glass-subtle rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-gray-600">Menunggu Pencairan</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingRelease}</p>
        </div>
        <div className="glass-subtle rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-gray-600">Total Tercair</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalReleased}</p>
        </div>
        <div className="glass-subtle rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <p className="text-sm text-gray-600">Total Transaksi</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {transactions.map((tx) => {
          const statusConfig = getStatusConfig(tx.status);
          const verificationConfig = getVerificationConfig(tx.verificationStatus);
          const StatusIcon = statusConfig.icon;
          const VerificationIcon = verificationConfig.icon;

          return (
            <div
              key={tx.id}
              className="glass-subtle rounded-xl p-6 hover:shadow-modern transition-smooth"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-gray-900">TX #{tx.id}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bgClass} ${statusConfig.textClass} flex items-center gap-1`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <p className="text-gray-600">
                      Sekolah: <span className="font-semibold text-gray-900">{tx.school}</span>
                    </p>
                    <p className="text-gray-600">
                      Katering: <span className="font-semibold text-gray-900">{tx.catering}</span>
                    </p>
                    <p className="text-gray-600">
                      Jumlah: <span className="font-bold text-blue-600">{tx.amount}</span>
                    </p>
                    <p className="text-gray-600">
                      Terkunci: <span className="font-semibold text-gray-900">{tx.lockedAt}</span>
                    </p>
                  </div>
                </div>

                {/* Verification Badge */}
                <div className={`px-3 py-1 rounded-full bg-${verificationConfig.color}-100 flex items-center gap-1`}>
                  <VerificationIcon className={`w-3 h-3 text-${verificationConfig.color}-700`} />
                  <span className={`text-xs font-semibold text-${verificationConfig.color}-700`}>
                    {verificationConfig.label}
                  </span>
                </div>
              </div>

              {/* TX Hash */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-gray-700">{tx.txHash}</code>
                  </div>
                  <a
                    href={`hhttps://sepolia.etherscan.io/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View on Explorer
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Release Info */}
              {tx.releaseAt && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-700">
                    Dana tercairkan pada <span className="font-semibold">{tx.releaseAt}</span>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {tx.status === 'locked' && tx.verificationStatus === 'verified' && (
                  <button
                    onClick={() => onRelease?.(tx.id)}
                    className="flex-1 btn-modern gradient-bg-4 text-white py-3 rounded-xl font-semibold hover:shadow-glow transition-smooth flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    Cairkan Dana
                  </button>
                )}
                {tx.status === 'pending_release' && (
                  <button
                    onClick={() => onRelease?.(tx.id)}
                    className="flex-1 btn-modern gradient-bg-4 text-white py-3 rounded-xl font-semibold hover:shadow-glow transition-smooth flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    Proses Pencairan
                  </button>
                )}
                {tx.status === 'released' && (
                  <div className="flex-1 p-3 bg-green-50 rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">Dana Sudah Tercair</span>
                  </div>
                )}
                <button
                  onClick={() => setSelectedTx(tx)}
                  className="px-6 py-3 glass-subtle rounded-xl font-semibold text-gray-700 hover:shadow-modern transition-smooth"
                >
                  Detail
                </button>
              </div>

              {/* Warning for pending verification */}
              {tx.verificationStatus === 'pending' && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700">
                    Menunggu verifikasi dari sekolah sebelum pencairan dapat dilakukan
                  </p>
                </div>
              )}

              {/* Warning for issues */}
              {tx.verificationStatus === 'issue' && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-700">
                    Ada masalah yang dilaporkan. Selesaikan masalah terlebih dahulu.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Tidak ada transaksi escrow</p>
        </div>
      )}
    </div>
  );
};

export default EscrowController;
