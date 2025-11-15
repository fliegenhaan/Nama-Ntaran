'use client';

import React, { useState, useEffect } from 'react';
import { Lock, X, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface School {
  id: number;
  name: string;
  npsn: string;
  province: string;
  city: string;
}

interface Catering {
  id: number;
  name: string;
  wallet_address: string;
}

interface LockEscrowFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const LockEscrowForm: React.FC<LockEscrowFormProps> = ({ onSuccess, onClose }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [caterings, setCaterings] = useState<Catering[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    school_id: '',
    catering_id: '',
    delivery_date: '',
    portions: '',
    amount: '',
    notes: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [schoolsRes, cateringsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/schools`, config),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/caterings`, config)
      ]);

      setSchools(schoolsRes.data.schools || []);
      setCaterings(cateringsRes.data.caterings || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Gagal memuat data sekolah dan katering');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      // 1. Create delivery first
      const deliveryRes = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/deliveries`,
        {
          school_id: parseInt(formData.school_id),
          catering_id: parseInt(formData.catering_id),
          delivery_date: formData.delivery_date,
          portions: parseInt(formData.portions),
          amount: parseFloat(formData.amount),
          notes: formData.notes,
          status: 'pending'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const deliveryId = deliveryRes.data.id;

      // 2. Lock escrow for this delivery
      const selectedCatering = caterings.find(c => c.id === parseInt(formData.catering_id));
      const selectedSchool = schools.find(s => s.id === parseInt(formData.school_id));

      if (!selectedCatering || !selectedSchool) {
        throw new Error('Invalid school or catering selection');
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/escrow/lock`,
        {
          delivery_id: deliveryId,
          catering_wallet: selectedCatering.wallet_address,
          school_npsn: selectedSchool.npsn,
          amount: parseFloat(formData.amount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 2000);
    } catch (err: any) {
      console.error('Error locking escrow:', err);
      setError(err.response?.data?.error || 'Gagal mengunci dana ke escrow');
    } finally {
      setLoading(false);
    }
  };

  const calculateAmount = () => {
    if (formData.portions) {
      // Assume Rp 15,000 per portion
      const amount = parseInt(formData.portions) * 15000;
      setFormData(prev => ({ ...prev, amount: amount.toString() }));
    }
  };

  useEffect(() => {
    if (formData.portions) {
      calculateAmount();
    }
  }, [formData.portions]);

  if (loadingData) {
    return (
      <div className="glass rounded-2xl p-8">
        <div className="flex items-center justify-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 gradient-bg-1 rounded-xl flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Lock Dana ke Escrow</h3>
            <p className="text-gray-300">Kunci dana untuk delivery baru</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-smooth text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-100">Dana berhasil dikunci ke escrow!</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
          <p className="text-red-100">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* School Selection */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Sekolah <span className="text-red-400">*</span>
          </label>
          <select
            required
            value={formData.school_id}
            onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
          >
            <option value="" className="bg-gray-800">Pilih Sekolah...</option>
            {schools.map(school => (
              <option key={school.id} value={school.id} className="bg-gray-800">
                {school.name} - {school.city}, {school.province} (NPSN: {school.npsn})
              </option>
            ))}
          </select>
        </div>

        {/* Catering Selection */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Katering <span className="text-red-400">*</span>
          </label>
          <select
            required
            value={formData.catering_id}
            onChange={(e) => setFormData({ ...formData, catering_id: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
          >
            <option value="" className="bg-gray-800">Pilih Katering...</option>
            {caterings.map(catering => (
              <option key={catering.id} value={catering.id} className="bg-gray-800">
                {catering.name}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery Date */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Tanggal Pengiriman <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.delivery_date}
            onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
          />
        </div>

        {/* Portions */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Jumlah Porsi <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.portions}
            onChange={(e) => setFormData({ ...formData, portions: e.target.value })}
            placeholder="Contoh: 100"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
          />
          <p className="mt-1 text-sm text-gray-300">@ Rp 15,000 per porsi</p>
        </div>

        {/* Amount (Auto-calculated) */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Total Dana (Rupiah) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            required
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="Otomatis dihitung dari jumlah porsi"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth font-bold"
          />
          {formData.amount && (
            <p className="mt-1 text-sm text-blue-300">
              = Rp {parseFloat(formData.amount).toLocaleString('id-ID')}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Catatan (Opsional)
          </label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Menu, instruksi khusus, dll..."
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 gradient-bg-4 text-white px-6 py-4 rounded-xl font-bold hover:shadow-glow transition-smooth flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mengunci Dana...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Berhasil!
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Lock Dana ke Escrow
              </>
            )}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-smooth"
            >
              Batal
            </button>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-sm text-blue-100">
            <strong>Catatan:</strong> Setelah dana dikunci ke escrow, katering akan melihat dana tersedia dan akan mengirim makanan.
            Dana akan otomatis tercairkan setelah sekolah melakukan verifikasi penerimaan.
          </p>
        </div>
      </form>
    </div>
  );
};

export default LockEscrowForm;
