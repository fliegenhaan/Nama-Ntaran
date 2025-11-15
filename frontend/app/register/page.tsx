'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '../components/ui/Button';
import { UserPlus, Mail, Lock, User, Building2, School, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'school' as 'school' | 'catering',
    name: '',
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

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      const { authApi, setToken, setUser } = await import('@/lib/api');
      const data = await authApi.register(
        formData.email,
        formData.password,
        formData.role,
        formData.name
      );

      // Auto login after registration
      setToken(data.token);
      setUser(data.user);

      // Redirect based on role
      if (formData.role === 'school') {
        router.push('/school');
      } else {
        router.push('/catering');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <School className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">NutriChain</h1>
          <p className="text-green-200">Daftar Akun Baru</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Buat Akun</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-600 rounded">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Daftar Sebagai
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'school' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.role === 'school'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <School className={`w-8 h-8 mx-auto mb-2 ${
                    formData.role === 'school' ? 'text-green-600' : 'text-gray-600'
                  }`} />
                  <p className="text-sm font-semibold text-gray-900">Sekolah</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'catering' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.role === 'catering'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Building2 className={`w-8 h-8 mx-auto mb-2 ${
                    formData.role === 'catering' ? 'text-green-600' : 'text-gray-600'
                  }`} />
                  <p className="text-sm font-semibold text-gray-900">Katering</p>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                {formData.role === 'school' ? 'Nama Sekolah' : 'Nama Katering'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={formData.role === 'school' ? 'SDN 01 Jakarta' : 'Katering Sehat Mandiri'}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimal 6 karakter</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="success"
              icon={UserPlus}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Daftar Sekarang'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Sudah punya akun?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Login ke Akun Anda
            </Button>
          </Link>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-green-600 hover:text-green-800 hover:underline">
              Kembali ke Beranda
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-green-800 bg-opacity-50 rounded-lg p-4 text-white text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-200 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Keuntungan Bergabung:</p>
              <ul className="space-y-1 text-green-200 text-xs">
                <li>• Dashboard real-time untuk monitoring</li>
                <li>• Pembayaran otomatis via blockchain</li>
                <li>• Transparansi penuh setiap transaksi</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
