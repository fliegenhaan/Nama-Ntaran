import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('================================================================================');
  console.log('RUNNING AI FEATURES MIGRATION');
  console.log('================================================================================\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/003_add_ai_features.sql');
    console.log(`Reading migration file: ${migrationPath}`);

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('✅ Migration file loaded\n');

    console.log('Executing migration...');
    console.log('This will create the following tables:');
    console.log('  - poverty_data_cache');
    console.log('  - ai_food_analyses');
    console.log('  - anomaly_alerts');
    console.log('  - vendor_risk_assessments');
    console.log('  - stunting_data_cache\n');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try alternative approach - split and execute statements
      console.log('⚠️  RPC method not available, trying direct execution...\n');

      // For Supabase, we need to execute this via the dashboard or psql
      // Let's inform the user
      console.log('❌ Cannot execute migration directly via Supabase client.');
      console.log('\n📝 Please run the migration manually:');
      console.log('   1. Open Supabase Dashboard → SQL Editor');
      console.log('   2. Copy the contents of: database/migrations/003_add_ai_features.sql');
      console.log('   3. Paste and execute in SQL Editor\n');
      console.log('Or use psql:');
      console.log('   psql <connection-string> -f database/migrations/003_add_ai_features.sql\n');
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('================================================================================');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Please run the migration manually:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Copy the contents of: database/migrations/003_add_ai_features.sql');
    console.log('   3. Paste and execute in SQL Editor\n');
    process.exit(1);
  }
}

runMigration();
