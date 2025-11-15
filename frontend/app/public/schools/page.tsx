'use client';

import React, { useState, useEffect } from 'react';
import { Search, School, MapPin, CheckCircle, XCircle, Filter, Loader2, TrendingUp } from 'lucide-react';
import axios from 'axios';

interface School {
  id: number;
  npsn: string;
  name: string;
  address: string;
  province: string;
  city: string;
  district: string;
  priority_score: number;
  latitude: number | null;
  longitude: number | null;
  has_mbg: boolean;
  catering_name?: string;
  portions_per_day?: number;
  last_verified?: string;
}

export default function SchoolExplorerPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [filterMBG, setFilterMBG] = useState<'all' | 'yes' | 'no'>('all');

  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    filterSchools();
  }, [searchTerm, selectedProvince, selectedCity, filterMBG, schools]);

  useEffect(() => {
    if (selectedProvince) {
      const provinceCities = schools
        .filter(s => s.province === selectedProvince)
        .map(s => s.city)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort();
      setCities(provinceCities);
      setSelectedCity('');
    }
  }, [selectedProvince, schools]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/schools`);
      const schoolsData = response.data.schools || [];

      // Get unique provinces
      const uniqueProvinces = [...new Set(schoolsData.map((s: School) => s.province))].sort();
      setProvinces(uniqueProvinces as string[]);

      setSchools(schoolsData);
      setFilteredSchools(schoolsData);
    } catch (err) {
      console.error('Error fetching schools:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterSchools = () => {
    let filtered = [...schools];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(term) ||
          s.npsn.toLowerCase().includes(term) ||
          s.city.toLowerCase().includes(term) ||
          s.province.toLowerCase().includes(term)
      );
    }

    // Province filter
    if (selectedProvince) {
      filtered = filtered.filter(s => s.province === selectedProvince);
    }

    // City filter
    if (selectedCity) {
      filtered = filtered.filter(s => s.city === selectedCity);
    }

    // MBG filter
    if (filterMBG === 'yes') {
      filtered = filtered.filter(s => s.has_mbg);
    } else if (filterMBG === 'no') {
      filtered = filtered.filter(s => !s.has_mbg);
    }

    setFilteredSchools(filtered);
  };

  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getPriorityBgColor = (score: number) => {
    if (score >= 80) return 'bg-red-500/20 border-red-500/30';
    if (score >= 60) return 'bg-orange-500/20 border-orange-500/30';
    if (score >= 40) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-green-500/20 border-green-500/30';
  };

  const getPriorityLabel = (score: number) => {
    if (score >= 80) return 'Sangat Tinggi';
    if (score >= 60) return 'Tinggi';
    if (score >= 40) return 'Sedang';
    return 'Rendah';
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg-5 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 flex items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <p className="text-xl font-semibold text-white">Memuat data sekolah...</p>
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
            <div className="w-16 h-16 gradient-bg-2 rounded-2xl flex items-center justify-center">
              <School className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Cari Sekolah Anda
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Cek apakah sekolah Anda termasuk penerima program Makan Bergizi Gratis dan lihat status distribusinya
          </p>
        </div>

        {/* Search & Filters */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-white mb-2">
                Cari Sekolah
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nama sekolah, NPSN, kota..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
                />
              </div>
            </div>

            {/* Province Filter */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Provinsi
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth"
              >
                <option value="" className="bg-gray-800">Semua Provinsi</option>
                {provinces.map(prov => (
                  <option key={prov} value={prov} className="bg-gray-800">{prov}</option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Kota/Kabupaten
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedProvince}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-smooth disabled:opacity-50"
              >
                <option value="" className="bg-gray-800">Semua Kota</option>
                {cities.map(city => (
                  <option key={city} value={city} className="bg-gray-800">{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* MBG Filter */}
          <div className="mt-4 flex items-center gap-4">
            <Filter className="w-5 h-5 text-white" />
            <div className="flex gap-2">
              <button
                onClick={() => setFilterMBG('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-smooth ${
                  filterMBG === 'all'
                    ? 'bg-white text-gray-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterMBG('yes')}
                className={`px-4 py-2 rounded-lg font-semibold transition-smooth ${
                  filterMBG === 'yes'
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Dapat MBG
              </button>
              <button
                onClick={() => setFilterMBG('no')}
                className={`px-4 py-2 rounded-lg font-semibold transition-smooth ${
                  filterMBG === 'no'
                    ? 'bg-red-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Belum Dapat
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Hasil Pencarian
            </h2>
            <p className="text-gray-300">
              <span className="font-bold text-white">{filteredSchools.length}</span> sekolah ditemukan
            </p>
          </div>

          {filteredSchools.length === 0 ? (
            <div className="text-center py-12">
              <School className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-300">Tidak ada sekolah ditemukan</p>
              <p className="text-gray-400 mt-2">Coba ubah filter atau kata kunci pencarian</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSchools.map((school) => (
                <div
                  key={school.id}
                  className="glass-subtle rounded-xl p-5 hover:shadow-modern transition-smooth"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">{school.name}</h3>
                      <p className="text-sm text-gray-300">NPSN: {school.npsn}</p>
                    </div>
                    {school.has_mbg ? (
                      <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-semibold text-green-400">Dapat MBG</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-3 py-1 bg-gray-500/20 border border-gray-500/30 rounded-full">
                        <XCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-400">Belum</span>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span>{school.city}, {school.province}</span>
                  </div>

                  {/* Priority Score */}
                  <div className={`p-3 rounded-lg border ${getPriorityBgColor(school.priority_score)} mb-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">Priority Score:</span>
                      <span className={`text-lg font-bold ${getPriorityColor(school.priority_score)}`}>
                        {school.priority_score.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${school.priority_score}%`,
                          backgroundColor: school.priority_score >= 80 ? '#ef4444' :
                                          school.priority_score >= 60 ? '#f59e0b' :
                                          school.priority_score >= 40 ? '#fbbf24' : '#22c55e'
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-300 mt-1">
                      Prioritas: <span className={`font-semibold ${getPriorityColor(school.priority_score)}`}>
                        {getPriorityLabel(school.priority_score)}
                      </span>
                    </p>
                  </div>

                  {/* MBG Details */}
                  {school.has_mbg && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="space-y-1 text-sm">
                        {school.catering_name && (
                          <p className="text-gray-200">
                            <strong className="text-white">Katering:</strong> {school.catering_name}
                          </p>
                        )}
                        {school.portions_per_day && (
                          <p className="text-gray-200">
                            <strong className="text-white">Porsi/hari:</strong> {school.portions_per_day}
                          </p>
                        )}
                        {school.last_verified && (
                          <p className="text-gray-200">
                            <strong className="text-white">Terakhir verifikasi:</strong> {new Date(school.last_verified).toLocaleDateString('id-ID')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center">
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
