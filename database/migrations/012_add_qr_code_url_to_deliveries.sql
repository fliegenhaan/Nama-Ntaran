-- Migration: Add QR Code URL to Deliveries Table
-- Purpose: Store Supabase Storage URL for delivery QR codes
-- Created: 2025-11-28

-- Add qr_code_url column to deliveries table
ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Add index for querying by QR code URL
CREATE INDEX IF NOT EXISTS idx_deliveries_qr_code_url
ON deliveries(qr_code_url)
WHERE qr_code_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN deliveries.qr_code_url IS 'Public URL to QR code image stored in Supabase Storage';

-- Verification query
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'deliveries' AND column_name = 'qr_code_url';

-- Success message
SELECT '✅ QR code URL column added to deliveries table!' as status;
