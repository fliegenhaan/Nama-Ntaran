#!/bin/bash

# QR Code Migrations Runner
# Automatically runs all QR-related migrations in order

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection string
DB_URL="postgresql://postgres.pinjhirrfdcivrazudfm:MekiOkonBengkak@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Migration files
MIGRATION_011="database/migrations/011_add_qr_scan_logs_v3.sql"
MIGRATION_012="database/migrations/012_add_qr_code_url_to_deliveries.sql"
MIGRATION_013="database/migrations/013_setup_qr_storage.sql"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}QR Code Feature - Migrations Runner${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql is not installed${NC}"
    echo -e "${YELLOW}Please install PostgreSQL client first${NC}"
    exit 1
fi

# Function to run migration
run_migration() {
    local file=$1
    local name=$2

    echo -e "${YELLOW}🔄 Running: ${name}${NC}"

    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ File not found: ${file}${NC}"
        return 1
    fi

    if psql "$DB_URL" -f "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Success: ${name}${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed: ${name}${NC}"
        return 1
    fi
}

# Run migrations
echo -e "${BLUE}Starting migrations...${NC}"
echo ""

# Migration 011
if run_migration "$MIGRATION_011" "Migration 011: Add QR Scan Logs Table"; then
    sleep 1
else
    echo -e "${RED}Migration 011 failed. Stopping.${NC}"
    exit 1
fi

# Migration 012
if run_migration "$MIGRATION_012" "Migration 012: Add QR Code URL Column"; then
    sleep 1
else
    echo -e "${RED}Migration 012 failed. Stopping.${NC}"
    exit 1
fi

# Migration 013
if run_migration "$MIGRATION_013" "Migration 013: Setup QR Storage Policies"; then
    sleep 1
else
    echo -e "${RED}Migration 013 failed. Stopping.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All migrations completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verification
echo -e "${BLUE}Running verification checks...${NC}"
echo ""

# Check qr_scan_logs table
echo -e "${YELLOW}Checking qr_scan_logs table...${NC}"
if psql "$DB_URL" -c "SELECT COUNT(*) FROM qr_scan_logs;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ qr_scan_logs table exists${NC}"
else
    echo -e "${RED}❌ qr_scan_logs table not found${NC}"
fi

# Check qr_code_url column
echo -e "${YELLOW}Checking qr_code_url column...${NC}"
if psql "$DB_URL" -c "SELECT qr_code_url FROM deliveries LIMIT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ qr_code_url column exists${NC}"
else
    echo -e "${RED}❌ qr_code_url column not found${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Next Steps:${NC}"
echo -e "${BLUE}========================================${NC}"
echo "1. Setup Supabase Storage bucket 'mbg'"
echo "2. Create folder 'qr-codes' in bucket"
echo "3. Test QR generation (catering)"
echo "4. Test QR scanning (school)"
echo ""
echo -e "${GREEN}Done! 🎉${NC}"
