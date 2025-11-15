'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, TrendingUp, AlertCircle, Loader2, Info } from 'lucide-react';
import axios from 'axios';

// Dynamic import untuk Leaflet (harus di client-side)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

interface ProvinceData {
  province: string;
  averagePriorityScore: number;
  schoolCount: number;
  highPrioritySchools: number;
}

interface School {
  id: number;
  name: string;
  npsn: string;
  province: string;
  city: string;
  priority_score: number;
  latitude: number;
  longitude: number;
}

export default function PriorityMapPage() {
  const [heatmapData, setHeatmapData] = useState<ProvinceData[]>([]);
  const [topSchools, setTopSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    fetchData();
    setMapReady(true);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [heatmapRes, schoolsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/schools/priority/heatmap`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/schools/priority/top?limit=50`)
      ]);

      setHeatmapData(heatmapRes.data.data || []);
      setTopSchools(schoolsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 80) return '#ef4444'; // Red - High priority
    if (score >= 60) return '#f59e0b'; // Orange
    if (score >= 40) return '#fbbf24'; // Yellow
    if (score >= 20) return '#a3e635'; // Light green
    return '#22c55e'; // Green - Low priority
  };

  const getPriorityLabel = (score: number) => {
    if (score >= 80) return 'Sangat Tinggi';
    if (score >= 60) return 'Tinggi';
    if (score >= 40) return 'Sedang';
    if (score >= 20) return 'Rendah';
    return 'Sangat Rendah';
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg-5 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 flex items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <p className="text-xl font-semibold text-white">Memuat peta prioritas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg-5 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 gradient-bg-1 rounded-2xl flex items-center justify-center">
              <MapPin className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Peta Prioritas AI
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Visualisasi sekolah prioritas berdasarkan analisis AI: tingkat kemiskinan, stunting, dan aksesibilitas geografis
          </p>
        </div>

        {/* Info Box */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-white text-lg mb-2">Cara Membaca Peta</h3>
              <ul className="space-y-2 text-gray-200">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span><strong className="text-white">Merah</strong> = Prioritas Sangat Tinggi (Score 80-100)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <span><strong className="text-white">Orange</strong> = Prioritas Tinggi (Score 60-79)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span><strong className="text-white">Kuning</strong> = Prioritas Sedang (Score 40-59)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-400"></div>
                  <span><strong className="text-white">Hijau</strong> = Prioritas Rendah (Score 0-39)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Peta Interaktif Indonesia
          </h2>
          <div className="relative w-full h-[600px] rounded-xl overflow-hidden border-2 border-white/20">
            {mapReady && typeof window !== 'undefined' && (
              <MapContainer
                center={[-2.5489, 118.0149]} // Indonesia center
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Render school markers */}
                {topSchools.filter(school => school.latitude && school.longitude).map((school) => (
                  <CircleMarker
                    key={school.id}
                    center={[school.latitude, school.longitude]}
                    radius={8}
                    fillColor={getPriorityColor(school.priority_score)}
                    color="#ffffff"
                    weight={2}
                    opacity={0.9}
                    fillOpacity={0.7}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-gray-900 mb-2">{school.name}</h3>
                        <div className="space-y-1 text-sm">
                          <p><strong>NPSN:</strong> {school.npsn}</p>
                          <p><strong>Lokasi:</strong> {school.city}, {school.province}</p>
                          <p>
                            <strong>Priority Score:</strong>
                            <span
                              className="ml-2 font-bold"
                              style={{ color: getPriorityColor(school.priority_score) }}
                            >
                              {school.priority_score.toFixed(1)} - {getPriorityLabel(school.priority_score)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>

        {/* Province Statistics */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Statistik Per Provinsi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {heatmapData
              .sort((a, b) => b.averagePriorityScore - a.averagePriorityScore)
              .map((province, index) => (
                <div
                  key={province.province}
                  className="glass-subtle rounded-xl p-4 hover:shadow-modern transition-smooth cursor-pointer"
                  onClick={() => setSelectedProvince(province.province)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white">{province.province}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">Avg Priority:</span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: getPriorityColor(province.averagePriorityScore) }}
                        >
                          {province.averagePriorityScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${province.averagePriorityScore}%`,
                            backgroundColor: getPriorityColor(province.averagePriorityScore)
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">Total Sekolah:</span>
                      <span className="font-semibold text-white">{province.schoolCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">High Priority:</span>
                      <span className="font-semibold text-red-400">{province.highPrioritySchools}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 gradient-bg-4 text-white font-bold rounded-xl hover:shadow-glow transition-smooth"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
