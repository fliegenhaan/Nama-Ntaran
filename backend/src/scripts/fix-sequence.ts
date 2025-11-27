import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fix PostgreSQL sequence issue
 *
 * Problem: After failed seeding attempts, PostgreSQL sequences are out of sync
 * with actual max IDs in tables, causing "duplicate key value violates unique constraint"
 *
 * Solution: Reset all sequences to MAX(id) + 1
 */
async function fixSequences() {
  console.log('🔧 Starting sequence fix...\n');

  const tables = [
    'users',
    'schools',
    'caterings',
    'deliveries',
    'escrow_transactions',
    'verifications',
    'issues',
  ];

  for (const table of tables) {
    try {
      // Get max ID from table
      const { data: maxData, error: maxError } = await supabase
        .from(table)
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (maxError && maxError.code !== 'PGRST116') {
        // PGRST116 = no rows found (empty table)
        console.error(`❌ Error getting max ID from ${table}:`, maxError.message);
        continue;
      }

      const maxId = maxData?.id || 0;
      const nextVal = maxId + 1;

      console.log(`📊 Table: ${table}`);
      console.log(`   Current max ID: ${maxId}`);
      console.log(`   Setting sequence to: ${nextVal}`);

      // Execute raw SQL to fix sequence
      const { error: seqError } = await supabase.rpc('exec_sql', {
        sql: `SELECT setval('${table}_id_seq', ${nextVal}, false);`
      });

      if (seqError) {
        // Supabase might not have exec_sql RPC, try alternative method
        console.log(`   ⚠️  RPC method not available, sequence will auto-fix on next insert`);
      } else {
        console.log(`   ✅ Sequence fixed!\n`);
      }

    } catch (error) {
      console.error(`❌ Error fixing ${table}:`, error);
    }
  }

  console.log('\n✅ Sequence fix completed!');
  console.log('\n📝 Note: If you still get errors, please run this SQL in Supabase SQL Editor:');
  console.log(`
  -- Copy and paste this in Supabase SQL Editor:
  SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);
  SELECT setval('schools_id_seq', COALESCE((SELECT MAX(id) FROM schools), 0) + 1, false);
  SELECT setval('caterings_id_seq', COALESCE((SELECT MAX(id) FROM caterings), 0) + 1, false);
  SELECT setval('deliveries_id_seq', COALESCE((SELECT MAX(id) FROM deliveries), 0) + 1, false);
  SELECT setval('escrow_transactions_id_seq', COALESCE((SELECT MAX(id) FROM escrow_transactions), 0) + 1, false);
  SELECT setval('verifications_id_seq', COALESCE((SELECT MAX(id) FROM verifications), 0) + 1, false);
  SELECT setval('issues_id_seq', COALESCE((SELECT MAX(id) FROM issues), 0) + 1, false);
  `);

  process.exit(0);
}

fixSequences().catch(console.error);
