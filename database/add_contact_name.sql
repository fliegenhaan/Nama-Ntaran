-- Script untuk menambahkan field contact_name ke tabel schools yang sudah ada
-- Jalankan script ini jika database sudah ada dan tidak ingin drop/recreate

ALTER TABLE schools ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);

-- Contoh update untuk mengisi data contact_name
-- UPDATE schools SET contact_name = 'Kepala Sekolah' WHERE contact_name IS NULL;
