# 🔐 Kredensial Akun - Nama-Ntaran MBG Platform

Dokumen ini berisi kredensial login untuk berbagai role yang tersedia di platform Transparansi MBG.

## 📋 Daftar Akun

### 🔑 Password Default
**Semua akun menggunakan password yang sama:**
```
password123
```

---

## 👤 Role: Admin
**Akses:** Dashboard admin, manajemen sistem, pengawasan semua transaksi

| Email | Password | Deskripsi |
|-------|----------|-----------|
| `admin@nutrichain.id` | `password123` | Administrator sistem utama |

**Fitur yang tersedia:**
- ✅ Manajemen akun sekolah dan katering
- ✅ Monitoring semua delivery dan escrow transactions
- ✅ Pengelolaan issues dan verifikasi
- ✅ Dashboard analytics lengkap
- ✅ Pengaturan sistem

---

## 🏛️ Role: Pemerintah (Government)
**Akses:** Monitoring dan oversight program MBG

| Email | Password | Deskripsi |
|-------|----------|-----------|
| `pemerintah@mbg.go.id` | `password123` | Akun Pemerintah/Dinas terkait |

**Fitur yang tersedia:**
- ✅ View semua data sekolah dan distribusi makanan
- ✅ Monitoring transparency dashboard
- ✅ Access ke priority map
- ✅ Laporan dan statistik program
- ✅ Tracking budget allocation

---

## 🏫 Role: Sekolah (School)
**Akses:** Verifikasi delivery, pelaporan issues, tracking anggaran

| Email | Password | Lokasi | NPSN |
|-------|----------|--------|------|
| `sdn01.jakarta@sekolah.id` | `password123` | SDN 01 Jakarta Pusat | 20100001 |
| `sdn15.bandung@sekolah.id` | `password123` | SDN 15 Bandung Timur | 20200015 |
| `smpn3.surabaya@sekolah.id` | `password123` | SMPN 3 Surabaya | 20300003 |
| `sman5.yogya@sekolah.id` | `password123` | SMAN 5 Yogyakarta | 20400005 |
| `sdn22.semarang@sekolah.id` | `password123` | SDN 22 Semarang Barat | 20500022 |
| `smpn7.medan@sekolah.id` | `password123` | SMPN 7 Medan | 20600007 |
| `sdn09.makassar@sekolah.id` | `password123` | SDN 09 Makassar | 20700009 |
| `sman2.palembang@sekolah.id` | `password123` | SMAN 2 Palembang | 20800002 |
| `sdn05.denpasar@sekolah.id` | `password123` | SDN 05 Denpasar | 20900005 |
| `smpn1.manado@sekolah.id` | `password123` | SMPN 1 Manado | 21000001 |

**Fitur yang tersedia:**
- ✅ Verifikasi delivery makanan
- ✅ Rating kualitas dan porsi
- ✅ Pelaporan issues (late delivery, wrong portions, quality issues)
- ✅ Tracking delivery history
- ✅ View escrow transactions

---

## 🍱 Role: Katering (Catering)
**Akses:** Manajemen delivery, jadwal pengiriman, payment tracking

| Email | Password | Nama Katering | Company |
|-------|----------|---------------|---------|
| `sehat.jaya@katering.id` | `password123` | Katering Sehat Jaya | PT Sehat Jaya Abadi |
| `nutrisi.prima@katering.id` | `password123` | Nutrisi Prima Catering | CV Nutrisi Prima |
| `makanan.bergizi@katering.id` | `password123` | Makanan Bergizi Center | PT Gizi Nusantara |
| `dapur.sehat@katering.id` | `password123` | Dapur Sehat Indonesia | CV Dapur Sehat |
| `gizi.anak@katering.id` | `password123` | Gizi Anak Nusantara | PT Anak Sehat |

**Fitur yang tersedia:**
- ✅ Manajemen jadwal delivery
- ✅ Update status pengiriman
- ✅ View payment dan escrow status
- ✅ Delivery history dan performance metrics
- ✅ Rating dan feedback dari sekolah

---

## 🚀 Cara Menggunakan Kredensial

### 1. Login via Web Interface
```
URL: http://localhost:3000/login
Email: [pilih dari daftar di atas]
Password: password123
```

### 2. Login via API
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nutrichain.id",
    "password": "password123"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "admin@nutrichain.id",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🔒 Keamanan

### Development Environment
- ⚠️ **PENTING**: Password `password123` hanya untuk development/testing
- ⚠️ **JANGAN** gunakan password ini di production
- ⚠️ Semua kredensial ini akan di-reset saat deployment ke production

### Production Environment
- ✅ Gunakan password yang kuat (minimal 12 karakter)
- ✅ Enable 2FA untuk admin accounts
- ✅ Rotate credentials secara berkala
- ✅ Implementasi rate limiting untuk login attempts
- ✅ Monitor suspicious login activities

---

## 🔄 Reset Database & Credentials

Untuk mereset database dan membuat ulang semua kredensial:

```bash
cd backend
npm run seed
```

Atau secara manual:
```bash
cd backend
npx tsx src/scripts/seed.ts
```

Output setelah seeding berhasil akan menampilkan konfirmasi semua akun yang dibuat.

---

## 📞 Support

Jika ada masalah dengan kredensial atau akses akun:
1. Pastikan database sudah di-seed
2. Cek koneksi database di `.env`
3. Periksa log backend untuk error messages
4. Reset database jika diperlukan dengan command di atas

---

**Last Updated:** 2025
**Version:** 1.0.0
