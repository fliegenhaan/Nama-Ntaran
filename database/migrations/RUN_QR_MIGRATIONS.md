# QR Code Feature - Database Migrations Guide

## Overview
Migrations untuk menambahkan fitur QR Code pada sistem MBG NutriChain.

## Migrations to Run (in order)

### 1. Migration 011: Add QR Scan Logs Table
**File:** `011_add_qr_scan_logs_v3.sql`

**Purpose:**
- Membuat tabel `qr_scan_logs` untuk tracking semua scan QR code
- Menyimpan detail scan (method, result, blockchain verification, etc.)

**Tables Created:**
- `qr_scan_logs` - Log semua QR scan events

**Columns:**
- `id` (UUID) - Primary key
- `delivery_id` (BIGINT) - Reference ke deliveries
- `school_id` (INTEGER) - Reference ke schools
- `scanned_by` (INTEGER) - User yang melakukan scan
- `scan_method` ('camera' | 'upload') - Method scan
- `scan_data` (JSONB) - Raw data QR
- `scan_result` ('success' | 'invalid' | 'error') - Result scan
- `error_message` (TEXT) - Error message jika gagal
- `blockchain_verified` (BOOLEAN) - Status blockchain verification
- `blockchain_tx_hash` (VARCHAR) - Transaction hash
- `blockchain_data` (JSONB) - Blockchain transaction details
- `device_info` (JSONB) - Device information
- `ip_address` (INET) - IP address scanner
- `created_at` (TIMESTAMP) - Waktu scan

---

### 2. Migration 012: Add QR Code URL to Deliveries
**File:** `012_add_qr_code_url_to_deliveries.sql`

**Purpose:**
- Menambahkan kolom `qr_code_url` pada tabel deliveries
- Menyimpan URL public QR code di Supabase Storage

**Tables Modified:**
- `deliveries` - Tambah kolom `qr_code_url`

**Columns Added:**
- `qr_code_url` (TEXT) - Public URL ke QR code image

---

### 3. Migration 013: Setup QR Storage Policies
**File:** `013_setup_qr_storage.sql`

**Purpose:**
- Setup storage bucket policies untuk QR codes
- Enable public read, authenticated write/update/delete

**Storage Policies Created:**
- `QR codes are publicly accessible` - Public read
- `Authenticated users can upload QR codes` - Auth insert
- `Authenticated users can update QR codes` - Auth update
- `Authenticated users can delete QR codes` - Auth delete

---

## How to Run Migrations

### Option 1: Via Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   ```
   URL: https://supabase.com/dashboard/project/pinjhirrfdcivrazudfm
   ```

2. **Navigate to SQL Editor**
   - Click "SQL Editor" di sidebar
   - Click "New query"

3. **Run Migration 011**
   - Copy isi file `011_add_qr_scan_logs_v3.sql`
   - Paste ke SQL Editor
   - Click "Run" atau tekan Ctrl+Enter
   - Verify: Cek output di bagian bawah, pastikan success

4. **Run Migration 012**
   - Copy isi file `012_add_qr_code_url_to_deliveries.sql`
   - Paste ke SQL Editor
   - Click "Run"
   - Verify: Cek kolom `qr_code_url` sudah ada di tabel deliveries

5. **Run Migration 013**
   - Copy isi file `013_setup_qr_storage.sql`
   - Paste ke SQL Editor
   - Click "Run"
   - Verify: Cek storage policies di Storage → Policies

---

### Option 2: Via Supabase CLI

```bash
# 1. Install Supabase CLI jika belum
npm install -g supabase

# 2. Login ke Supabase
supabase login

# 3. Link project
supabase link --project-ref pinjhirrfdcivrazudfm

# 4. Run migrations
supabase db push

# Or run individual migrations
psql "postgresql://postgres.pinjhirrfdcivrazudfm:MekiOkonBengkak@aws-1-ap-south-1.pooler.supabase.com:5432/postgres" < database/migrations/011_add_qr_scan_logs_v3.sql
psql "postgresql://postgres.pinjhirrfdcivrazudfm:MekiOkonBengkak@aws-1-ap-south-1.pooler.supabase.com:5432/postgres" < database/migrations/012_add_qr_code_url_to_deliveries.sql
psql "postgresql://postgres.pinjhirrfdcivrazudfm:MekiOkonBengkak@aws-1-ap-south-1.pooler.supabase.com:5432/postgres" < database/migrations/013_setup_qr_storage.sql
```

---

### Option 3: Via psql Direct Connection

```bash
# Connect to database
psql "postgresql://postgres.pinjhirrfdcivrazudfm:MekiOkonBengkak@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Run migrations one by one
\i database/migrations/011_add_qr_scan_logs_v3.sql
\i database/migrations/012_add_qr_code_url_to_deliveries.sql
\i database/migrations/013_setup_qr_storage.sql
```

---

## Verification Steps

### 1. Verify Tables Created

```sql
-- Check qr_scan_logs table exists
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'qr_scan_logs'
ORDER BY ordinal_position;

-- Should return 14 columns
```

### 2. Verify Deliveries Column Added

```sql
-- Check qr_code_url column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'deliveries'
  AND column_name = 'qr_code_url';

-- Should return 1 row
```

### 3. Verify Storage Policies

```sql
-- Check storage policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%QR%';

-- Should return 4 policies
```

---

## Rollback (if needed)

### Rollback Migration 013 (Storage Policies)
```sql
DROP POLICY IF EXISTS "QR codes are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete QR codes" ON storage.objects;
```

### Rollback Migration 012 (QR URL Column)
```sql
ALTER TABLE deliveries DROP COLUMN IF EXISTS qr_code_url;
DROP INDEX IF EXISTS idx_deliveries_qr_code_url;
```

### Rollback Migration 011 (QR Scan Logs)
```sql
DROP TABLE IF EXISTS qr_scan_logs CASCADE;
```

---

## Post-Migration Setup

### Setup Supabase Storage Bucket

1. **Via Supabase Dashboard:**
   - Go to Storage
   - Check if bucket 'mbg' exists
   - If not, create new bucket:
     - Name: `mbg`
     - Public: ✅ Yes
   - Create folder: `qr-codes`

2. **Via SQL:**
   ```sql
   -- Check bucket exists
   SELECT * FROM storage.buckets WHERE name = 'mbg';

   -- If not, create via dashboard (easier)
   ```

---

## Testing After Migration

### Test 1: Insert QR Scan Log
```sql
INSERT INTO qr_scan_logs (
  delivery_id,
  school_id,
  scanned_by,
  scan_method,
  scan_result,
  blockchain_verified,
  scan_data
) VALUES (
  1,
  1,
  1,
  'camera',
  'success',
  true,
  '{"deliveryId": 1, "portions": 100}'::jsonb
);

-- Verify
SELECT * FROM qr_scan_logs ORDER BY created_at DESC LIMIT 1;
```

### Test 2: Update Delivery QR URL
```sql
UPDATE deliveries
SET qr_code_url = 'https://pinjhirrfdcivrazudfm.supabase.co/storage/v1/object/public/mbg/qr-codes/delivery-1-qr.png'
WHERE id = 1;

-- Verify
SELECT id, qr_code_url FROM deliveries WHERE id = 1;
```

---

## Troubleshooting

### Issue: Foreign key constraint errors
**Solution:** Make sure tables `deliveries`, `schools`, `users` exist before running migration 011

### Issue: Storage policies not applying
**Solution:**
1. Check bucket 'mbg' exists
2. Verify policies created with query above
3. Try re-running migration 013

### Issue: Column already exists
**Solution:** Migration 012 safe to re-run (uses `IF NOT EXISTS`)

---

## Success Criteria

✅ Table `qr_scan_logs` created with all columns
✅ Column `qr_code_url` added to `deliveries`
✅ 4 storage policies created for QR codes
✅ Storage bucket 'mbg' exists and public
✅ Folder 'qr-codes' exists in bucket

---

## Next Steps After Migration

1. Test QR generation (catering side)
2. Test QR scanning (school side)
3. Verify data saved to `qr_scan_logs`
4. Check QR images uploaded to storage
5. Verify URLs saved to deliveries

---

**Migration prepared by:** Claude Code
**Date:** 2025-11-28
**Version:** 1.0.0
