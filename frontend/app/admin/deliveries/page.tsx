'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Package,
  Calendar,
  DollarSign,
  Building2,
  UtensilsCrossed,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface School {
  id: number;
  name: string;
  npsn: string;
  city: string;
  province: string;
}

interface Catering {
  id: number;
  name: string;
  company_name: string;
  email: string;
}

export default function CreateDeliveryPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  // Form state
  const [formData, setFormData] = useState({
    school_id: '',
    catering_id: '',
    delivery_date: '',
    portions: '',
    amount: '',
    notes: '',
  });

  // Data state
  const [schools, setSchools] = useState<School[]>([]);
  const [caterings, setCaterings] = useState<Catering[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch schools and caterings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        // Fetch schools
        const schoolsRes = await fetch(`${apiUrl}/api/schools`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const schoolsData = await schoolsRes.json();

        // Fetch caterings
        const cateringsRes = await fetch(`${apiUrl}/api/caterings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const cateringsData = await cateringsRes.json();

        // API returns { schools: [...] } and { caterings: [...] } directly
        if (schoolsData.schools) {
          setSchools(schoolsData.schools);
        }
        if (cateringsData.caterings) {
          setCaterings(cateringsData.caterings);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Gagal memuat data sekolah dan katering');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('\n========================================');
    console.log('🎯 [FRONTEND] CREATE DELIVERY FORM SUBMIT');
    console.log('========================================');

    // Validation
    if (!formData.school_id || !formData.catering_id || !formData.delivery_date || !formData.portions || !formData.amount) {
      console.log('❌ Validation failed: Missing required fields');
      setError('Semua field wajib diisi kecuali catatan');
      return;
    }

    const portions = parseInt(formData.portions);
    const amount = parseFloat(formData.amount);

    console.log('📋 Form data:', {
      school_id: parseInt(formData.school_id),
      catering_id: parseInt(formData.catering_id),
      delivery_date: formData.delivery_date,
      portions,
      amount,
      notes: formData.notes || null
    });

    if (portions <= 0) {
      console.log('❌ Validation failed: Portions must be > 0');
      setError('Jumlah porsi harus lebih dari 0');
      return;
    }

    if (amount <= 0) {
      console.log('❌ Validation failed: Amount must be > 0');
      setError('Jumlah dana harus lebih dari 0');
      return;
    }

    console.log('✅ Validation passed');

    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      console.log('\n📤 Sending request to backend...');
      console.log('   API URL:', `${apiUrl}/api/deliveries`);
      console.log('   Token:', token ? 'Present' : 'Missing');

      const requestBody = {
        school_id: parseInt(formData.school_id),
        catering_id: parseInt(formData.catering_id),
        delivery_date: formData.delivery_date,
        portions: portions,
        amount: amount,
        notes: formData.notes || null,
      };

      console.log('   Request body:', requestBody);

      const response = await fetch(`${apiUrl}/api/deliveries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('\n📥 Response received');
      console.log('   Status:', response.status);
      console.log('   Status text:', response.statusText);

      const result = await response.json();
      console.log('   Response body:', result);

      if (!response.ok) {
        console.log('❌ Request failed');
        throw new Error(result.error || 'Gagal membuat delivery');
      }

      console.log('✅ Delivery created successfully!');
      console.log('   Delivery ID:', result.delivery?.id);
      console.log('========================================\n');

      setSuccess(true);

      // Reset form
      setFormData({
        school_id: '',
        catering_id: '',
        delivery_date: '',
        portions: '',
        amount: '',
        notes: '',
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        console.log('🔄 Redirecting to admin dashboard...');
        router.push('/admin');
      }, 2000);

    } catch (err) {
      console.log('\n❌ Error creating delivery');
      console.error('Error details:', err);
      console.log('========================================\n');
      setError(err instanceof Error ? err.message : 'Gagal membuat delivery');
    } finally {
      setSubmitting(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.4,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-700">Memuat Data...</h3>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4 transition-smooth"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Kembali</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Buat Delivery Baru</h1>
        <p className="text-sm text-gray-600 mt-0.5">
          Assign delivery tugas kepada katering untuk mengirim makanan ke sekolah.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl"
      >
        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900">Delivery Berhasil Dibuat!</h4>
              <p className="text-sm text-green-700 mt-1">
                Delivery telah berhasil di-assign ke katering. Redirecting ke dashboard...
              </p>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Form Card */}
        <motion.form
          variants={itemVariants}
          onSubmit={handleSubmit}
          className="bg-white rounded-xl p-8 border border-gray-200 space-y-6"
        >
          {/* School Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Pilih Sekolah
            </label>
            <select
              name="school_id"
              value={formData.school_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth text-gray-900"
            >
              <option value="">-- Pilih Sekolah --</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>
                  {school.name} - {school.city}, {school.province} (NPSN: {school.npsn})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Total {schools.length} sekolah tersedia
            </p>
          </div>

          {/* Catering Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
              <UtensilsCrossed className="w-4 h-4 text-orange-600" />
              Pilih Katering
            </label>
            <select
              name="catering_id"
              value={formData.catering_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth text-gray-900"
            >
              <option value="">-- Pilih Katering --</option>
              {caterings.map(catering => (
                <option key={catering.id} value={catering.id}>
                  {catering.company_name} ({catering.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Total {caterings.length} katering tersedia
            </p>
          </div>

          {/* Delivery Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Tanggal Pengiriman
            </label>
            <input
              type="date"
              name="delivery_date"
              value={formData.delivery_date}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth text-gray-900"
            />
          </div>

          {/* Portions */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
              <Package className="w-4 h-4 text-green-600" />
              Jumlah Porsi
            </label>
            <input
              type="number"
              name="portions"
              value={formData.portions}
              onChange={handleChange}
              required
              min="1"
              placeholder="Contoh: 250"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-2">
              Jumlah porsi makanan yang akan dikirim
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
              <DollarSign className="w-4 h-4 text-teal-600" />
              Jumlah Dana (Rupiah)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="Contoh: 2500000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-2">
              Total biaya untuk delivery ini (dalam Rupiah)
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Tambahkan catatan khusus untuk delivery ini..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth text-gray-900 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-smooth"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-smooth flex items-center justify-center gap-2 disabled:bg-purple-300 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Berhasil!
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Buat Delivery
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Info Panel */}
        <motion.div
          variants={itemVariants}
          className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Tentang Delivery</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Delivery yang dibuat akan memiliki status <span className="font-semibold">"pending"</span> secara default.
                Katering akan menerima notifikasi dan dapat mulai memproses pesanan.
                Dana akan di-lock di smart contract escrow sampai delivery di-verify oleh sekolah.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
