'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import ModernSidebar from '../../components/layout/ModernSidebar';
import PageHeader from '../../components/layout/PageHeader';
import GlassPanel from '../../components/ui/GlassPanel';
import {
  LayoutDashboard,
  Users,
  Shield,
  AlertTriangle,
  Settings,
  BarChart3,
  Loader2,
  Search,
  Plus,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  School,
  UtensilsCrossed,
  UserCog,
} from 'lucide-react';

export default function AccountsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Akun', path: '/admin/accounts', icon: Users },
    { label: 'Escrow', path: '/admin/escrow', icon: Shield },
    { label: 'Issues', path: '/admin/issues', icon: AlertTriangle },
    { label: 'Laporan', path: '/admin/reports', icon: BarChart3 },
    { label: 'Pengaturan', path: '/admin/settings', icon: Settings },
  ];

  // Mock data
  const accounts = [
    { id: 1, name: 'SDN 01 Bandung', email: 'sdn01@bandung.sch.id', role: 'school', status: 'active', created: '2024-01-15' },
    { id: 2, name: 'Katering Sehat Mandiri', email: 'katering@sehat.com', role: 'catering', status: 'active', created: '2024-02-10' },
    { id: 3, name: 'SMP 12 Surabaya', email: 'smp12@sby.sch.id', role: 'school', status: 'active', created: '2024-01-20' },
    { id: 4, name: 'Katering Nutrisi', email: 'nutrisi@catering.com', role: 'catering', status: 'suspended', created: '2024-03-05' },
  ];

  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      school: { label: 'Sekolah', color: 'bg-blue-500/20 text-blue-400', icon: School },
      catering: { label: 'Katering', color: 'bg-purple-500/20 text-purple-400', icon: UtensilsCrossed },
      admin: { label: 'Admin', color: 'bg-red-500/20 text-red-400', icon: Shield },
    };
    const c = config[role] || config.school;
    const Icon = c.icon;
    return (
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${c.color}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
        <CheckCircle className="w-3 h-3" />
        Aktif
      </div>
    ) : (
      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">
        <Ban className="w-3 h-3" />
        Suspended
      </div>
    );
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 blockchain-mesh">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950 blockchain-mesh">
      <ModernSidebar
        navItems={navItems}
        userRole="Administrator"
        userName={user.name || 'Admin MBG'}
        userEmail={user.email}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <PageHeader
            title="Manajemen Akun"
            subtitle="Kelola akun sekolah, katering, dan administrator"
            icon={Users}
            breadcrumbs={[
              { label: 'Dashboard', href: '/admin' },
              { label: 'Akun' },
            ]}
          />

          {/* Filters */}
          <GlassPanel className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth outline-none"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
              >
                <option value="">Semua Role</option>
                <option value="school">Sekolah</option>
                <option value="catering">Katering</option>
                <option value="admin">Admin</option>
              </select>
              <button className="px-6 py-3 gradient-bg-4 text-white rounded-xl font-semibold hover:shadow-glow transition-smooth flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Tambah Akun
              </button>
            </div>
          </GlassPanel>

          {/* Accounts Table */}
          <GlassPanel>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-4 font-semibold text-white">ID</th>
                    <th className="text-left p-4 font-semibold text-white">Nama</th>
                    <th className="text-left p-4 font-semibold text-white">Email</th>
                    <th className="text-left p-4 font-semibold text-white">Role</th>
                    <th className="text-left p-4 font-semibold text-white">Status</th>
                    <th className="text-left p-4 font-semibold text-white">Terdaftar</th>
                    <th className="text-left p-4 font-semibold text-white">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b border-white/10 hover:bg-white/5 transition-smooth">
                      <td className="p-4">
                        <span className="font-mono text-sm text-gray-300">#{account.id}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-white">{account.name}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-300">{account.email}</p>
                      </td>
                      <td className="p-4">{getRoleBadge(account.role)}</td>
                      <td className="p-4">{getStatusBadge(account.status)}</td>
                      <td className="p-4">
                        <p className="text-gray-300">
                          {new Date(account.created).toLocaleDateString('id-ID')}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 glass-subtle rounded-lg text-blue-400 hover:shadow-modern transition-smooth">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 glass-subtle rounded-lg text-red-400 hover:shadow-modern transition-smooth">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </div>
      </main>
    </div>
  );
}
