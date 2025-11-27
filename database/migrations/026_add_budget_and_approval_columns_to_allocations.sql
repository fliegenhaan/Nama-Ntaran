-- ============================================
-- Migration 026: Add Budget and Approval Columns to Allocations
-- ============================================
-- Purpose: Add budget_id, created_by, and approved_by columns to allocations table
-- Created: 2025-11-27
-- ============================================

-- Add budget_id column to link allocations to budget_allocations
ALTER TABLE allocations
ADD COLUMN IF NOT EXISTS budget_id INTEGER REFERENCES budget_allocations(id) ON DELETE SET NULL;

-- Add created_by column to track who created the allocation
ALTER TABLE allocations
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add approved_by column to track who approved the allocation
ALTER TABLE allocations
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add approved_at column to track when the allocation was approved
ALTER TABLE allocations
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_allocations_budget_id ON allocations(budget_id);
CREATE INDEX IF NOT EXISTS idx_allocations_created_by ON allocations(created_by);
CREATE INDEX IF NOT EXISTS idx_allocations_approved_by ON allocations(approved_by);

-- ============================================
-- MIGRATION COMPLETED
-- ============================================
