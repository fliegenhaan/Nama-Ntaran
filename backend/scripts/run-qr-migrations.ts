/**
 * Run QR Code Migrations
 *
 * This script runs the QR-related database migrations:
 * - 011_add_qr_scan_logs_v3.sql
 * - 012_add_qr_code_url_to_deliveries.sql
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(migrationFile: string) {
  try {
    console.log(`\n📝 Running migration: ${migrationFile}`);

    const migrationPath = path.join(__dirname, '../../database/migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('   Executing SQL...');

    // Execute the SQL using rpc or direct query
    // Note: Supabase client doesn't have direct SQL execution
    // We'll need to use the REST API or postgres connection
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error(`❌ Migration failed: ${migrationFile}`);
      console.error('   Error:', error.message);
      throw error;
    }

    console.log(`✅ Migration completed: ${migrationFile}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Migration error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting QR Code Migrations');
  console.log('================================\n');

  const migrations = [
    '011_add_qr_scan_logs_v3.sql',
    '012_add_qr_code_url_to_deliveries.sql'
  ];

  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (!success) {
      console.error('\n❌ Migration process stopped due to error');
      process.exit(1);
    }
  }

  console.log('\n================================');
  console.log('✅ All migrations completed successfully!');
  console.log('\n📋 Changes applied:');
  console.log('   - qr_scan_logs table created');
  console.log('   - qr_code_url column added to deliveries');

  process.exit(0);
}

main();
