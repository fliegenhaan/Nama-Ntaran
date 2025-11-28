'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Download, CheckCircle, Upload, Loader2, AlertCircle, ClipboardList } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { uploadQRCode } from '@/lib/supabase-storage';
import axios from 'axios';

interface DeliveryQRData {
  deliveryId: number;
  schoolId: number;
  cateringId: number;
  portions: number;
  deliveryDate: string;
  hash: string;
}

interface QRCodeGeneratorProps {
  deliveryId: number;
  schoolId: number;
  cateringId: number;
  portions: number;
  deliveryDate: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  deliveryId,
  schoolId,
  cateringId,
  portions,
  deliveryDate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generated, setGenerated] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    generateQRCode();
  }, [deliveryId, schoolId, cateringId, portions, deliveryDate]);

  const generateHash = (data: string): string => {
    // Simple hash untuk authenticity (in production, use proper cryptographic hash)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  const generateQRCode = async () => {
    if (!canvasRef.current) return;

    const dataString = `${deliveryId}-${schoolId}-${cateringId}-${portions}-${deliveryDate}`;
    const hash = generateHash(dataString);

    const qrData: DeliveryQRData = {
      deliveryId,
      schoolId,
      cateringId,
      portions,
      deliveryDate,
      hash
    };

    const qrString = JSON.stringify(qrData);

    try {
      await QRCodeLib.toCanvas(canvasRef.current, qrString, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setGenerated(true);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const downloadQRCode = () => {
    if (!canvasRef.current) return;

    const url = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `delivery-${deliveryId}-qr.png`;
    link.click();
  };

  const uploadQRCodeToStorage = async () => {
    if (!canvasRef.current) return;

    try {
      setUploading(true);
      setUploadError(null);

      // Upload to Supabase Storage
      const { publicUrl, error: storageError } = await uploadQRCode(
        canvasRef.current,
        deliveryId
      );

      if (storageError || !publicUrl) {
        throw storageError || new Error('Failed to upload QR code');
      }

      setQrCodeUrl(publicUrl);

      // Save URL to backend (delivery record)
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/deliveries/${deliveryId}`,
        { qr_code_url: publicUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUploaded(true);
      console.log('✅ QR code uploaded and saved:', publicUrl);
    } catch (error: any) {
      console.error('❌ QR upload failed:', error);
      setUploadError(error.message || 'Gagal upload QR code');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-xl border border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
          <QrCode className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">QR Code Delivery</h3>
          <p className="text-sm text-slate-300">Untuk verifikasi sekolah</p>
        </div>
      </div>

      {/* QR Code Canvas */}
      <div className="bg-white rounded-xl p-4 mb-4 flex items-center justify-center">
        <canvas ref={canvasRef} className="rounded-lg" />
      </div>

      {generated && !uploaded && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-green-500 border border-green-600 rounded-lg shadow-md">
          <CheckCircle className="w-5 h-5 text-white" />
          <p className="text-sm font-semibold text-white">QR Code berhasil dibuat!</p>
        </div>
      )}

      {uploaded && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-500 border border-blue-600 rounded-lg shadow-md">
          <CheckCircle className="w-5 h-5 text-white" />
          <p className="text-sm font-semibold text-white">QR Code tersimpan di cloud!</p>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-500 border border-red-600 rounded-lg shadow-md">
          <AlertCircle className="w-5 h-5 text-white" />
          <p className="text-sm font-semibold text-white">{uploadError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={downloadQRCode}
          disabled={!generated}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-orange-500 disabled:hover:to-orange-600"
        >
          <Download className="w-5 h-5" />
          Download
        </button>

        <button
          onClick={uploadQRCodeToStorage}
          disabled={!generated || uploading || uploaded}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-indigo-600"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : uploaded ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Uploaded
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Save to Cloud
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="p-4 bg-slate-700/80 border border-slate-600 rounded-lg shadow-inner">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="w-4 h-4 text-white" />
          <p className="text-sm text-white font-bold">
            Cara Pakai:
          </p>
        </div>
        <ol className="text-sm text-slate-200 space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>Klik "Save to Cloud" untuk menyimpan QR code</li>
          <li>Download atau cetak QR code</li>
          <li>Tempel QR code di kotak makanan</li>
          <li>Sekolah akan scan QR saat verifikasi penerimaan</li>
        </ol>
      </div>

      {qrCodeUrl && (
        <div className="mt-3 p-4 bg-green-600/90 border border-green-500 rounded-lg shadow-md">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
            <p className="text-sm text-white break-all">
              <strong className="font-bold">URL:</strong> {qrCodeUrl}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
