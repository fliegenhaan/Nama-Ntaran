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
  Save,
  Bell,
  Lock,
  Globe,
  Database,
  Zap,
  CheckCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState({
    // System Settings
    systemName: 'MBG NutriChain',
    maintenanceMode: false,
    autoBackup: true,
    backupInterval: '24',

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    webhookUrl: '',

    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: '30',
    maxLoginAttempts: '5',

    // Blockchain Settings
    networkUrl: 'https://sepolia.infura.io/v3/YOUR-API-KEY',
    contractAddress: '0x1234567890abcdef...',
    gasLimit: '3000000',
  });

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

  const handleSave = () => {
    console.log('Saving settings...', settings);
    alert('Pengaturan berhasil disimpan!');
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
        <div className="max-w-4xl mx-auto p-8">
          <PageHeader
            title="Pengaturan Sistem"
            subtitle="Konfigurasi sistem dan preferensi"
            icon={Settings}
            breadcrumbs={[
              { label: 'Dashboard', href: '/admin' },
              { label: 'Pengaturan' },
            ]}
          />

          <div className="space-y-6">
            {/* System Settings */}
            <GlassPanel>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 gradient-bg-3 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Pengaturan Sistem</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Nama Sistem
                  </label>
                  <input
                    type="text"
                    value={settings.systemName}
                    onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
                  />
                </div>
                <div className="flex items-center justify-between p-4 glass-subtle rounded-xl">
                  <div>
                    <p className="font-semibold text-white">Maintenance Mode</p>
                    <p className="text-sm text-gray-400">Nonaktifkan akses sementara</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 glass-subtle rounded-xl">
                  <div>
                    <p className="font-semibold text-white">Auto Backup</p>
                    <p className="text-sm text-gray-400">Backup otomatis database</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoBackup}
                      onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </GlassPanel>

            {/* Notification Settings */}
            <GlassPanel>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 gradient-bg-1 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Notifikasi</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 glass-subtle rounded-xl">
                  <div>
                    <p className="font-semibold text-white">Email Notifications</p>
                    <p className="text-sm text-gray-400">Terima notifikasi via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 glass-subtle rounded-xl">
                  <div>
                    <p className="font-semibold text-white">SMS Notifications</p>
                    <p className="text-sm text-gray-400">Terima notifikasi via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </GlassPanel>

            {/* Security Settings */}
            <GlassPanel>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 gradient-bg-5 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Keamanan</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 glass-subtle rounded-xl">
                  <div>
                    <p className="font-semibold text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-400">Tingkatkan keamanan akun</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Session Timeout (menit)
                  </label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
                  />
                </div>
              </div>
            </GlassPanel>

            {/* Blockchain Settings */}
            <GlassPanel>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 gradient-bg-2 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Blockchain Configuration</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Network RPC URL
                  </label>
                  <input
                    type="text"
                    value={settings.networkUrl}
                    onChange={(e) => setSettings({ ...settings, networkUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Contract Address
                  </label>
                  <input
                    type="text"
                    value={settings.contractAddress}
                    onChange={(e) => setSettings({ ...settings, contractAddress: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Gas Limit
                  </label>
                  <input
                    type="text"
                    value={settings.gasLimit}
                    onChange={(e) => setSettings({ ...settings, gasLimit: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
                  />
                </div>
              </div>
            </GlassPanel>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="px-8 py-4 gradient-bg-4 text-white rounded-xl font-bold text-lg hover:shadow-glow transition-smooth flex items-center gap-3"
              >
                <Save className="w-6 h-6" />
                Simpan Pengaturan
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
