'use client';

import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Building2, UtensilsCrossed, Filter, CheckCircle, XCircle } from 'lucide-react';

interface Account {
  id: number;
  name: string;
  type: 'school' | 'catering';
  location: string;
  status: 'active' | 'inactive';
  registered: string;
  contact: string;
  walletAddress: string;
}

interface AccountManagementTableProps {
  onAdd?: () => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const AccountManagementTable: React.FC<AccountManagementTableProps> = ({
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'school' | 'catering'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const accounts: Account[] = [
    {
      id: 1,
      name: 'SDN 01 Bandung',
      type: 'school',
      location: 'Bandung, Jawa Barat',
      status: 'active',
      registered: '15 Jan 2025',
      contact: 'kepala@sdn01bdg.sch.id',
      walletAddress: '0x742d...9c4e',
    },
    {
      id: 2,
      name: 'Katering Sehat Mandiri',
      type: 'catering',
      location: 'Jakarta Pusat',
      status: 'active',
      registered: '20 Jan 2025',
      contact: 'admin@kateringsehat.com',
      walletAddress: '0x8a3f...2b1d',
    },
    {
      id: 3,
      name: 'SDN 05 Jakarta',
      type: 'school',
      location: 'Jakarta Selatan',
      status: 'active',
      registered: '22 Jan 2025',
      contact: 'info@sdn05jkt.sch.id',
      walletAddress: '0x1c9e...7f3a',
    },
    {
      id: 4,
      name: 'SMP 12 Surabaya',
      type: 'school',
      location: 'Surabaya, Jawa Timur',
      status: 'inactive',
      registered: '10 Feb 2025',
      contact: 'admin@smp12sby.sch.id',
      walletAddress: '0x5d2a...4e8b',
    },
  ];

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         acc.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || acc.type === filterType;
    const matchesStatus = filterStatus === 'all' || acc.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="glass rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">Manajemen Akun</h3>
          <p className="text-gray-600">Kelola akun sekolah dan katering</p>
        </div>
        <button
          onClick={onAdd}
          className="btn-modern gradient-bg-1 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-glow transition-smooth flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Tambah Akun
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 glass-subtle rounded-xl focus:ring-2 focus:ring-blue-500 transition-smooth"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full pl-12 pr-4 py-3 glass-subtle rounded-xl focus:ring-2 focus:ring-blue-500 transition-smooth appearance-none"
          >
            <option value="all">Semua Tipe</option>
            <option value="school">Sekolah</option>
            <option value="catering">Katering</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full pl-12 pr-4 py-3 glass-subtle rounded-xl focus:ring-2 focus:ring-blue-500 transition-smooth appearance-none"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Nama</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Tipe</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Lokasi</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Terdaftar</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Wallet</th>
              <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((account) => (
              <tr
                key={account.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-smooth"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      account.type === 'school' ? 'gradient-bg-3' : 'gradient-bg-5'
                    }`}>
                      {account.type === 'school' ? (
                        <Building2 className="w-5 h-5 text-white" />
                      ) : (
                        <UtensilsCrossed className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{account.name}</p>
                      <p className="text-xs text-gray-500">{account.contact}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    account.type === 'school'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {account.type === 'school' ? 'Sekolah' : 'Katering'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <p className="text-sm text-gray-700">{account.location}</p>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {account.status === 'active' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      account.status === 'active' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {account.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <p className="text-sm text-gray-600">{account.registered}</p>
                </td>
                <td className="py-4 px-4">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                    {account.walletAddress}
                  </code>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit?.(account.id)}
                      className="p-2 glass-subtle rounded-lg hover:shadow-modern transition-smooth"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onDelete?.(account.id)}
                      className="p-2 glass-subtle rounded-lg hover:shadow-modern transition-smooth"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAccounts.length === 0 && (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Tidak ada akun ditemukan</p>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
          <p className="text-sm text-gray-600">Total Akun</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {accounts.filter(a => a.type === 'school').length}
          </p>
          <p className="text-sm text-gray-600">Sekolah</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">
            {accounts.filter(a => a.type === 'catering').length}
          </p>
          <p className="text-sm text-gray-600">Katering</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {accounts.filter(a => a.status === 'active').length}
          </p>
          <p className="text-sm text-gray-600">Aktif</p>
        </div>
      </div>
    </div>
  );
};

export default AccountManagementTable;
