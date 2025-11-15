'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Download, CheckCircle } from 'lucide-react';
import QRCodeLib from 'qrcode';

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

      {generated && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-sm text-green-100">QR Code berhasil dibuat!</p>
        </div>
      )}

      {/* Download Button */}
      <button
        onClick={downloadQRCode}
        className="w-full gradient-bg-2 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-glow transition-smooth flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        Download QR Code
      </button>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-100">
          <strong>Cara Pakai:</strong> Cetak dan tempel QR code ini di kotak makanan.
          Sekolah akan scan QR ini saat verifikasi penerimaan.
        </p>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
