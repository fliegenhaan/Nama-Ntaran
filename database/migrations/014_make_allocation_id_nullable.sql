-- ============================================
-- MIGRATION 014: Make allocation_id nullable in escrow_transactions
-- ============================================
-- Purpose: Allow escrow_transactions to support both allocation-based and delivery-based escrows
-- Created: 2025-11-28
-- ============================================

-- Make allocation_id nullable since escrow can be for delivery OR allocation
ALTER TABLE escrow_transactions
ALTER COLUMN allocation_id DROP NOT NULL;

-- Make tx_hash and blockchain_block_number nullable
-- since they are set AFTER the record is created (PENDING -> CONFIRMED)
ALTER TABLE escrow_transactions
ALTER COLUMN tx_hash DROP NOT NULL;

ALTER TABLE escrow_transactions
ALTER COLUMN blockchain_block_number DROP NOT NULL;

-- Add check constraint to ensure either allocation_id OR delivery_id is provided
-- Use DO block to check if constraint already exists
DO $$
BEGIN
  -- Drop existing constraint if it exists (in case it has wrong logic)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_allocation_or_delivery'
      AND conrelid = 'escrow_transactions'::regclass
  ) THEN
    ALTER TABLE escrow_transactions DROP CONSTRAINT check_allocation_or_delivery;
  END IF;

  -- Add the correct constraint
  ALTER TABLE escrow_transactions
  ADD CONSTRAINT check_allocation_or_delivery
  CHECK (
    (allocation_id IS NOT NULL AND delivery_id IS NULL) OR
    (allocation_id IS NULL AND delivery_id IS NOT NULL)
  );
END$$;

-- ============================================
-- VERIFY CHANGES
-- ============================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'escrow_transactions'
  AND column_name IN ('allocation_id', 'delivery_id', 'tx_hash', 'blockchain_block_number')
ORDER BY column_name;
