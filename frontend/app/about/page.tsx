'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import Navbar from '../components/layout/Navbar';

export default function AboutPage() {
  const heroRef = useRef(null);
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const section3Ref = useRef(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const section1InView = useInView(section1Ref, { once: true, amount: 0.3 });
  const section2InView = useInView(section2Ref, { once: true, amount: 0.2 });
  const section3InView = useInView(section3Ref, { once: true, amount: 0.2 });

  const { scrollY } = useScroll();
  const heroImageY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroImageOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar role="public" />

      {/* hero section */}
      <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
              className="space-y-6"
            >
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                Tentang MBG: Makan Bergizi Ga Bocor
              </motion.h1>
              <motion.p
                className="text-lg text-gray-600 leading-relaxed text-justify"
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Platform transparansi berbasis blockchain yang menghubungkan pemerintah, sekolah, katering,
                dan masyarakat dalam ekosistem distribusi Program Makan Bergizi Gratis yang akuntabel dan
                bebas kebocoran.
              </motion.p>
            </motion.div>

            <motion.div
              className="relative"
              style={{ y: heroImageY, opacity: heroImageOpacity }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/aesthetic view 4.jpg"
                  alt="MBG Platform"
                  className="w-full h-[400px] md:h-[500px] object-cover transform hover:scale-105 transition-transform duration-700"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent" />
              </div>
              <motion.div
                className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full blur-3xl opacity-50"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* section 2: hasil analisis dengan grafik */}
      <section ref={section2Ref} className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={section2InView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
              Mengapa Kami Hadir?
            </h2>

            <div className="max-w-5xl mx-auto mb-16">
              <motion.div
                className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={section2InView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8 }}
              >
                <p className="text-gray-700 text-lg leading-relaxed text-justify mb-6">
                  Setelah menganalisis ribuan feedback masyarakat tentang Program Makan Bergizi Gratis menggunakan
                  teknologi AI, kami menemukan pola mengkhawatirkan: kata-kata seperti <span className="font-semibold text-red-600">"racun"</span>,
                  <span className="font-semibold text-red-600">"keracunan"</span>, <span className="font-semibold text-orange-600">"masalah"</span>,
                  dan <span className="font-semibold text-orange-600">"tahan"</span> muncul secara signifikan dalam diskusi publik.
                </p>
                <p className="text-gray-700 text-lg leading-relaxed text-justify mb-6">
                  Temuan ini mengungkapkan realita yang memprihatinkan: meskipun program bernilai triliunan rupiah
                  telah berjalan, masih banyak titik kebocoran dalam rantai distribusi—mulai dari alokasi dana yang
                  tidak tepat sasaran, kualitas makanan yang tidak terjamin, hingga transparansi yang minim sehingga
                  sulit melacak kemana dana benar-benar mengalir.
                </p>
                <p className="text-gray-700 text-lg leading-relaxed text-justify">
                  Dari situlah <span className="font-bold text-purple-600">Makan Bergizi Ga Bocor</span> lahir—sebuah platform
                  berbasis AI dan blockchain yang dirancang khusus untuk menutup celah-celah tersebut, memastikan setiap
                  rupiah dana publik tersalur dengan benar dan setiap siswa mendapatkan makanan bergizi yang layak mereka terima.
                </p>
              </motion.div>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              Monitoring dan Analisis Feedback Masyarakat
            </h3>
            <p className="text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              Kami telah melakukan monitoring dan analisis feedback masyarakat menggunakan Support Vector Machine (SVM)
              untuk memahami respons dan persepsi terhadap Program Makan Bergizi Gratis melalui data komentar media sosial
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: -30 }}
                animate={section2InView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Feedback Buruk yang Perlu Diperhatikan</h3>
                  <p className="text-gray-700 leading-relaxed text-justify">
                    Hasil analisis menunjukkan masih terdapat feedback buruk yang menurunkan keefektifan
                    Program Makan Bergizi Gratis. Masyarakat melaporkan berbagai isu krusial terkait
                    kualitas makanan, distribusi yang tidak merata, dan masalah kesehatan yang timbul
                    dari implementasi program.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-2xl border-l-4 border-orange-500">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Indikasi Kebocoran dan Distribusi Buruk</h3>
                  <p className="text-gray-700 leading-relaxed text-justify">
                    Kata-kata seperti "racun", "keracunan", "tahan", dan "masalah" muncul secara signifikan
                    dalam feedback masyarakat. Hal ini menggambarkan bahwa masih banyak program Makan Bergizi
                    Gratis yang bocor atau tidak tersalurkan dengan baik ke sasaran yang tepat, mengindikasikan
                    perlunya peningkatan pengawasan dan transparansi dalam distribusi.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-2xl border-l-4 border-yellow-600">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Urgensi Sistem Blockchain</h3>
                  <p className="text-gray-700 leading-relaxed text-justify">
                    Feedback negatif ini memperkuat urgensi implementasi platform berbasis blockchain untuk
                    memastikan setiap tahap distribusi tercatat transparan, mengurangi kebocoran, dan
                    meningkatkan akuntabilitas seluruh stakeholder dalam ekosistem MBG.
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100"
                initial={{ opacity: 0, x: 30 }}
                animate={section2InView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <img
                  src="/output-comment-analysis-1.png"
                  alt="Grafik Perbandingan Akurasi Kernel SVM"
                  className="w-full h-auto rounded-lg"
                  loading="lazy"
                />
                <p className="text-gray-600 text-sm text-center mt-4">
                  Perbandingan akurasi berbagai kernel SVM dalam analisis sentimen feedback masyarakat
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* section 3: wordcloud */}
      <section ref={section3Ref} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={section3InView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
              Visualisasi Kata Kunci Feedback Masyarakat
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              Word Cloud menampilkan kata-kata yang paling sering dibicarakan masyarakat, termasuk
              kata-kata krusial yang mengindikasikan masalah dalam distribusi program
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                className="space-y-6 order-2 lg:order-1"
                initial={{ opacity: 0, x: -30 }}
                animate={section3InView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl border-l-4 border-red-500">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Kata-kata Krusial yang Muncul</h3>
                  <p className="text-gray-600 leading-relaxed text-justify mb-4">
                    Analisis word cloud menunjukkan kemunculan kata-kata seperti <span className="font-bold text-red-600">"racun"</span>,{' '}
                    <span className="font-bold text-red-600">"keracunan"</span>, <span className="font-bold text-orange-600">"tahan"</span>, dan{' '}
                    <span className="font-bold text-orange-600">"masalah"</span> yang mengindikasikan
                    isu-isu serius dalam pelaksanaan program MBG.
                  </p>
                  <p className="text-gray-600 leading-relaxed text-justify">
                    Kemunculan kata-kata negatif ini secara signifikan dalam diskusi publik menunjukkan
                    bahwa masyarakat mengalami dan melaporkan masalah nyata terkait kualitas dan
                    keamanan makanan yang disalurkan.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-2xl border-l-4 border-orange-500">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Indikasi Kebocoran Distribusi</h3>
                  <p className="text-gray-600 leading-relaxed text-justify">
                    Kata-kata ini menggambarkan bahwa masih banyak program Makan Bergizi Gratis yang
                    bocor atau tidak tersalurkan dengan baik ke sasaran yang tepat. Hal ini mengindikasikan
                    adanya celah dalam rantai distribusi, mulai dari vendor katering hingga penerima akhir,
                    yang menyebabkan penurunan kualitas makanan atau bahkan kasus keracunan.
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 order-1 lg:order-2"
                initial={{ opacity: 0, x: 30 }}
                animate={section3InView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <img
                  src="/output-wordcloud.png"
                  alt="Word Cloud Analisis Sentimen"
                  className="w-full h-auto rounded-lg"
                  loading="lazy"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* section platform solution */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Disinilah Platform Makan Bergizi Ga Bocor Hadir
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Solusi komprehensif berbasis teknologi untuk memastikan transparansi dan akuntabilitas
              dalam setiap tahap distribusi Program Makan Bergizi Gratis
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="relative order-2 lg:order-1"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative rounded-3xl overflow-hidden">
                <img
                  src="/aesthetic view 5.jpg"
                  alt="Platform MBG"
                  className="w-full h-[400px] md:h-[500px] object-cover transform hover:scale-105 transition-transform duration-700 rounded-3xl shadow-2xl"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent rounded-3xl" />
              </div>
            </motion.div>

            <motion.div
              className="space-y-6 order-1 lg:order-2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <p className="text-gray-700 text-lg leading-relaxed text-justify">
                <span className="font-bold text-blue-600">Blockchain untuk Transparansi:</span> Setiap transaksi tercatat permanen, mencegah manipulasi data dan memastikan audit trail yang jelas dari pemerintah hingga siswa.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed text-justify">
                <span className="font-bold text-purple-600">AI untuk Analisis & Deteksi:</span> Sistem AI menganalisis pola distribusi, mendeteksi anomali, dan mengidentifikasi potensi penyalahgunaan dana.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed text-justify">
                <span className="font-bold text-green-600">QR Code untuk Verifikasi:</span> Memastikan makanan benar-benar diterima siswa dengan rekaman digital dan timestamp yang akurat, mencegah pengalihan dana.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed text-justify">
                <span className="font-bold text-orange-600">Smart Contract Escrow:</span> Dana terkunci dan tercairkan otomatis hanya ketika semua kondisi terpenuhi, menghilangkan risiko korupsi.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed text-justify">
                <span className="font-bold text-red-600">Real-time Monitoring:</span> Dashboard live memberikan visibilitas penuh kepada semua stakeholder untuk memantau distribusi kapan saja dan dari mana saja.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed text-justify">
                <span className="font-bold text-teal-600">Partisipasi Masyarakat:</span> Platform terbuka memungkinkan masyarakat melaporkan masalah dan mengawasi jalannya program sebagai kontrol sosial yang efektif.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* section 1: siapa saja yang terlibat */}
      <section ref={section1Ref} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={section1InView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Siapa Saja yang Terlibat?
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Platform MBG menghubungkan berbagai stakeholder dalam ekosistem distribusi
              Program Makan Bergizi Gratis yang transparan dan akuntabel
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <motion.div
              className="bg-transparent p-8 rounded-2xl text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={section1InView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1, duration: 0.8 }}
            >
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pemerintah</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Mengalokasikan dan memantau distribusi dana program secara real-time melalui blockchain
              </p>
            </motion.div>

            <motion.div
              className="bg-transparent p-8 rounded-2xl text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={section1InView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sekolah</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Menerima dan melaporkan distribusi makanan kepada siswa dengan sistem verifikasi QR code
              </p>
            </motion.div>

            <motion.div
              className="bg-transparent p-8 rounded-2xl text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={section1InView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Katering</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Menyediakan makanan bergizi dan menerima pembayaran otomatis melalui smart contract
              </p>
            </motion.div>

            <motion.div
              className="bg-transparent p-8 rounded-2xl text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={section1InView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Masyarakat</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Memantau transparansi alokasi dan distribusi dana program secara terbuka dan real-time
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="relative order-2 lg:order-1"
              initial={{ opacity: 0, x: -30 }}
              animate={section1InView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/kebun teh.jpg"
                  alt="Kolaborasi MBG"
                  className="w-full h-[400px] md:h-[500px] object-cover transform hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            </motion.div>

            <motion.div
              className="space-y-6 order-1 lg:order-2"
              initial={{ opacity: 0, x: 30 }}
              animate={section1InView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Ekosistem Kolaboratif
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed text-justify">
                MBG menciptakan ekosistem di mana semua pihak bekerja sama dalam transparansi penuh.
                Teknologi blockchain memastikan setiap transaksi tercatat permanen dan dapat diaudit
                oleh siapa saja, menciptakan kepercayaan dan akuntabilitas di semua tingkatan.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed text-justify">
                Smart contract otomatis mengatur alur dana dari pemerintah ke katering dan sekolah,
                menghilangkan perantara yang tidak perlu dan memastikan tidak ada kebocoran anggaran.
                Sistem verifikasi QR code memberikan bukti digital bahwa makanan benar-benar sampai
                ke siswa yang berhak menerimanya.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* section transparansi dan komunikasi */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Komunikasi Terbuka dan Transparan
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed text-justify">
                Platform MBG memfasilitasi komunikasi langsung antara semua stakeholder. Sekolah dapat
                melaporkan isu atau masalah terkait distribusi makanan, katering dapat memberikan update
                menu dan status pengiriman, sementara masyarakat dapat memberikan feedback dan memantau
                perkembangan program secara real-time.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Notifikasi Real-time</h3>
                    <p className="text-gray-600 text-sm">
                      Setiap transaksi dan aktivitas langsung ternotifikasi ke pihak terkait
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Data Terenkripsi</h3>
                    <p className="text-gray-600 text-sm">
                      Semua komunikasi dan data dilindungi dengan enkripsi tingkat tinggi
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Laporan Terdokumentasi</h3>
                    <p className="text-gray-600 text-sm">
                      Setiap laporan dan isu tercatat permanen dalam blockchain
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="rounded-3xl p-12 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 1189.44 803.963" version="1.1" viewBox="0 0 1189.4 803.96" className="w-full max-w-md h-auto">
                  <path d="m652.64 66.124h-151.63c-13.019 0-23.658 10.658-23.658 23.678v1.935c0 13.021 10.64 23.667 23.658 23.667h151.63c13.031 0 23.673-10.645 23.673-23.667v-1.935c0-13.02-10.642-23.678-23.673-23.678z" fill="#D0DCE5"/>
                  <path d="m743.3 161.98h-235.4c-13.548 0-24.654 11.084-24.654 24.637 0 13.55 11.105 24.651 24.654 24.651h235.4c13.569 0 24.636-11.101 24.636-24.651 0-13.553-11.067-24.637-24.636-24.637z" fill="#D0DCE5"/>
                  <path d="m836.78 161.98h-37.946c-13.087 0-23.796 10.708-23.796 23.797v1.695c0 13.086 10.709 23.795 23.796 23.795h37.946c13.089 0 23.796-10.709 23.796-23.795v-1.695c0-13.089-10.707-23.797-23.796-23.797z" fill="#D0DCE5"/>
                  <path d="m625 114.08h-119.21c12.008 0 21.826 9.816 21.826 21.825v5.617c0 12.012-9.817 21.845-21.826 21.845h119.21c-11.99 0-21.825-9.833-21.825-21.845v-5.617c0-12.008 9.835-21.825 21.825-21.825z" fill="#D0DCE5"/>
                  <rect x="815.01" y="628.66" width="90.013" height="13.555" fill="#4D4D4D"/>
                  <rect x="864.33" y="661.09" width="116.85" height="13.564" fill="#4D4D4D"/>
                  <polygon points="1092.4 222.43 1141.6 238.72 1081.4 302.9 853.73 392.43" fill="#fff"/>
                  <polygon points="1079.5 231.59 1078 221.26 853.73 392.43" fill="#50BFD8"/>
                  <polygon points="1078 221.26 1024.4 208.28 946.4 258.86 853.73 392.43" fill="#fff"/>
                  <polygon points="1080.5 303.02 1098.1 285.42 1102.6 322.55 853.73 392.43" fill="#50BFD8"/>
                  <path d="m687.66 199.96v82.109c38.24 2.655 68.555 34.618 68.495 73.521-0.02 8.629-1.529 16.917-4.283 24.619l5.467 1.711 73.324 21.303c4.825-14.988 7.54-30.959 7.563-47.552 0.084-84.314-66.882-152.98-150.57-155.71z" fill="#B2E2EF"/>
                  <path d="m679.45 199.9c-41.681 0.827-79.233 18.003-106.71 45.401l58.777 57.228c12.549-12.088 29.347-19.793 47.935-20.558v-82.071z" fill="#fff"/>
                  <path d="m679.45 429.06c-39.227-1.641-70.606-34.048-70.586-73.634 0.041-17.831 6.42-34.195 17.02-46.929l-58.879-57.348c-24.942 27.58-40.13 64.087-40.188 104.18-0.083 85.007 67.968 154.14 152.63 155.77v-82.035z" fill="#F69070"/>
                  <path d="m748.59 387.91c-11.305 22.941-34.157 39.191-60.933 41.044v82.146c64.19-2.089 118.54-43.033 140.3-100.11l-79.372-23.081z" fill="#FFDB77"/>
                  <rect x="144.27" y="98.547" width="402.04" height="531.67" fill="#fff"/>
                  <rect x="144.27" y="556" width="402.04" height="4.85" fill="#B2E2EF"/>
                  <polygon points="546.31 548 144.27 548 144.27 469.61 171.67 494.33 210.65 479.31 238.79 487.93 291.19 429.86 336.65 459.01 360.57 437.8 397.7 454.46 461.99 404.26 497.74 420.58 546.31 369.8" fill="#FFDB77"/>
                  <polygon points="546.31 548 144.27 548 144.27 523.48 172.97 510.23 209.34 487.27 239.23 498.75 290.53 474.01 332.75 488.14 360.57 464.72 393.15 497.86 454.22 458.88 498.05 441.51 546.31 466.06" fill="#B2E2EF"/>
                  <polygon points="546.31 548 144.27 548 144.27 529.65 170.38 535.41 209.34 512.87 239.9 512.42 287.95 494.75 334.7 518.63 356.97 479.31 393.15 508.45 454.87 492.56 497.74 471.36 546.31 484.31" fill="#F69070"/>
                  <rect x="188.99" y="253.91" width="92.104" height="5.451" fill="#F69070"/>
                  <rect x="188.99" y="241.43" width="306.61" height="5.461" fill="#F69070"/>
                  <rect x="188.99" y="228.95" width="306.61" height="5.462" fill="#F69070"/>
                  <rect x="188.99" y="216.5" width="306.61" height="5.433" fill="#F69070"/>
                  <rect x="188.99" y="385.42" width="193.26" height="5.451" fill="#F69070"/>
                  <rect x="188.99" y="372.95" width="306.61" height="5.44" fill="#F69070"/>
                  <rect x="188.99" y="360.48" width="306.61" height="5.451" fill="#F69070"/>
                  <rect x="188.99" y="317" width="112.18" height="5.44" fill="#F69070"/>
                  <rect x="188.99" y="304.52" width="306.61" height="5.462" fill="#F69070"/>
                  <rect x="188.99" y="292.07" width="306.61" height="5.411" fill="#F69070"/>
                  <rect x="294.03" y="158.93" width="96.552" height="13.214" fill="#B2E2EF"/>
                  <rect x="196.19" y="589.58" width="74.488" height="7.978" fill="#F69070"/>
                  <rect x="169.86" y="585.61" width="15.95" height="15.942" fill="#FFDB77"/>
                  <rect x="321.22" y="589.58" width="74.444" height="7.978" fill="#F69070"/>
                  <rect x="294.87" y="585.61" width="15.933" height="15.942" fill="#B2E2EF"/>
                  <rect x="445.23" y="589.31" width="74.506" height="7.985" fill="#F69070"/>
                  <rect x="418.92" y="585.34" width="15.934" height="15.941" fill="#F69070"/>
                  <path d="m286.75 703.04v12.512c0 6.905 5.45 12.489 12.208 12.489h479.18c6.759 0 12.211-5.584 12.211-12.489v-12.512h-503.6z" fill="#fff"/>
                  <path d="m767.05 703.04v-264.37c0-14.686-11.646-26.633-26.005-26.633h-404.98c-14.381 0-26.049 11.947-26.049 26.633v264.37" fill="#686969"/>
                  <rect x="332.73" y="437.28" width="411.64" height="245.33" fill="#E6E6E5"/>
                  <path d="m545.26 424.78c0 3.81-2.996 6.887-6.718 6.887-3.699 0-6.717-3.077-6.717-6.887 0-3.793 3.018-6.872 6.717-6.872 3.722 0 6.718 3.079 6.718 6.872z" fill="#fff"/>
                  <rect x="332.73" y="437.28" width="411.64" height="20.601" fill="#BBC0C4"/>
                  <path d="m352.36 447.58c0 3.097-2.453 5.631-5.489 5.631-3.041 0-5.513-2.534-5.513-5.631 0-3.116 2.472-5.649 5.513-5.649 3.036 0 5.489 2.533 5.489 5.649z" fill="#F69070"/>
                  <path d="m371.47 447.58c0 3.097-2.453 5.631-5.511 5.631-3.037 0-5.511-2.534-5.511-5.631 0-3.116 2.474-5.649 5.511-5.649 3.058 0 5.511 2.533 5.511 5.649z" fill="#FFDB77"/>
                  <path d="m390.54 447.58c0 3.097-2.453 5.631-5.473 5.631-3.056 0-5.532-2.534-5.532-5.631 0-3.116 2.476-5.649 5.532-5.649 3.02 0 5.473 2.533 5.473 5.649z" fill="#B2E2EF"/>
                  <path d="m844.59 704.75h-104c-9.419 0-17.125-7.709-17.125-17.118 0-9.42 7.706-17.126 17.125-17.126h104c9.418 0 17.116 7.706 17.116 17.126 0 9.409-7.698 17.118-17.116 17.118z" fill="#D0DCE5"/>
                  <path d="m912.97 771.35h-180.48c-9.412 0-17.117-7.707-17.117-17.127 0-9.413 7.705-17.122 17.117-17.122h180.48c9.421 0 17.118 7.709 17.118 17.122 1e-3 9.42-7.696 17.127-17.117 17.127z" fill="#D0DCE5"/>
                  <path d="m810.01 722.89v-3.896c0-8.348 6.826-15.173 15.169-15.173h-82.833c8.345 0 15.17 6.825 15.17 15.173v3.896c0 8.349-6.825 15.175-15.17 15.175h82.833c-8.343-1e-3 -15.169-6.827-15.169-15.175z" fill="#D0DCE5"/>
                  <path d="m731.15 447.58 3.982-4.103c0.582-0.564 0.582-1.521 0-2.125-0.563-0.581-1.51-0.581-2.093 0l-3.982 4.095-3.981-4.095c-0.588-0.581-1.508-0.581-2.093 0-0.583 0.604-0.583 1.561 0 2.125l4.001 4.103-4.001 4.081c-0.583 0.573-0.583 1.55 0 2.135 0.585 0.604 1.505 0.604 2.093 0l3.981-4.082 3.982 4.082c0.583 0.604 1.529 0.604 2.093 0 0.582-0.585 0.582-1.562 0-2.135l-3.982-4.081z" fill="#333"/>
                  <path d="m700.33 604.79c0 3.553-2.896 6.422-6.435 6.422h-203.97c-3.561 0-6.417-2.869-6.417-6.422v-128.54c0-3.537 2.857-6.416 6.417-6.416h203.97c3.539 0 6.435 2.879 6.435 6.416v128.54z" fill="#D9DEE6"/>
                  <path d="m700.33 604.79c0 3.553-2.896 6.422-6.435 6.422h-203.97c-3.561 0-6.417-2.869-6.417-6.422v-128.54c0-3.537 2.857-6.416 6.417-6.416h203.97c3.539 0 6.435 2.879 6.435 6.416v128.54z" fill="#333"/>
                  <path d="m489.93 469.83c-3.561 0-6.435 2.879-6.435 6.416v10.038l16.474-16.454h-10.039z" fill="none"/>
                  <polygon points="537.88 469.83 483.49 524.22 483.49 538.44 552.12 469.83" fill="none"/>
                  <polygon points="541.14 611.21 682.53 469.83 668.29 469.83 526.9 611.21" fill="none"/>
                  <polygon points="511.83 469.83 483.49 498.13 483.49 512.37 526.03 469.83" fill="none"/>
                  <polygon points="656.44 469.83 642.2 469.83 500.83 611.21 515.07 611.21" fill="none"/>
                  <polygon points="619.37 611.21 700.33 530.25 700.33 516.03 605.15 611.21" fill="none"/>
                  <path d="m567.21 611.21 133.12-133.09v-1.874c0-3.376-2.655-6.146-5.996-6.372l-141.35 141.34h14.219z" fill="none"/>
                  <polygon points="671.53 611.21 700.33 582.43 700.33 568.19 657.3 611.21" fill="none"/>
                  <path d="m616.13 469.83-132.64 132.64v2.322c0 3.25 2.432 5.914 5.59 6.336l141.27-141.3h-14.221z" fill="none"/>
                  <path d="m693.9 611.21c3.539 0 6.435-2.869 6.435-6.422v-10.509l-16.936 16.931h10.501z" fill="none"/>
                  <polygon points="645.46 611.21 700.33 556.34 700.33 542.12 631.22 611.21" fill="none"/>
                  <polygon points="590.04 469.83 483.49 576.39 483.49 590.6 604.28 469.83" fill="none"/>
                  <polygon points="563.97 469.83 483.49 550.31 483.49 564.53 578.19 469.83" fill="none"/>
                  <polygon points="593.3 611.21 700.33 504.18 700.33 489.96 579.06 611.21" fill="none"/>
                  <polygon points="499.97 469.83 483.49 486.28 483.49 498.13 511.83 469.83" fill="#F69070"/>
                  <polygon points="526.03 469.83 483.49 512.37 483.49 524.22 537.88 469.83" fill="#B2E2EF"/>
                  <polygon points="552.12 469.83 483.49 538.44 483.49 550.31 563.97 469.83" fill="#F69070"/>
                  <polygon points="578.19 469.83 483.49 564.53 483.49 576.39 590.04 469.83" fill="#B2E2EF"/>
                  <polygon points="604.28 469.83 483.49 590.6 483.49 602.46 616.13 469.83" fill="#F69070"/>
                  <path d="m630.35 469.83-141.27 141.3c0.261 0.051 0.544 0.086 0.845 0.086h10.901l141.37-141.38h-11.846z" fill="#B2E2EF"/>
                  <polygon points="526.9 611.21 668.29 469.83 656.44 469.83 515.07 611.21" fill="#F69070"/>
                  <path d="m552.99 611.21 141.35-141.34c-0.164-0.024-0.303-0.044-0.439-0.044h-11.369l-141.39 141.38h11.846z" fill="#B2E2EF"/>
                  <polygon points="579.06 611.21 700.33 489.96 700.33 478.12 567.21 611.21" fill="#F69070"/>
                  <polygon points="605.15 611.21 700.33 516.03 700.33 504.18 593.3 611.21" fill="#B2E2EF"/>
                  <polygon points="631.22 611.21 700.33 542.12 700.33 530.25 619.37 611.21" fill="#F69070"/>
                  <polygon points="657.3 611.21 700.33 568.19 700.33 556.34 645.46 611.21" fill="#B2E2EF"/>
                  <polygon points="683.4 611.21 700.33 594.28 700.33 582.43 671.53 611.21" fill="#F69070"/>
                  <rect x="492.76" y="478.17" width="198.3" height="124.69" fill="#fff"/>
                  <rect x="505.92" y="489.96" width="51.032" height="22.406" fill="#BBC0C4"/>
                  <rect x="639.68" y="485.14" width="42.846" height="49.864" fill="#F3F3F3"/>
                  <rect x="372.39" y="536.21" width="214.73" height="129.68" fill="#fff"/>
                  <polygon points="480.35 598.22 372.39 665.89 372.39 536.21" fill="#F3F3F3"/>
                  <polygon points="479.19 598.22 587.12 665.89 587.12 536.21" fill="#F3F3F3"/>
                  <polygon points="480.21 617.92 372.39 536.21 587.12 536.21" fill="#BBC0C4"/>
                  <polygon points="480.15 597.08 372.39 536.21 587.12 536.21" fill="#fff"/>
                  <path d="m670.18 529.76c-31.723 0-61.533-12.339-83.979-34.758-46.287-46.314-46.287-121.64 0-167.95 22.446-22.426 52.256-34.758 83.979-34.758 31.703 0 61.53 12.332 83.942 34.758 22.431 22.449 34.776 52.26 34.776 83.96 0 31.733-12.346 61.536-34.776 83.993-22.412 22.419-52.239 34.758-83.942 34.758zm0-206.44c-23.431 0-45.479 9.124-62.018 25.667-34.213 34.204-34.213 89.862 0 124.06 16.539 16.575 38.587 25.688 62.018 25.688 23.437 0 45.461-9.112 62.016-25.688 16.576-16.558 25.685-38.579 25.685-62.037 0-23.413-9.108-45.448-25.685-62.022-16.554-16.545-38.579-25.668-62.016-25.668z" fill="#A3A3A2"/>
                  <g opacity=".4">
                    <path d="m734.29 346.88c35.401 35.433 35.401 92.842 0 128.26-35.422 35.415-92.832 35.415-128.26 0-35.402-35.422-35.402-92.831 0-128.26 35.423-35.404 92.833-35.404 128.26 0z" fill="#CCCBC9"/>
                  </g>
                  <g opacity=".2">
                    <path d="m662.7 320.65c20.616 1.711 40.813 10.439 56.604 26.231 35.404 35.433 35.404 92.842 0 128.26-15.79 15.799-35.988 24.551-56.604 26.22 25.604 2.115 51.997-6.599 71.59-26.22 35.401-35.422 35.401-92.831 0-128.26-19.593-19.612-45.986-28.342-71.59-26.231z" fill="#333"/>
                  </g>
                  <path d="m603.22 400.18c-0.885 0-1.791-0.129-2.698-0.396-4.909-1.489-7.703-6.686-6.216-11.602 0.705-2.315 1.512-4.597 2.414-6.841 6.239-15.427 16.938-28.292 30.978-37.184 4.324-2.765 10.077-1.459 12.853 2.889 2.74 4.332 1.449 10.076-2.878 12.831-10.738 6.781-18.909 16.637-23.692 28.442-0.683 1.73-1.328 3.461-1.851 5.242-1.207 4.01-4.909 6.619-8.91 6.619z" fill="#fff"/>
                  <path d="m612.25 459.46c-3.02 0-5.955-1.44-7.746-4.115-6.518-9.669-10.922-20.878-12.673-32.404-0.764-5.09 2.718-9.848 7.807-10.642 5.066-0.745 9.816 2.747 10.598 7.823 1.348 8.833 4.706 17.41 9.719 24.825 2.856 4.264 1.729 10.057-2.535 12.932-1.594 1.068-3.399 1.581-5.17 1.581z" fill="#fff"/>
                  <polygon points="880.22 643 732.2 495 754.12 473.04 902.15 621.07" fill="#A3A3A2"/>
                  <path d="m797.59 521.36h60.736c11.771 0 21.396 9.633 21.396 21.394v161.26c0 11.763-9.625 21.384-21.396 21.384h-60.736c-11.767 0-21.386-9.621-21.386-21.384v-161.26c0-11.761 9.619-21.394 21.386-21.394z" clipRule="evenodd" fill="#333237" fillRule="evenodd"/>
                  <path d="m785.61 538.48h84.703c0.162 0 0.302 0.13 0.302 0.303v167.5c0 0.164-0.14 0.298-0.302 0.298h-84.703c-0.166 0-0.301-0.134-0.301-0.298v-167.5c1e-3 -0.173 0.135-0.303 0.301-0.303z" clipRule="evenodd" fill="#fff" fillRule="evenodd"/>
                  <path d="m827.96 720.93c2.88 0 5.229-2.351 5.229-5.229 0-2.884-2.349-5.229-5.229-5.229s-5.227 2.345-5.227 5.229c0 2.878 2.347 5.229 5.227 5.229z" clipRule="evenodd" fill="#fff" fillRule="evenodd"/>
                  <g clipRule="evenodd" fillRule="evenodd" opacity=".5">
                    <path d="m843.29 564.6c0 8.462-6.856 15.327-15.328 15.327-8.458 0-15.327-6.865-15.327-15.327 0-8.467 6.869-15.327 15.327-15.327 8.472 0 15.328 6.861 15.328 15.327z" fill="#333"/>
                    <path d="m836.62 572.56v-0.055c0-2.093-0.753-4.02-1.999-5.518-1.883-0.777-4.184-1.231-6.661-1.231s-4.77 0.454-6.661 1.231c-1.246 1.498-1.997 3.425-1.997 5.518v0.055h17.318z" fill="#E1E5EB"/>
                    <path d="m832.12 560.82c0 2.305-1.863 4.175-4.167 4.175-2.302 0-4.166-1.87-4.166-4.175 0-2.301 1.864-4.171 4.166-4.171 2.304 0 4.167 1.871 4.167 4.171z" fill="#E1E5EB"/>
                  </g>
                  <rect x="792.75" y="585.11" width="54.286" height="12.188" clipRule="evenodd" fill="#E1E5EB" fillRule="evenodd"/>
                  <rect x="794.18" y="586.53" width="51.438" height="9.352" clipRule="evenodd" fill="#fff" fillRule="evenodd"/>
                  <rect x="847.99" y="585.11" width="15.171" height="12.188" clipRule="evenodd" fill="#E1E5EB" fillRule="evenodd"/>
                  <rect x="849.41" y="586.53" width="12.327" height="9.352" clipRule="evenodd" fill="#255DAB" fillRule="evenodd"/>
                  <path d="m857.42 589.84c0.15 1.6-1.025 3.022-2.628 3.172-1.6 0.151-3.023-1.016-3.176-2.62-0.156-1.6 1.024-3.031 2.622-3.182 1.607-0.152 3.029 1.021 3.182 2.63zm-4.666 0.44c0.096 0.979 0.953 1.686 1.929 1.596 0.974-0.095 1.692-0.958 1.597-1.932-0.093-0.97-0.958-1.688-1.936-1.594-0.965 0.093-1.681 0.96-1.59 1.93z" fill="#fff"/>
                  <path d="m859.54 594.58c0.021 0.163-0.036 0.337-0.167 0.461-0.228 0.223-0.593 0.22-0.813-8e-3l-2.6-2.646c-0.215-0.229-0.215-0.591 7e-3 -0.808 0.228-0.229 0.594-0.224 0.816 1e-3l2.598 2.646c0.094 0.102 0.145 0.221 0.159 0.354z" fill="#fff"/>
                  <path d="m811.01 629.19c6.196 0 11.252-5.055 11.252-11.244 0-6.2-5.056-11.253-11.252-11.253-6.199 0-11.247 5.053-11.247 11.253 0 6.19 5.047 11.244 11.247 11.244z" clipRule="evenodd" fill="#F69070" fillRule="evenodd"/>
                  <polygon points="818.03 615.03 811.01 620.08 804 615.03 811.01 609.96" clipRule="evenodd" fill="#CFCFCE" fillRule="evenodd"/>
                  <polygon points="804 623.31 818.03 623.31 818.03 615.03 811.01 620.08 804 615.03" clipRule="evenodd" fill="#EAE9E8" fillRule="evenodd"/>
                  <polygon points="804 623.31 818.03 623.31 812.29 619.17 809.73 619.17 809.73 619.17" clipRule="evenodd" fill="#FFFDFA" fillRule="evenodd"/>
                  <path d="m811.01 658.84c6.196 0 11.252-5.05 11.252-11.244 0-6.195-5.056-11.253-11.252-11.253-6.199 0-11.247 5.058-11.247 11.253 0 6.194 5.047 11.244 11.247 11.244z" clipRule="evenodd" fill="#B2E2EF" fillRule="evenodd"/>
                  <path d="m806.43 653.48c1.115 0 2.026-0.912 2.026-2.032v-7.529h6.527v3.749c-0.238-0.093-0.496-0.143-0.756-0.143-1.121 0-2.033 0.911-2.033 2.027 0 1.117 0.912 2.034 2.033 2.034 1.111 0 2.029-0.917 2.029-2.034v-8.183h-9.076v8.195c-0.228-0.089-0.479-0.149-0.75-0.149-1.12 0-2.026 0.914-2.026 2.032-1e-3 1.12 0.906 2.033 2.026 2.033z" fill="#FFFDFA"/>
                  <path d="m811.01 688.49c6.196 0 11.252-5.058 11.252-11.252 0-6.196-5.056-11.245-11.252-11.245-6.199 0-11.247 5.049-11.247 11.245 0 6.195 5.047 11.252 11.247 11.252z" clipRule="evenodd" fill="#F69070" fillRule="evenodd"/>
                  <path d="m813.92 683.5c-0.257 0.248-0.673 0.248-0.933 0l-0.234-0.242c-0.248-0.257-0.757-0.462-1.115-0.462h-5.121c-0.367 0-0.762-0.276-0.884-0.616l-2.169-6.015c-0.28-0.795 0.171-1.442 1.017-1.442h4.256c0.188-0.616 0.085-1.11-0.095-1.385-0.267-0.391-0.98-1.123-0.844-2.22 0.042-0.357 0.25-0.917 0.47-1.208 0.642-0.831 1.563-0.631 1.563 0.106 0 0.885-0.472 1.766 1.19 2.855 1.662 1.088 2.799 3.225 2.799 3.234 0 5e-3 0.207 0.22 0.466 0.48l2.81 2.804c0.249 0.259 0.249 0.677 0 0.933l-3.176 3.178z" fill="#fff"/>
                  <polygon points="817.78 680.48 814.02 684.25 814.89 685.11 818.65 681.34" fill="#fff"/>
                  <path d="m844.9 688.49c6.202 0 11.252-5.058 11.252-11.252 0-6.196-5.05-11.245-11.252-11.245-6.194 0-11.245 5.049-11.245 11.245 0 6.195 5.051 11.252 11.245 11.252z" clipRule="evenodd" fill="#FFDB77" fillRule="evenodd"/>
                  <path d="m851.69 680.48c0.202-0.658 0.31-1.337 0.31-2.036 0-3.904-3.187-7.096-7.099-7.118-3.911 0.022-7.09 3.214-7.09 7.118 0 0.699 0.098 1.39 0.298 2.05-0.093 0.058-0.148 0.152-0.148 0.259v0.383c0 0.179 0.143 0.319 0.316 0.319h0.783v0.692c0 0.815 0.956 1.473 2.145 1.486v-5.631c-1.039 0.013-1.898 0.515-2.099 1.183-0.028 0.091-0.046 0.191-0.046 0.306v0.943h-0.783c-0.059 0-0.115 0.017-0.168 0.06v-0.528c0-0.201 0.031-0.394 0.087-0.583 0.137-0.438 0.416-0.825 0.798-1.119v-4e-3c0.1-3.179 2.714-5.741 5.907-5.757 3.217 0.016 5.838 2.603 5.917 5.802 0.423 0.351 0.693 0.79 0.785 1.292 0.022 0.125 0.039 0.246 0.039 0.369v0.485c-0.03-7e-3 -0.073-0.017-0.101-0.017h-0.847v-0.943c0-0.067-8e-3 -0.133-0.021-0.188-0.137-0.723-1.009-1.267-2.086-1.301v5.624c1.17-0.026 2.107-0.675 2.107-1.479v-0.692h0.847c0.17 0 0.315-0.141 0.315-0.319v-0.383c1e-3 -0.116-0.064-0.224-0.166-0.273z" fill="#fff"/>
                  <path d="m844.9 606.7c-6.194 0-11.245 5.053-11.245 11.244 0 6.198 5.051 11.253 11.245 11.253 6.202 0 11.252-5.055 11.252-11.253 0-6.191-5.05-11.244-11.252-11.244z" clipRule="evenodd" fill="#2C7CB9" fillRule="evenodd"/>
                  <path d="m850.16 618.64v-6.075c0-0.437-0.357-0.8-0.801-0.8-0.437 0-0.797 0.363-0.797 0.8v6.075h1.598z" fill="#fff"/>
                  <path d="m848.56 620.67v2.651c0 0.444 0.36 0.802 0.797 0.802 0.443 0 0.801-0.357 0.801-0.802v-2.651h-1.598z" fill="#fff"/>
                  <path d="m850.44 620.3h-2.162c-0.365 0-0.66-0.296-0.66-0.66 0-0.366 0.295-0.659 0.66-0.659h2.162c0.369 0 0.667 0.293 0.667 0.659 0 0.364-0.297 0.66-0.667 0.66z" fill="#fff"/>
                  <path d="m845.73 615.06v-2.488c0-0.437-0.357-0.8-0.804-0.8-0.437 0-0.792 0.363-0.792 0.8v2.488h1.596z" fill="#fff"/>
                  <path d="m844.13 617.09v6.232c0 0.444 0.355 0.802 0.792 0.802 0.446 0 0.804-0.357 0.804-0.802v-6.232h-1.596z" fill="#fff"/>
                  <path d="m846.01 616.72h-2.171c-0.356 0-0.65-0.293-0.65-0.66 0-0.364 0.294-0.658 0.65-0.658h2.171c0.365 0 0.659 0.294 0.659 0.658 0 0.367-0.294 0.66-0.659 0.66z" fill="#fff"/>
                  <path d="m841.24 617.11c0-0.011 7e-3 -0.023 7e-3 -0.029v-4.516c0-0.437-0.357-0.8-0.794-0.8-0.454 0-0.808 0.363-0.808 0.8v4.545h1.595z" fill="#fff"/>
                  <path d="m839.65 619.14v4.183c0 0.444 0.354 0.802 0.808 0.802 0.437 0 0.794-0.357 0.794-0.802v-4.161c0-8e-3 -7e-3 -0.015-7e-3 -0.022h-1.595z" fill="#fff"/>
                  <path d="m841.54 618.76h-2.172c-0.363 0-0.656-0.299-0.656-0.657 0-0.364 0.293-0.665 0.656-0.665h2.172c0.355 0 0.658 0.301 0.658 0.665 0 0.358-0.302 0.657-0.658 0.657z" fill="#fff"/>
                  <path d="m844.9 658.84c6.202 0 11.252-5.05 11.252-11.244 0-6.195-5.05-11.253-11.252-11.253-6.194 0-11.245 5.058-11.245 11.253 0 6.194 5.051 11.244 11.245 11.244z" clipRule="evenodd" fill="#FFDB77" fillRule="evenodd"/>
                  <path d="m844.9 638.63c-4.95 0-8.959 4.015-8.959 8.967 0 4.95 4.009 8.965 8.959 8.965 4.957 0 8.968-4.015 8.968-8.965 0-4.952-4.011-8.967-8.968-8.967zm0 16.644c-4.239 0-7.678-3.438-7.678-7.678 0-4.242 3.438-7.678 7.678-7.678s7.679 3.436 7.679 7.678c0 4.241-3.438 7.678-7.679 7.678z" clipRule="evenodd" fill="#fff" fillRule="evenodd"/>
                  <path d="m844.9 643.01c-2.521 0-4.576 2.057-4.576 4.585 0 2.521 2.055 4.584 4.576 4.584 2.527 0 4.583-2.063 4.583-4.584 0-2.529-2.055-4.585-4.583-4.585z" clipRule="evenodd" fill="#fff" fillRule="evenodd"/>
                  <path d="m831.46 534.66h-6.994c-1.494 0-2.713-1.224-2.713-2.722 0-1.491 1.219-2.722 2.713-2.722h6.994c1.496 0 2.72 1.23 2.72 2.722 0 1.498-1.224 2.722-2.72 2.722z" clipRule="evenodd" fill="#CCCBC9" fillRule="evenodd"/>
                </svg>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* section kesimpulan */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Komitmen Kami untuk Transparansi
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed text-justify mb-8">
              Berdasarkan analisis sentimen menggunakan Support Vector Machine terhadap 343 komentar
              media sosial, mayoritas masyarakat memberikan respons positif terhadap Program Makan
              Bergizi Gratis. Kami di MBG berkomitmen untuk terus mendengarkan feedback masyarakat
              dan meningkatkan kualitas layanan.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="text-4xl font-bold text-purple-600 mb-2">100%</div>
                <p className="text-gray-900 font-semibold mb-1">Transparansi</p>
                <p className="text-gray-600 text-sm">Setiap transaksi tercatat dalam blockchain</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="text-4xl font-bold text-blue-600 mb-2">0%</div>
                <p className="text-gray-900 font-semibold mb-1">Kebocoran</p>
                <p className="text-gray-600 text-sm">Dana tersalur tepat sasaran tanpa potongan</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
                <p className="text-gray-900 font-semibold mb-1">Monitoring</p>
                <p className="text-gray-600 text-sm">Akses real-time untuk semua stakeholder</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1">
              <div className="mb-4">
                <img
                  src="/MBG-removebg-preview.png"
                  alt="MBG Logo"
                  className="w-[120px] h-auto object-contain brightness-0 invert"
                />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                2025 MBG. Semua Hak Dilindungi Undang-Undang.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Perusahaan</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/about"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Tentang Kami
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Karir
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Tim
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Sumber Daya</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Hukum</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Kebijakan Privasi
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Syarat Layanan
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-gray-400 text-sm">
              Made with Love in Indonesia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
