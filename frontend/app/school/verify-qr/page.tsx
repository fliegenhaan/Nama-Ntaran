'use client';

import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import axios from 'axios';

interface DeliveryQRData {
  deliveryId: number;
  schoolId: number;
  cateringId: number;
  portions: number;
  deliveryDate: string;
  hash: string;
}

export default function VerifyQRPage() {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<DeliveryQRData | null>(null);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);
  const [verified, setVerified] = useState(false);
  const [qualityRating, setQualityRating] = useState(5);
  const [notes, setNotes] = useState('');

  let html5QrCode: Html5Qrcode | null = null;

  const startScanning = async () => {
    try {
      setError('');
      setScannedData(null);

      html5QrCode = new Html5Qrcode("qr-reader");

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanFailure
      );

      setScanning(true);
    } catch (err: any) {
      setError('Gagal mengakses kamera: ' + err.message);
      console.error('Camera error:', err);
    }
  };

  const stopScanning = async () => {
    if (html5QrCode && scanning) {
      try {
        await html5QrCode.stop();
        html5QrCode.clear();
        setScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const onScanSuccess = (decodedText: string) => {
    try {
      const data: DeliveryQRData = JSON.parse(decodedText);

      // Validate hash
      const dataString = `${data.deliveryId}-${data.schoolId}-${data.cateringId}-${data.portions}-${data.deliveryDate}`;
      const expectedHash = generateHash(dataString);

      if (data.hash !== expectedHash) {
        setError('QR Code tidak valid atau telah dimodifikasi!');
        return;
      }

      setScannedData(data);
      stopScanning();
    } catch (err) {
      console.error('QR decode error:', err);
      setError('Format QR Code tidak valid');
    }
  };

  const onScanFailure = (error: string) => {
    // Ignore scan failures (normal when no QR in view)
  };

  const generateHash = (data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  const handleVerify = async () => {
    if (!scannedData) return;

    setValidating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/verifications`,
        {
          delivery_id: scannedData.deliveryId,
          portions_received: scannedData.portions,
          quality_rating: qualityRating,
          notes: notes || `Verifikasi via QR Code - ${new Date().toLocaleString('id-ID')}`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setVerified(true);
      setTimeout(() => {
        window.location.href = '/school';
      }, 3000);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.response?.data?.error || 'Gagal memverifikasi delivery');
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <DashboardLayout role="school">
      <div className="p-6 min-h-screen bg-gray-950 blockchain-mesh">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-16 h-16 gradient-bg-3 rounded-2xl flex items-center justify-center shadow-modern">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Scan QR Code
            </h1>
            <p className="text-gray-300">
              Scan QR code dari kotak makanan untuk verifikasi cepat
            </p>
          </div>

          {/* QR Scanner */}
          {!scannedData && (
            <div className="glass rounded-2xl p-6 mb-6">
              <div id="qr-reader" className="rounded-xl overflow-hidden mb-4"></div>

              {!scanning ? (
                <button
                  onClick={startScanning}
                  className="w-full gradient-bg-2 text-white px-6 py-4 rounded-xl font-bold hover:shadow-glow transition-smooth flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Mulai Scan QR Code
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="w-full gradient-bg-3 text-white px-6 py-4 rounded-xl font-bold hover:shadow-glow transition-smooth flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Stop Scanning
                </button>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-100">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Scanned Data & Verification Form */}
          {scannedData && !verified && (
            <div className="glass rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <p className="font-bold text-white">QR Code Valid!</p>
                  <p className="text-sm text-green-100">Data delivery berhasil dipindai</p>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="glass-subtle rounded-xl p-5 mb-6">
                <h3 className="font-bold text-white mb-4">Detail Delivery:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Delivery ID:</span>
                    <span className="font-semibold text-white">#{scannedData.deliveryId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Jumlah Porsi:</span>
                    <span className="font-bold text-blue-400">{scannedData.portions} porsi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Tanggal:</span>
                    <span className="font-semibold text-white">
                      {new Date(scannedData.deliveryDate).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quality Rating */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-3">
                  Penilaian Kualitas
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setQualityRating(rating)}
                      className={`flex-1 py-3 rounded-xl font-bold transition-smooth ${
                        qualityRating === rating
                          ? 'gradient-bg-4 text-white shadow-glow'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  1 = Buruk, 5 = Sangat Baik
                </p>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan jika ada..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleVerify}
                disabled={validating}
                className="w-full gradient-bg-4 text-white px-6 py-4 rounded-xl font-bold hover:shadow-glow transition-smooth flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {validating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verifikasi Penerimaan
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setScannedData(null);
                  setError('');
                }}
                className="w-full mt-3 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-smooth"
              >
                Scan Ulang
              </button>
            </div>
          )}

          {/* Success Message */}
          {verified && (
            <div className="glass rounded-2xl p-8 text-center">
              <div className="w-20 h-20 gradient-bg-4 rounded-full flex items-center justify-center mx-auto mb-4 shadow-modern">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Verifikasi Berhasil!
              </h2>
              <p className="text-gray-300 mb-4">
                Dana akan segera dicairkan ke katering
              </p>
              <p className="text-sm text-gray-400">
                Redirecting ke dashboard...
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold text-white mb-3">Petunjuk:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
              <li>Klik tombol &quot;Mulai Scan QR Code&quot;</li>
              <li>Izinkan akses kamera jika diminta browser</li>
              <li>Arahkan kamera ke QR code di kotak makanan</li>
              <li>Tunggu hingga QR code terbaca otomatis</li>
              <li>Periksa detail delivery, beri penilaian kualitas</li>
              <li>Klik &quot;Verifikasi Penerimaan&quot; untuk selesai</li>
            </ol>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
