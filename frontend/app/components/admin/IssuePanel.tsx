'use client';

import React, { useState } from 'react';
import { AlertTriangle, Eye, CheckCircle, XCircle, Clock, MessageSquare, Image as ImageIcon } from 'lucide-react';

interface Issue {
  id: number;
  school: string;
  catering: string;
  date: string;
  reportedAt: string;
  type: 'quality' | 'quantity' | 'late' | 'other';
  status: 'pending' | 'investigating' | 'resolved' | 'rejected';
  priority: 'high' | 'medium' | 'low';
  description: string;
  photos?: string[];
  evidence?: string;
}

interface IssuePanelProps {
  onInvestigate?: (id: number) => void;
  onResolve?: (id: number) => void;
  onReject?: (id: number) => void;
}

const IssuePanel: React.FC<IssuePanelProps> = ({
  onInvestigate,
  onResolve,
  onReject,
}) => {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const issues: Issue[] = [
    {
      id: 1,
      school: 'SDN 01 Bandung',
      catering: 'Katering Sehat Mandiri',
      date: '15 Nov 2025',
      reportedAt: '15 Nov 2025, 11:30',
      type: 'quantity',
      status: 'pending',
      priority: 'high',
      description: 'Jumlah porsi kurang 20 dari yang seharusnya (250 porsi)',
      photos: ['photo1.jpg', 'photo2.jpg'],
      evidence: 'Bukti foto terlampir menunjukkan hanya 230 porsi yang diterima',
    },
    {
      id: 2,
      school: 'SMP 12 Surabaya',
      catering: 'Katering Bergizi',
      date: '14 Nov 2025',
      reportedAt: '14 Nov 2025, 12:15',
      type: 'quality',
      status: 'investigating',
      priority: 'medium',
      description: 'Kualitas makanan tidak sesuai standar (sayur kurang segar)',
      photos: ['photo3.jpg'],
    },
    {
      id: 3,
      school: 'SDN 05 Jakarta',
      catering: 'Katering Prima',
      date: '13 Nov 2025',
      reportedAt: '13 Nov 2025, 10:45',
      type: 'late',
      status: 'resolved',
      priority: 'low',
      description: 'Pengiriman terlambat 45 menit dari jadwal',
    },
  ];

  const getTypeConfig = (type: Issue['type']) => {
    switch (type) {
      case 'quality':
        return { label: 'Kualitas', color: 'orange' };
      case 'quantity':
        return { label: 'Kuantitas', color: 'red' };
      case 'late':
        return { label: 'Terlambat', color: 'yellow' };
      default:
        return { label: 'Lainnya', color: 'gray' };
    }
  };

  const getStatusConfig = (status: Issue['status']) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Menunggu', color: 'yellow' };
      case 'investigating':
        return { icon: Eye, label: 'Investigasi', color: 'blue' };
      case 'resolved':
        return { icon: CheckCircle, label: 'Selesai', color: 'green' };
      case 'rejected':
        return { icon: XCircle, label: 'Ditolak', color: 'red' };
    }
  };

  const getPriorityConfig = (priority: Issue['priority']) => {
    switch (priority) {
      case 'high':
        return { label: 'Tinggi', color: 'red' };
      case 'medium':
        return { label: 'Sedang', color: 'yellow' };
      case 'low':
        return { label: 'Rendah', color: 'green' };
    }
  };

  return (
    <div className="glass rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 gradient-bg-5 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Investigasi Masalah</h3>
          <p className="text-gray-600">Tangani laporan dari sekolah</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-subtle rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {issues.filter(i => i.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-600">Menunggu</p>
        </div>
        <div className="glass-subtle rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {issues.filter(i => i.status === 'investigating').length}
          </p>
          <p className="text-sm text-gray-600">Investigasi</p>
        </div>
        <div className="glass-subtle rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {issues.filter(i => i.status === 'resolved').length}
          </p>
          <p className="text-sm text-gray-600">Selesai</p>
        </div>
        <div className="glass-subtle rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {issues.filter(i => i.priority === 'high').length}
          </p>
          <p className="text-sm text-gray-600">Prioritas Tinggi</p>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {issues.map((issue) => {
          const typeConfig = getTypeConfig(issue.type);
          const statusConfig = getStatusConfig(issue.status);
          const priorityConfig = getPriorityConfig(issue.priority);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={issue.id}
              className="glass-subtle rounded-xl p-6 hover:shadow-modern transition-smooth"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-gray-900">
                      Issue #{issue.id} - {issue.school}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-${priorityConfig.color}-100 text-${priorityConfig.color}-700`}>
                      {priorityConfig.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Katering: <span className="font-semibold">{issue.catering}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Dilaporkan: {issue.reportedAt} • Tanggal Pengiriman: {issue.date}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${typeConfig.color}-100 text-${typeConfig.color}-700`}>
                    {typeConfig.label}
                  </span>
                  <div className={`px-3 py-1 rounded-full bg-${statusConfig.color}-100 flex items-center gap-1`}>
                    <StatusIcon className={`w-3 h-3 text-${statusConfig.color}-700`} />
                    <span className={`text-xs font-semibold text-${statusConfig.color}-700`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-sm text-gray-700 flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  {issue.description}
                </p>
                {issue.evidence && (
                  <p className="text-xs text-gray-600 mt-2 ml-6">{issue.evidence}</p>
                )}
              </div>

              {/* Photos */}
              {issue.photos && issue.photos.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">
                      Bukti Foto ({issue.photos.length})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {issue.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="w-20 h-20 glass-subtle rounded-lg flex items-center justify-center"
                      >
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {issue.status === 'pending' && (
                  <>
                    <button
                      onClick={() => onInvestigate?.(issue.id)}
                      className="flex-1 btn-modern gradient-bg-2 text-white py-2 rounded-xl font-semibold hover:shadow-glow transition-smooth flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Mulai Investigasi
                    </button>
                    <button
                      onClick={() => onReject?.(issue.id)}
                      className="px-6 py-2 glass-subtle rounded-xl font-semibold text-gray-700 hover:shadow-modern transition-smooth"
                    >
                      Tolak
                    </button>
                  </>
                )}
                {issue.status === 'investigating' && (
                  <>
                    <button
                      onClick={() => onResolve?.(issue.id)}
                      className="flex-1 btn-modern gradient-bg-4 text-white py-2 rounded-xl font-semibold hover:shadow-glow transition-smooth flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Tandai Selesai
                    </button>
                    <button
                      onClick={() => onReject?.(issue.id)}
                      className="px-6 py-2 glass-subtle rounded-xl font-semibold text-red-600 hover:shadow-modern transition-smooth"
                    >
                      Tolak
                    </button>
                  </>
                )}
                {(issue.status === 'resolved' || issue.status === 'rejected') && (
                  <button
                    onClick={() => setSelectedIssue(issue)}
                    className="flex-1 btn-modern glass-subtle text-gray-700 py-2 rounded-xl font-semibold hover:shadow-modern transition-smooth flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat Detail
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {issues.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Tidak ada masalah yang dilaporkan</p>
        </div>
      )}
    </div>
  );
};

export default IssuePanel;
