'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import useDeliveries from '../../../hooks/useDeliveries';
import useIssues from '../../../hooks/useIssues';
import ModernSidebar from '../../../components/layout/ModernSidebar';
import PageHeader from '../../../components/layout/PageHeader';
import GlassPanel from '../../../components/ui/GlassPanel';
import {
  AlertTriangle,
  Upload,
  X,
  Send,
  ArrowLeft,
  Loader2,
  LayoutDashboard,
  History,
} from 'lucide-react';

function ReportIssueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { createIssue } = useIssues();

  const deliveryId = searchParams.get('delivery_id');

  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [issueType, setIssueType] = useState('quality_issue');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { deliveries } = useDeliveries({
    school_id: user?.school_id,
  });

  // Load delivery data
  useEffect(() => {
    if (deliveryId && deliveries.length > 0) {
      const delivery = deliveries.find(d => d.id === parseInt(deliveryId));
      if (delivery) {
        setSelectedDelivery(delivery);
      }
    }
  }, [deliveryId, deliveries]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'school') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File terlalu besar! Maksimal 5MB.');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar!');
        return;
      }

      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDelivery) {
      alert('Delivery tidak ditemukan!');
      return;
    }

    if (!description.trim()) {
      alert('Deskripsi masalah tidak boleh kosong!');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('delivery_id', selectedDelivery.id.toString());
      formData.append('issue_type', issueType);
      formData.append('description', description);
      formData.append('severity', severity);

      if (photo) {
        formData.append('issue_photo', photo);
      }

      await createIssue(formData);

      alert('✅ Laporan masalah berhasil dikirim!');
      router.push('/school');
    } catch (error: any) {
      alert(`❌ Error: ${error.message || 'Gagal mengirim laporan'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 blockchain-mesh">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', path: '/school', icon: LayoutDashboard },
    { label: 'Riwayat', path: '/school/history', icon: History },
    { label: 'Laporan Masalah', path: '/school/issues', icon: AlertTriangle },
  ];

  return (
    <div className="flex min-h-screen bg-gray-950 blockchain-mesh">
      <ModernSidebar
        navItems={navItems}
        userRole="School"
        userName="Kepala Sekolah"
        userEmail={user.school_name || 'Sekolah'}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <PageHeader
            title="Laporkan Masalah"
            subtitle="Laporkan masalah terkait pengiriman makanan"
            icon={AlertTriangle}
            breadcrumbs={[
              { label: 'Dashboard', href: '/school' },
              { label: 'Laporan Masalah' },
            ]}
          />

          <GlassPanel className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-smooth mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>

            {selectedDelivery && (
              <div className="mb-6 p-4 glass-subtle rounded-xl">
                <h3 className="font-semibold text-white mb-2">
                  Detail Pengiriman
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Katering</p>
                    <p className="font-semibold text-white">{selectedDelivery.catering_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Tanggal</p>
                    <p className="font-semibold text-white">
                      {new Date(selectedDelivery.delivery_date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Porsi</p>
                    <p className="font-semibold text-white">{selectedDelivery.portions}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Status</p>
                    <p className="font-semibold text-white capitalize">{selectedDelivery.status}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Issue Type */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Jenis Masalah <span className="text-red-400">*</span>
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
                  required
                >
                  <option value="late_delivery">Keterlambatan Pengiriman</option>
                  <option value="wrong_portions">Jumlah Porsi Tidak Sesuai</option>
                  <option value="quality_issue">Masalah Kualitas Makanan</option>
                  <option value="missing_delivery">Pengiriman Tidak Datang</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Tingkat Keparahan
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: 'low', label: 'Rendah', color: 'bg-green-500/20 text-green-400 hover:bg-green-500/30' },
                    { value: 'medium', label: 'Sedang', color: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' },
                    { value: 'high', label: 'Tinggi', color: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' },
                    { value: 'critical', label: 'Kritis', color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSeverity(item.value)}
                      className={`p-3 rounded-xl font-semibold transition-smooth ${
                        severity === item.value
                          ? `${item.color} ring-2 ring-offset-2 ring-blue-400`
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Deskripsi Masalah <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Jelaskan masalah secara detail..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth resize-none"
                  required
                />
                <p className="text-sm text-gray-400 mt-2">
                  {description.length} / 500 karakter
                </p>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Upload Foto Bukti (Opsional)
                </label>
                {!photoPreview ? (
                  <label className="block cursor-pointer">
                    <div className="bg-white/10 rounded-2xl p-8 border-2 border-dashed border-white/30 hover:border-blue-400 transition-smooth text-center">
                      <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="font-semibold text-white mb-1">
                        Klik untuk upload foto
                      </p>
                      <p className="text-sm text-gray-400">
                        PNG, JPG, WebP hingga 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-64 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute top-4 right-4 p-2 gradient-bg-3 text-white rounded-xl hover:shadow-glow transition-smooth"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-smooth"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 gradient-bg-2 text-white py-3 rounded-xl font-bold hover:shadow-glow transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Kirim Laporan
                    </>
                  )}
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      </main>
    </div>
  );
}

export default function ReportIssuePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-950 blockchain-mesh">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      }
    >
      <ReportIssueContent />
    </Suspense>
  );
}
