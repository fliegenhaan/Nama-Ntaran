import { pool } from '../config/database.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Running database migration...');

    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);

    console.log('✅ Migration completed successfully!');
    console.log('📋 Tables created/updated:');
    console.log('   - users');
    console.log('   - schools');
    console.log('   - caterings');
    console.log('   - deliveries');
    console.log('   - escrow_transactions');
    console.log('   - verifications');
    console.log('   - issues');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
