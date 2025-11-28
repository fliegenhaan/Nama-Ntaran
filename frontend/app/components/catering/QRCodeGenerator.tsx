'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Download, CheckCircle, Upload, Loader2, AlertCircle } from 'lucide-react';
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
    <div className="glass-subtle rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 gradient-bg-3 rounded-lg flex items-center justify-center">
          <QrCode className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-white">QR Code Delivery</h3>
          <p className="text-sm text-gray-300">Untuk verifikasi sekolah</p>
        </div>
      </div>

      {/* QR Code Canvas */}
      <div className="bg-white rounded-xl p-4 mb-4 flex items-center justify-center">
        <canvas ref={canvasRef} className="rounded-lg" />
      </div>

      {generated && !uploaded && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-sm text-green-100">QR Code berhasil dibuat!</p>
        </div>
      )}

      {uploaded && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <CheckCircle className="w-4 h-4 text-blue-400" />
          <p className="text-sm text-blue-100">QR Code tersimpan di cloud!</p>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-sm text-red-100">{uploadError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={downloadQRCode}
          disabled={!generated}
          className="gradient-bg-2 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-glow transition-smooth flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Download
        </button>

        <button
          onClick={uploadQRCodeToStorage}
          disabled={!generated || uploading || uploaded}
          className="bg-purple-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-purple-700 hover:shadow-glow transition-smooth flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : uploaded ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Uploaded
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Save to Cloud
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-100 mb-2">
          <strong>Cara Pakai:</strong>
        </p>
        <ol className="text-xs text-blue-100 space-y-1 list-decimal list-inside">
          <li>Klik "Save to Cloud" untuk menyimpan QR code</li>
          <li>Download atau cetak QR code</li>
          <li>Tempel QR code di kotak makanan</li>
          <li>Sekolah akan scan QR saat verifikasi penerimaan</li>
        </ol>
      </div>

      {qrCodeUrl && (
        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-xs text-green-100 break-all">
            <strong>URL:</strong> {qrCodeUrl}
          </p>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
