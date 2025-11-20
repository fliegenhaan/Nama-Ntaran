'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Loader2,
  Save,
  Bell,
  Lock,
  Globe,
  Zap,
  CheckCircle,
  Shield,
  Clock,
  Database,
  Mail,
  Smartphone,
  Server,
  Key,
  Settings as SettingsIcon,
} from 'lucide-react';

// TODO: Integrasi dengan backend API untuk fetch dan save settings
// TODO: Implementasi actual API call untuk get current settings
// TODO: Tambahkan validation untuk input fields (URL format, gas limit range)
// TODO: Implementasi success/error toast notifications saat save
// TODO: Tambahkan confirmation modal untuk critical settings (maintenance mode)
// TODO: Implementasi audit log untuk track settings changes
// TODO: Tambahkan reset to default button untuk setiap section
// TODO: Implementasi role-based access control untuk sensitive settings
// TODO: Tambahkan test connection button untuk blockchain RPC URL
// TODO: Implementasi backup and restore settings functionality

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // system settings
    systemName: 'MBG NutriChain',
    maintenanceMode: false,
    autoBackup: true,
    backupInterval: '24',

    // notification settings
    emailNotifications: true,
    smsNotifications: false,
    webhookUrl: '',

    // security settings
    twoFactorAuth: false,
    sessionTimeout: '30',
    maxLoginAttempts: '5',

    // blockchain settings
    networkUrl: 'https://sepolia.infura.io/v3/YOUR-API-KEY',
    contractAddress: '0x1234567890abcdef...',
    gasLimit: '3000000',
  });

  const [isSaving, setIsSaving] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.05,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  // handle save settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Replace with actual API call
      // await api.post('/api/settings', settings);

      // simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Saving settings...', settings);
      alert('Pengaturan Berhasil Disimpan!');
    } catch (error: any) {
      console.error('Save settings error:', error);
      alert('Gagal Menyimpan Pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
        <p className="text-sm text-gray-600 mt-0.5">
          Konfigurasi Sistem, Notifikasi, Keamanan, Dan Blockchain Configuration.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* System Settings */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border border-gray-200 card-optimized">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Pengaturan Sistem</h3>
          </div>
          <div className="space-y-4">
            {/* System Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Nama Sistem
              </label>
              <input
                type="text"
                value={settings.systemName}
                onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-smooth"
              />
            </div>

            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Server className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Maintenance Mode</p>
                  <p className="text-sm text-gray-600">Nonaktifkan Akses Sementara Untuk Maintenance</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Auto Backup */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Auto Backup</p>
                  <p className="text-sm text-gray-600">Backup Otomatis Database Setiap 24 Jam</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoBackup}
                  onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Backup Interval */}
            {settings.autoBackup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Interval Backup (Jam)
                </label>
                <input
                  type="number"
                  value={settings.backupInterval}
                  onChange={(e) => setSettings({ ...settings, backupInterval: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-smooth"
                  min="1"
                  max="168"
                />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border border-gray-200 card-optimized">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Notifikasi</h3>
          </div>
          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Terima Notifikasi Penting Via Email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* SMS Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Terima Alert Kritikal Via SMS</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Webhook URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Webhook URL (Optional)
              </label>
              <input
                type="text"
                value={settings.webhookUrl}
                onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                placeholder="https://example.com/webhook"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-smooth font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                URL untuk menerima notifikasi webhook dari sistem
              </p>
            </div>
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border border-gray-200 card-optimized">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Keamanan</h3>
          </div>
          <div className="space-y-4">
            {/* Two-Factor Auth */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Tingkatkan Keamanan Akun Dengan 2FA</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Session Timeout */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                Session Timeout (Menit)
              </label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-smooth"
                min="5"
                max="1440"
              />
              <p className="text-xs text-gray-500 mt-2">
                User akan auto logout setelah tidak aktif selama waktu yang ditentukan
              </p>
            </div>

            {/* Max Login Attempts */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-gray-600" />
                Max Login Attempts
              </label>
              <input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-smooth"
                min="3"
                max="10"
              />
              <p className="text-xs text-gray-500 mt-2">
                Akun akan di-lock setelah gagal login sebanyak ini
              </p>
            </div>
          </div>
        </motion.div>

        {/* Blockchain Settings */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 border border-gray-200 card-optimized">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Blockchain Configuration</h3>
          </div>
          <div className="space-y-4">
            {/* Network RPC URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Network RPC URL
              </label>
              <input
                type="text"
                value={settings.networkUrl}
                onChange={(e) => setSettings({ ...settings, networkUrl: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-smooth font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                URL endpoint untuk connect ke blockchain network (Ethereum, Polygon, etc.)
              </p>
            </div>

            {/* Contract Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Contract Address
              </label>
              <input
                type="text"
                value={settings.contractAddress}
                onChange={(e) => setSettings({ ...settings, contractAddress: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-smooth font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Address dari deployed smart contract untuk sistem escrow
              </p>
            </div>

            {/* Gas Limit */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Gas Limit
              </label>
              <input
                type="text"
                value={settings.gasLimit}
                onChange={(e) => setSettings({ ...settings, gasLimit: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-smooth"
              />
              <p className="text-xs text-gray-500 mt-2">
                Maximum gas limit untuk blockchain transactions
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info Panel */}
        <motion.div variants={itemVariants} className="bg-blue-50 rounded-xl p-6 border border-blue-200 card-optimized">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <SettingsIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Tentang Pengaturan</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Halaman ini memungkinkan administrator untuk mengkonfigurasi berbagai aspek sistem termasuk pengaturan umum, notifikasi, keamanan, dan blockchain configuration. Pastikan untuk menyimpan perubahan setelah melakukan modifikasi. Beberapa pengaturan mungkin memerlukan restart sistem untuk diterapkan sepenuhnya.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div variants={itemVariants} className="flex justify-end gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-lg transition-smooth flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                Simpan Pengaturan
              </>
            )}
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center py-4">
          <p className="text-sm text-gray-500">
            © 2025 NutriTrack Admin. All Rights Reserved.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
