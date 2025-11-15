'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '../../components/ui/Button';
import { Shield, Mail, Lock, User, AlertCircle, Key } from 'lucide-react';

export default function AdminRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    inviteCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password minimal 8 karakter untuk akun admin');
      return;
    }

    if (!formData.inviteCode) {
      setError('Kode undangan diperlukan untuk registrasi admin');
      return;
    }

    setLoading(true);

    try {
      const { authApi, setToken, setUser } = await import('@/lib/api');
      const data = await authApi.registerAdmin(
        formData.email,
        formData.password,
        formData.name,
        formData.inviteCode
      );

      // Save token and user info
      setToken(data.token);
      setUser(data.user);

      // Redirect to admin dashboard
      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 blockchain-mesh flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 gradient-bg-4 rounded-full shadow-modern mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin MBG</h1>
          <p className="text-gray-300">Registrasi Akun Pemerintah</p>
        </div>

        {/* Register Card */}
        <div className="glass rounded-2xl shadow-modern p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Buat Akun Admin</h2>
            <p className="text-sm text-gray-400">
              Hanya untuk petugas pemerintah yang memiliki kode undangan
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border-l-4 border-red-500 rounded">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invite Code */}
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-semibold text-white mb-2">
                Kode Undangan <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="inviteCode"
                  type="text"
                  required
                  value={formData.inviteCode}
                  onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth outline-none"
                  placeholder="MBG-ADMIN-XXXX"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Hubungi administrator untuk mendapatkan kode undangan
              </p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth outline-none"
                  placeholder="Nama Admin"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                Email Resmi <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth outline-none"
                  placeholder="admin@mbg.gov.id"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth outline-none"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Minimal 8 karakter</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-2">
                Konfirmasi Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="success"
              icon={Shield}
              className="w-full gradient-bg-4 hover:shadow-glow"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Daftar sebagai Admin'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 glass text-gray-400">Sudah punya akun?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link href="/login">
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
              Login ke Akun Anda
            </Button>
          </Link>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-smooth">
              Kembali ke Beranda
            </Link>
          </div>
        </div>

        {/* Security Info */}
        <div className="mt-6 glass rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="font-semibold text-white mb-1">Keamanan Tingkat Tinggi</p>
              <ul className="space-y-1 text-gray-300 text-xs">
                <li>• Hanya untuk petugas pemerintah resmi</li>
                <li>• Memerlukan kode undangan yang valid</li>
                <li>• Akses penuh ke sistem monitoring</li>
                <li>• Semua aktivitas akan dicatat untuk audit</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
