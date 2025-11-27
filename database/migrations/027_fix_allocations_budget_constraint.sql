-- ============================================
-- Migration 027: Fix Allocations Budget Foreign Key Constraint
-- ============================================
-- Purpose: Drop incorrect budget_id constraint and recreate it to point to budget_allocations
-- Created: 2025-11-27
-- ============================================

-- Drop the existing incorrect foreign key constraint
ALTER TABLE allocations
DROP CONSTRAINT IF EXISTS allocations_budget_id_fkey;

-- Recreate the constraint pointing to the correct table (budget_allocations)
ALTER TABLE allocations
ADD CONSTRAINT allocations_budget_id_fkey
FOREIGN KEY (budget_id) REFERENCES budget_allocations(id) ON DELETE SET NULL;

-- ============================================
-- MIGRATION COMPLETED
-- ============================================
