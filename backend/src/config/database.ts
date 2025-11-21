/**
 * ============================================================================
 * DATABASE CONFIGURATION - SUPABASE CLIENT ONLY
 * ============================================================================
 *
 * IMPORTANT: ALL code MUST use Supabase client!
 *
 * ✅ CORRECT: import { supabase } from '../config/database.js';
 * ❌ REMOVED: Legacy PostgreSQL pool has been removed
 *
 * For database operations, use Supabase client methods:
 * - supabase.from('table').select()
 * - supabase.from('table').insert()
 * - supabase.from('table').update()
 * - supabase.from('table').delete()
 * - supabase.rpc('function_name')
 *
 * For seeders/migrations, use scripts in database/seeders/
 * ============================================================================
 */

import dotenv from 'dotenv';
import { supabase, testSupabaseConnection } from './supabase.js';

dotenv.config();

// ============================================================================
// SUPABASE CLIENT (PRIMARY DATABASE INTERFACE) ✅
// ============================================================================

/**
 * Supabase client - the ONLY database interface
 * All database operations must use this client
 */
export { supabase };

// ============================================================================
// LEGACY POOL REMOVED ✅
// ============================================================================

/**
 * IMPORTANT: Legacy PostgreSQL pool has been REMOVED!
 *
 * If you're using old scripts in src/scripts/:
 * - migrate.ts → Use database/migrations/ instead
 * - seed.ts → Use database/seeders/ instead
 * - importSchools.ts → Use database/seeders/02-seed-schools.ts instead
 *
 * All new seeders/migrations use Supabase client.
 */

// ============================================================================
// INITIALIZATION & HEALTH CHECK
// ============================================================================

// Test Supabase connection on startup
testSupabaseConnection().then((success) => {
  if (success) {
    console.log('✅ Database ready: Using Supabase client');
  } else {
    console.error('❌ Supabase connection failed! Check your credentials.');
    process.exit(-1);
  }
});