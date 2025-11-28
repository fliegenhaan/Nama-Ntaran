-- Migration: Add QR Scan Logs Table (Version 3 - Without RLS)
-- Purpose: Track all QR code scans by schools for delivery verification
-- Created: 2025-11-28
-- Note: RLS policies will be added separately after understanding auth schema

-- Drop table if exists (for clean retry)
DROP TABLE IF EXISTS qr_scan_logs CASCADE;

-- ============================================================================
-- QR SCAN LOGS TABLE
-- ============================================================================
-- Tracks every QR code scan attempt by schools, including success/failure
-- and blockchain verification status

CREATE TABLE qr_scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  delivery_id BIGINT,
  school_id INTEGER,
  scanned_by INTEGER,

  -- Scan method and data
  scan_method VARCHAR(20) CHECK (scan_method IN ('camera', 'upload')) NOT NULL,
  scan_data JSONB, -- Raw QR data that was scanned

  -- Scan result
  scan_result VARCHAR(20) CHECK (scan_result IN ('success', 'invalid', 'error')) NOT NULL,
  error_message TEXT,

  -- Blockchain verification
  blockchain_verified BOOLEAN DEFAULT false,
  blockchain_tx_hash VARCHAR(100),
  blockchain_data JSONB, -- Store blockchain transaction details

  -- Device and location info (optional)
  device_info JSONB,
  ip_address INET,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add delivery_id foreign key (if deliveries table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deliveries') THEN
    ALTER TABLE qr_scan_logs
    ADD CONSTRAINT fk_qr_scan_logs_delivery
    FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add school_id foreign key (if schools table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schools') THEN
    ALTER TABLE qr_scan_logs
    ADD CONSTRAINT fk_qr_scan_logs_school
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add scanned_by foreign key (if users table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE qr_scan_logs
    ADD CONSTRAINT fk_qr_scan_logs_user
    FOREIGN KEY (scanned_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add check constraint for valid delivery
ALTER TABLE qr_scan_logs
ADD CONSTRAINT valid_delivery CHECK (
  (scan_result = 'success' AND delivery_id IS NOT NULL) OR
  (scan_result != 'success')
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for querying by delivery
CREATE INDEX idx_qr_scan_logs_delivery
ON qr_scan_logs(delivery_id)
WHERE delivery_id IS NOT NULL;

-- Index for querying by school
CREATE INDEX idx_qr_scan_logs_school
ON qr_scan_logs(school_id)
WHERE school_id IS NOT NULL;

-- Index for querying by user
CREATE INDEX idx_qr_scan_logs_user
ON qr_scan_logs(scanned_by)
WHERE scanned_by IS NOT NULL;

-- Index for recent scans (most common query)
CREATE INDEX idx_qr_scan_logs_created
ON qr_scan_logs(created_at DESC);

-- Index for filtering by result
CREATE INDEX idx_qr_scan_logs_result
ON qr_scan_logs(scan_result);

-- Composite index for school + date queries
CREATE INDEX idx_qr_scan_logs_school_date
ON qr_scan_logs(school_id, created_at DESC)
WHERE school_id IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE qr_scan_logs IS 'Tracks all QR code scan attempts by schools for delivery verification';
COMMENT ON COLUMN qr_scan_logs.scan_method IS 'How the QR was scanned: camera or file upload';
COMMENT ON COLUMN qr_scan_logs.scan_data IS 'Raw JSON data from the scanned QR code';
COMMENT ON COLUMN qr_scan_logs.scan_result IS 'Result of the scan: success, invalid, or error';
COMMENT ON COLUMN qr_scan_logs.blockchain_verified IS 'Whether blockchain transaction was verified during scan';
COMMENT ON COLUMN qr_scan_logs.blockchain_data IS 'Blockchain transaction details if verified';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- NOTE: RLS is intentionally NOT enabled yet.
-- We need to understand the auth schema first (how auth.uid() maps to users.id)
-- RLS policies will be added in a separate migration after testing

-- Placeholder for future RLS setup:
-- ALTER TABLE qr_scan_logs ENABLE ROW LEVEL SECURITY;
--
-- Then add policies based on actual auth schema

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify table was created successfully
SELECT
  'qr_scan_logs table created successfully' as message,
  COUNT(*) as initial_record_count
FROM qr_scan_logs;

-- Show table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'qr_scan_logs'
ORDER BY ordinal_position;

-- Show constraints
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'qr_scan_logs'::regclass;

-- Success message
SELECT '✅ Migration completed successfully!' as status;
