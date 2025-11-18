# TODO: Design Improvements untuk Halaman Lainnya

Dokumen ini berisi daftar tugas yang perlu diselesaikan untuk meningkatkan design dan user experience pada halaman-halaman lain dalam aplikasi.

## ✅ Selesai
- [x] Rombak design page `/school` (Dashboard Sekolah)
- [x] Implementasi TopHeader component dengan notifikasi
- [x] Update ModernSidebar dengan menu Settings dan Logout
- [x] Implementasi smooth scrolling dan performance optimization
- [x] Tambahkan animasi framer-motion untuk UX yang lebih baik

## 🔄 Perlu Diselesaikan

### 1. Halaman Verifikasi Pengiriman (`/school/verify`)
- [ ] Rombak UI untuk matching dengan design baru
- [ ] Implementasi filter dan search functionality
- [ ] Tambahkan bulk verification feature
- [ ] Optimasi performa untuk list panjang pengiriman

### 2. Halaman Verifikasi QR (`/school/verify-qr`)
- [ ] Implementasi QR scanner dengan camera access
- [ ] Design UI untuk preview hasil scan
- [ ] Tambahkan feedback visual saat scanning
- [ ] Handle error states untuk camera permission

### 3. Halaman Riwayat Verifikasi (`/school/history`)
- [ ] Rombak table design dengan pagination
- [ ] Implementasi filter berdasarkan tanggal dan status
- [ ] Tambahkan export functionality (PDF/Excel)
- [ ] Design detail view untuk setiap verifikasi

### 4. Halaman Masalah (`/school/issues`)
- [ ] Rombak list view untuk masalah yang dilaporkan
- [ ] Implementasi status tracking (Open, In Progress, Resolved)
- [ ] Tambahkan timeline untuk setiap issue
- [ ] Design form untuk update status masalah

### 5. Halaman Laporan Masalah Baru (`/school/issues/new`)
- [ ] Design form yang user-friendly untuk laporan
- [ ] Implementasi upload foto untuk evidence
- [ ] Tambahkan kategori masalah
- [ ] Implementasi draft saving

### 6. Halaman Settings (`/school/settings`)
- [ ] Design halaman settings baru
- [ ] Implementasi profile management
- [ ] Tambahkan notification preferences
- [ ] Implementasi theme customization (optional)

### 7. Komponen Global
- [ ] Buat loading skeleton components
- [ ] Implementasi error boundary dengan UI yang baik
- [ ] Design empty state components
- [ ] Buat confirmation modal component yang reusable

### 8. Performance Optimization
- [ ] Implementasi lazy loading untuk images
- [ ] Code splitting untuk route-based loading
- [ ] Implementasi service worker untuk offline capability
- [ ] Optimasi bundle size dengan tree shaking

### 9. Accessibility
- [ ] Tambahkan ARIA labels untuk screen readers
- [ ] Implementasi keyboard navigation
- [ ] Ensure color contrast ratio memenuhi WCAG standards
- [ ] Tambahkan focus indicators yang jelas

### 10. Responsive Design
- [ ] Test dan optimasi untuk mobile devices
- [ ] Implementasi touch gestures untuk mobile
- [ ] Design tablet-specific layouts
- [ ] Test pada berbagai screen sizes

## 📝 Catatan Penting

### Standar Koding
- Gunakan Title Case untuk semua teks di website
- Semua comment harus dalam Bahasa Indonesia (kecuali singkatan seperti API, UI, UX)
- Hindari penggunaan emoji dalam kode
- Hindari kata-kata seperti "enhanced", "fix", "improved" untuk nama variabel
- Gunakan semantic naming untuk variabel dan function

### Performance Guidelines
- Selalu gunakan `gpu-accelerate` class untuk animasi
- Implementasi `will-change` dengan hati-hati (hanya saat diperlukan)
- Gunakan `transform` dan `opacity` untuk animasi (bukan position/size properties)
- Implementasi throttling untuk scroll events
- Gunakan `useCallback` dan `useMemo` untuk optimasi re-render

### Animation Guidelines
- Gunakan cubic-bezier [0.4, 0, 0.2, 1] untuk smooth easing
- Duration animasi: 0.2-0.5s untuk micro-interactions
- Implementasi stagger animations untuk lists
- Support `prefers-reduced-motion` untuk accessibility

### Design Consistency
- Gunakan gradient backgrounds yang sudah didefinisikan di globals.css
- Maintain spacing consistency (gunakan Tailwind spacing scale)
- Gunakan shadow-modern dan shadow-glow untuk depth
- Implementasi glass morphism untuk cards dan panels

## 🎯 Prioritas
1. **High**: Halaman Verifikasi QR (core functionality)
2. **High**: Halaman Settings (user management)
3. **Medium**: Halaman Riwayat dengan detail view
4. **Medium**: Halaman Masalah dengan tracking
5. **Low**: Performance optimization tambahan
6. **Low**: Theme customization

## 🔧 Tools dan Libraries
- Framer Motion: untuk animasi smooth
- React Hook Form: untuk form management
- Zod: untuk validation
- Date-fns: untuk date formatting
- React Query: untuk data fetching optimization (consider implementing)

---
**Last Updated**: 2025-11-18
**Maintained By**: Development Team
