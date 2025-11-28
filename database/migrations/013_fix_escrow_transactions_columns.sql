-- ============================================
-- MIGRATION 013: Fix escrow_transactions columns
-- ============================================
-- Purpose: Ensure all required columns exist in escrow_transactions
-- Created: 2025-11-28
-- ============================================

-- Check if columns exist and add if missing

-- Add delivery_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='escrow_transactions' AND column_name='delivery_id') THEN
        ALTER TABLE escrow_transactions
        ADD COLUMN delivery_id INTEGER REFERENCES deliveries(id) ON DELETE SET NULL;
        CREATE INDEX idx_escrow_transactions_delivery_id ON escrow_transactions(delivery_id);
    END IF;
END $$;

-- Add catering_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='escrow_transactions' AND column_name='catering_id') THEN
        ALTER TABLE escrow_transactions
        ADD COLUMN catering_id INTEGER REFERENCES caterings(id) ON DELETE SET NULL;
        CREATE INDEX idx_escrow_transactions_catering_id ON escrow_transactions(catering_id);
    END IF;
END $$;

-- Add school_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='escrow_transactions' AND column_name='school_id') THEN
        ALTER TABLE escrow_transactions
        ADD COLUMN school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL;
        CREATE INDEX idx_escrow_transactions_school_id ON escrow_transactions(school_id);
    END IF;
END $$;

-- Rename blockchain_tx_hash to tx_hash if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='escrow_transactions' AND column_name='blockchain_tx_hash')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name='escrow_transactions' AND column_name='tx_hash') THEN
        ALTER TABLE escrow_transactions
        RENAME COLUMN blockchain_tx_hash TO tx_hash;
    END IF;
END $$;

-- Add escrow_status if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='escrow_transactions' AND column_name='escrow_status') THEN
        ALTER TABLE escrow_transactions
        ADD COLUMN escrow_status VARCHAR(20) CHECK (escrow_status IN ('locked', 'released', 'disputed', 'cancelled'));
        CREATE INDEX idx_escrow_transactions_escrow_status ON escrow_transactions(escrow_status);
    END IF;
END $$;

-- Add locked_at if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='escrow_transactions' AND column_name='locked_at') THEN
        ALTER TABLE escrow_transactions
        ADD COLUMN locked_at TIMESTAMP;
    END IF;
END $$;

-- Add released_at if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='escrow_transactions' AND column_name='released_at') THEN
        ALTER TABLE escrow_transactions
        ADD COLUMN released_at TIMESTAMP;
    END IF;
END $$;

-- ============================================
-- VERIFY COLUMNS
-- ============================================

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'escrow_transactions'
  AND column_name IN ('delivery_id', 'catering_id', 'school_id', 'tx_hash', 'escrow_status', 'locked_at', 'released_at')
ORDER BY column_name;
