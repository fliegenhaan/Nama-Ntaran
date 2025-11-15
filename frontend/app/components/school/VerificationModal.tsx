'use client';

import React, { useState } from 'react';
import { X, Upload, Camera, CheckCircle } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: {
    catering: string;
    portions: number;
    date: string;
  };
  onSubmit: (data: {
    portionsReceived: number;
    quality: number;
    notes: string;
    photo?: File;
  }) => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  delivery,
  onSubmit,
}) => {
  const [portionsReceived, setPortionsReceived] = useState(delivery.portions);
  const [quality, setQuality] = useState(5);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      portionsReceived,
      quality,
      notes,
      photo: photo || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="glass rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10 scale-in">
        {/* Header */}
        <div className="sticky top-0 glass-dark rounded-t-2xl p-6 flex items-center justify-between border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Verifikasi Penerimaan
            </h2>
            <p className="text-white/80 text-sm">{delivery.catering}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-smooth text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Portions Received */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Jumlah Porsi Diterima
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPortionsReceived(Math.max(0, portionsReceived - 10))}
                className="w-12 h-12 glass-subtle rounded-xl font-bold text-xl hover:shadow-modern transition-smooth"
              >
                -
              </button>
              <input
                type="number"
                value={portionsReceived}
                onChange={(e) => setPortionsReceived(parseInt(e.target.value) || 0)}
                className="flex-1 text-center text-3xl font-bold bg-transparent border-none outline-none"
              />
              <button
                onClick={() => setPortionsReceived(portionsReceived + 10)}
                className="w-12 h-12 glass-subtle rounded-xl font-bold text-xl hover:shadow-modern transition-smooth"
              >
                +
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Dijanjikan: {delivery.portions} porsi
            </p>
          </div>

          {/* Quality Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Penilaian Kualitas
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setQuality(star)}
                  className={`w-12 h-12 rounded-xl font-bold transition-smooth ${
                    star <= quality
                      ? 'gradient-bg-5 text-white shadow-glow'
                      : 'glass-subtle text-gray-400'
                  }`}
                >
                  {star}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {quality === 5
                ? 'Sangat Baik'
                : quality === 4
                ? 'Baik'
                : quality === 3
                ? 'Cukup'
                : quality === 2
                ? 'Kurang'
                : 'Buruk'}
            </p>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Upload Foto (Opsional)
            </label>
            {!photoPreview ? (
              <label className="block cursor-pointer">
                <div className="glass-subtle rounded-2xl p-8 border-2 border-dashed border-gray-300 hover:border-blue-500 transition-smooth text-center">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-semibold text-gray-700 mb-1">
                    Klik untuk upload foto
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG hingga 5MB
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
                  onClick={() => {
                    setPhoto(null);
                    setPhotoPreview(null);
                  }}
                  className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-smooth"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Tambahkan catatan jika diperlukan..."
              className="w-full glass-subtle rounded-xl p-4 outline-none focus-ring resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 glass-dark rounded-b-2xl p-6 flex gap-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 py-3 glass-subtle rounded-xl font-semibold hover:shadow-modern transition-smooth"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 btn-modern gradient-bg-4 text-white py-3 rounded-xl font-semibold hover:shadow-glow transition-smooth"
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            Konfirmasi Verifikasi
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
