'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronDown
} from 'lucide-react';

export default function PriorityMapPage() {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const heroRef = useRef(null);
  const mapRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const mapInView = useInView(mapRef, { once: true, margin: "-100px" });

  // daftar wilayah untuk filter
  const regions = [
    'Jakarta Utara',
    'Bandung Barat',
    'Surabaya Timur',
    'Makassar Selatan',
    'Yogyakarta Pusat'
  ];

  // daftar kategori untuk filter
  const categories = [
    'Prioritas Tinggi',
    'Prioritas Sedang',
    'Prioritas Rendah',
    'Semua Kategori'
  ];

  // toggle region selection
  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter(r => r !== region));
    } else {
      setSelectedRegions([...selectedRegions, region]);
    }
  };

  // variasi animasi
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        duration: 0.6,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* navbar */}
      <motion.nav
        className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-md"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <span className="text-white font-bold text-lg">M</span>
              </motion.div>
              <motion.span
                className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
                whileHover={{ scale: 1.02 }}
              >
                MBG
              </motion.span>
            </Link>

            {/* menu navigasi */}
            <div className="flex items-center gap-6">
              <Link
                href="/priority-map"
                className="text-gray-700 hover:text-purple-600 transition-colors font-medium relative group"
              >
                Priority Map
                <motion.span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 to-blue-600" />
              </Link>
              <Link
                href="/school-list"
                className="text-gray-700 hover:text-purple-600 transition-colors font-medium relative group"
              >
                School List
                <motion.span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/transparansi"
                className="text-gray-700 hover:text-purple-600 transition-colors font-medium relative group"
              >
                Transparency Dashboard
                <motion.span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600 group-hover:w-full transition-all duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* hero section */}
      <motion.section
        ref={heroRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        initial="hidden"
        animate={heroInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Peta Prioritas Sekolah
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Jelajahi skor prioritas sekolah yang dihasilkan AI dan alokasi dana yang diverifikasi blockchain di peta interaktif. Gunakan filter untuk menemukan informasi spesifik dengan mudah.
          </p>
        </motion.div>
      </motion.section>

      {/* map section */}
      <motion.section
        ref={mapRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
        initial="hidden"
        animate={mapInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* filter sidebar */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Kontrol & Legenda Peta
              </h2>

              {/* filter berdasarkan wilayah */}
              <div className="mb-6">
                <button
                  onClick={() => {/* toggle wilayah filter */}}
                  className="w-full flex items-center justify-between text-left font-semibold text-gray-900 mb-3"
                >
                  <span>Filter Berdasarkan Wilayah</span>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>

                <div className="space-y-3">
                  {regions.map((region) => (
                    <label
                      key={region}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedRegions.includes(region)}
                          onChange={() => toggleRegion(region)}
                          className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </div>
                      <span className="text-gray-700 group-hover:text-purple-600 transition-colors">
                        {region}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* filter berdasarkan kategori */}
              <div>
                <button
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  className="w-full flex items-center justify-between text-left font-semibold text-gray-900 mb-3"
                >
                  <span>Filter Berdasarkan Kategori</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
                </button>

                {categoryOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                          selectedCategory === category
                            ? 'bg-purple-100 text-purple-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* map container */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[600px] relative">
              {/* header peta */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-white/95 backdrop-blur-md px-6 py-3 rounded-lg shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900">
                    Peta Interaktif Sekolah
                  </h3>
                </div>
              </div>

              {/* TODO: implementasi peta interaktif dengan library seperti Leaflet atau Mapbox */}
              {/* untuk sekarang menggunakan placeholder */}
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 relative">
                {/* ilustrasi peta sederhana */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-white rounded-full shadow-lg mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">
                      Peta Interaktif Indonesia
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Menampilkan {selectedRegions.length > 0 ? selectedRegions.length : 'semua'} wilayah
                    </p>
                  </div>
                </div>

                {/* marker sekolah simulasi */}
                <motion.div
                  className="absolute top-1/4 left-1/3 w-3 h-3 bg-red-500 rounded-full shadow-lg"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute top-1/2 left-1/2 w-3 h-3 bg-green-500 rounded-full shadow-lg"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
                <motion.div
                  className="absolute top-2/3 left-2/3 w-3 h-3 bg-blue-500 rounded-full shadow-lg"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                />
              </div>

              {/* legend */}
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md p-4 rounded-lg shadow-lg">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Legenda</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-gray-700">Prioritas Tinggi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-700">Prioritas Sedang</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-700">Prioritas Rendah</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* tentang kami */}
            <div>
              <h3 className="text-lg font-bold mb-4">Tentang Kami</h3>
              <p className="text-sm text-gray-400 mb-4">
                Enhancing accountability and transparency in education.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* sumber daya */}
            <div>
              <h3 className="text-lg font-bold mb-4">Sumber Daya</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Misi Kami
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Tim
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Kontak
                  </Link>
                </li>
              </ul>
            </div>

            {/* sumber daya 2 */}
            <div>
              <h3 className="text-lg font-bold mb-4">Sumber Daya</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Dokumentasi
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Dukungan
                  </Link>
                </li>
              </ul>
            </div>

            {/* hukum */}
            <div>
              <h3 className="text-lg font-bold mb-4">Hukum</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Kebijakan Privasi
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Ketentuan Layanan
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-gray-400 text-sm">
              © 2025 MBG Transparency Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
