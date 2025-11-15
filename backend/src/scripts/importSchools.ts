import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'nutrichain',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

interface SchoolCSVRow {
  No: string;
  NPSN: string;
  NPSN_URL: string;
  'Nama Satuan Pendidikan': string;
  Alamat: string;
  Kelurahan: string;
  Status: string;
  kode_kecamatan: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  jenjang: string;
  kecamatan_url: string;
  source_url: string;
}

async function importCSV(filePath: string, jenjang: 'dikdas' | 'dikmen') {
  const schools: SchoolCSVRow[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          bom: true, // Handle BOM in CSV
        })
      )
      .on('data', (row: SchoolCSVRow) => {
        schools.push(row);
      })
      .on('end', async () => {
        console.log(`\n📚 Found ${schools.length} schools in ${jenjang} CSV`);
        console.log('Starting import to database...\n');

        let imported = 0;
        let skipped = 0;
        let errors = 0;

        for (const school of schools) {
          try {
            await pool.query(
              `INSERT INTO schools (
                npsn,
                name,
                address,
                kelurahan,
                status,
                kode_kecamatan,
                province,
                city,
                district,
                jenjang,
                npsn_url,
                kecamatan_url,
                source_url,
                priority_score
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
              ON CONFLICT (npsn) DO NOTHING`,
              [
                school.NPSN,
                school['Nama Satuan Pendidikan'],
                school.Alamat,
                school.Kelurahan,
                school.Status,
                school.kode_kecamatan,
                school.provinsi,
                school.kabupaten,
                school.kecamatan,
                school.jenjang,
                school.NPSN_URL,
                school.kecamatan_url,
                school.source_url,
                Math.random() * 100, // Random priority score for demo
              ]
            );
            imported++;
            if (imported % 100 === 0) {
              process.stdout.write(`\r✓ Imported: ${imported} | Skipped: ${skipped} | Errors: ${errors}`);
            }
          } catch (error: any) {
            if (error.code === '23505') {
              // Unique constraint violation (duplicate NPSN)
              skipped++;
            } else {
              errors++;
              console.error(`\n❌ Error importing ${school.NPSN}:`, error.message);
            }
          }
        }

        console.log(`\n\n✅ Import completed!`);
        console.log(`   Imported: ${imported}`);
        console.log(`   Skipped (duplicates): ${skipped}`);
        console.log(`   Errors: ${errors}\n`);

        resolve();
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('\n🚀 Starting School Data Import...\n');

  const dikdasPath = path.join(__dirname, '../../../database/detail_sekolah_dikdas_20251113_022936.csv');
  const dikmenPath = path.join(__dirname, '../../../database/detail_sekolah_dikmen_20251113_080033.csv');

  try {
    // Check if files exist
    if (!fs.existsSync(dikdasPath)) {
      throw new Error(`Dikdas CSV not found at: ${dikdasPath}`);
    }
    if (!fs.existsSync(dikmenPath)) {
      throw new Error(`Dikmen CSV not found at: ${dikmenPath}`);
    }

    console.log('📖 Importing SD sederajat (Dikdas)...');
    await importCSV(dikdasPath, 'dikdas');

    console.log('\n📖 Importing SMP/SMA sederajat (Dikmen)...');
    await importCSV(dikmenPath, 'dikmen');

    // Show statistics
    const result = await pool.query(`
      SELECT
        jenjang,
        status,
        COUNT(*) as count
      FROM schools
      GROUP BY jenjang, status
      ORDER BY jenjang, status
    `);

    console.log('\n📊 Database Statistics:');
    console.log('─'.repeat(50));
    result.rows.forEach((row) => {
      console.log(`   ${row.jenjang.toUpperCase()} - ${row.status}: ${row.count} sekolah`);
    });
    console.log('─'.repeat(50));

    const totalResult = await pool.query('SELECT COUNT(*) as total FROM schools');
    console.log(`\n🎯 Total Sekolah di Database: ${totalResult.rows[0].total}\n`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during import:', error);
    await pool.end();
    process.exit(1);
  }
}

main();
