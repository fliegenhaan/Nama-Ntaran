-- Migration: Setup Supabase Storage for QR Codes
-- Purpose: Create storage bucket and policies for QR code images
-- Created: 2025-11-28

-- ============================================================================
-- CREATE STORAGE BUCKET (if not exists)
-- ============================================================================

-- Note: This assumes bucket 'mbg' already exists
-- If not, create it manually via Supabase Dashboard → Storage → New Bucket
-- Bucket name: mbg
-- Public: Yes (so QR codes can be accessed publicly)

-- ============================================================================
-- CREATE STORAGE POLICIES
-- ============================================================================

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "QR codes are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete QR codes" ON storage.objects;

-- Policy: Allow public read access to QR codes
CREATE POLICY "QR codes are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'mbg' AND (storage.foldername(name))[1] = 'qr-codes');

-- Policy: Allow authenticated users to upload QR codes
CREATE POLICY "Authenticated users can upload QR codes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mbg' AND (storage.foldername(name))[1] = 'qr-codes');

-- Policy: Allow authenticated users to update/replace QR codes
CREATE POLICY "Authenticated users can update QR codes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'mbg' AND (storage.foldername(name))[1] = 'qr-codes')
WITH CHECK (bucket_id = 'mbg' AND (storage.foldername(name))[1] = 'qr-codes');

-- Policy: Allow authenticated users to delete QR codes
CREATE POLICY "Authenticated users can delete QR codes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'mbg' AND (storage.foldername(name))[1] = 'qr-codes');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- List all policies for mbg bucket
SELECT
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%QR%';

-- Success message
SELECT '✅ Storage policies created for QR codes!' as status;

-- ============================================================================
-- MANUAL STEPS (if bucket doesn't exist)
-- ============================================================================
--
-- If bucket 'mbg' doesn't exist yet:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: mbg
-- 4. Public: Yes (checked)
-- 5. Click "Create bucket"
--
-- Then run this SQL to create the policies.
-- ============================================================================
