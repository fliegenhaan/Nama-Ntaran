import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'nutrichain',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

/**
 * SEEDER DATA DUMMY UNTUK DEVELOPMENT
 *
 * Data yang akan dibuat:
 * - 1 Admin
 * - 1 Pemerintah (Government)
 * - 10 Schools (dengan user account)
 * - 5 Caterings (dengan user account)
 * - 30 Deliveries (berbagai status)
 * - 15 Escrow Transactions
 * - 20 Verifications
 * - 8 Issues
 */

// Wallet addresses untuk katering (dummy, tapi format valid)
const DUMMY_WALLETS = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
  '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
  '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
  '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
  '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
];

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');

  const client = await pool.connect();
  try {
    await client.query('TRUNCATE issues, verifications, escrow_transactions, deliveries, caterings, schools, users RESTART IDENTITY CASCADE');
    console.log('✅ Database cleared');
  } finally {
    client.release();
  }
}

async function seedUsers() {
  console.log('\n👥 Seeding users...');

  const client = await pool.connect();
  const password = await bcrypt.hash('password123', 10);

  try {
    // 1. Admin user
    await client.query(`
      INSERT INTO users (email, password_hash, role) VALUES
      ('admin@nutrichain.id', $1, 'admin')
    `, [password]);
    console.log('  ✅ Admin created: admin@nutrichain.id');

    // 2. Government user
    await client.query(`
      INSERT INTO users (email, password_hash, role) VALUES
      ('pemerintah@mbg.go.id', $1, 'government')
    `, [password]);
    console.log('  ✅ Government user created: pemerintah@mbg.go.id');

    // 3. School users (10 schools)
    const schoolEmails = [
      'sdn01.jakarta@sekolah.id',
      'sdn15.bandung@sekolah.id',
      'smpn3.surabaya@sekolah.id',
      'sman5.yogya@sekolah.id',
      'sdn22.semarang@sekolah.id',
      'smpn7.medan@sekolah.id',
      'sdn09.makassar@sekolah.id',
      'sman2.palembang@sekolah.id',
      'sdn05.denpasar@sekolah.id',
      'smpn1.manado@sekolah.id',
    ];

    for (const email of schoolEmails) {
      await client.query(`
        INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'school')
      `, [email, password]);
    }
    console.log(`  ✅ ${schoolEmails.length} school users created`);

    // 4. Catering users (5 caterings)
    const cateringEmails = [
      'sehat.jaya@katering.id',
      'nutrisi.prima@katering.id',
      'makanan.bergizi@katering.id',
      'dapur.sehat@katering.id',
      'gizi.anak@katering.id',
    ];

    for (const email of cateringEmails) {
      await client.query(`
        INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'catering')
      `, [email, password]);
    }
    console.log(`  ✅ ${cateringEmails.length} catering users created`);

  } finally {
    client.release();
  }
}

async function seedSchools() {
  console.log('\n🏫 Seeding schools...');

  const client = await pool.connect();

  const schools = [
    { npsn: '20100001', name: 'SDN 01 Jakarta Pusat', province: 'DKI Jakarta', city: 'Jakarta Pusat', district: 'Menteng', jenjang: 'dikdas', status: 'NEGERI', priority: 85.5, lat: -6.1951, lng: 106.8451, userEmail: 'sdn01.jakarta@sekolah.id' },
    { npsn: '20200015', name: 'SDN 15 Bandung Timur', province: 'Jawa Barat', city: 'Bandung', district: 'Cibeunying Kidul', jenjang: 'dikdas', status: 'NEGERI', priority: 78.2, lat: -6.9175, lng: 107.6191, userEmail: 'sdn15.bandung@sekolah.id' },
    { npsn: '20300003', name: 'SMPN 3 Surabaya', province: 'Jawa Timur', city: 'Surabaya', district: 'Gubeng', jenjang: 'dikmen', status: 'NEGERI', priority: 72.8, lat: -7.2575, lng: 112.7521, userEmail: 'smpn3.surabaya@sekolah.id' },
    { npsn: '20400005', name: 'SMAN 5 Yogyakarta', province: 'DI Yogyakarta', city: 'Yogyakarta', district: 'Jetis', jenjang: 'dikmen', status: 'NEGERI', priority: 65.3, lat: -7.7956, lng: 110.3695, userEmail: 'sman5.yogya@sekolah.id' },
    { npsn: '20500022', name: 'SDN 22 Semarang Barat', province: 'Jawa Tengah', city: 'Semarang', district: 'Ngaliyan', jenjang: 'dikdas', status: 'NEGERI', priority: 88.7, lat: -7.0051, lng: 110.4381, userEmail: 'sdn22.semarang@sekolah.id' },
    { npsn: '20600007', name: 'SMPN 7 Medan', province: 'Sumatera Utara', city: 'Medan', district: 'Medan Barat', jenjang: 'dikmen', status: 'NEGERI', priority: 81.4, lat: 3.5952, lng: 98.6722, userEmail: 'smpn7.medan@sekolah.id' },
    { npsn: '20700009', name: 'SDN 09 Makassar', province: 'Sulawesi Selatan', city: 'Makassar', district: 'Tamalate', jenjang: 'dikdas', status: 'NEGERI', priority: 76.9, lat: -5.1477, lng: 119.4327, userEmail: 'sdn09.makassar@sekolah.id' },
    { npsn: '20800002', name: 'SMAN 2 Palembang', province: 'Sumatera Selatan', city: 'Palembang', district: 'Ilir Timur I', jenjang: 'dikmen', status: 'NEGERI', priority: 70.1, lat: -2.9761, lng: 104.7754, userEmail: 'sman2.palembang@sekolah.id' },
    { npsn: '20900005', name: 'SDN 05 Denpasar', province: 'Bali', city: 'Denpasar', district: 'Denpasar Barat', jenjang: 'dikdas', status: 'NEGERI', priority: 68.5, lat: -8.6705, lng: 115.2126, userEmail: 'sdn05.denpasar@sekolah.id' },
    { npsn: '21000001', name: 'SMPN 1 Manado', province: 'Sulawesi Utara', city: 'Manado', district: 'Wenang', jenjang: 'dikmen', status: 'NEGERI', priority: 74.3, lat: 1.4748, lng: 124.8421, userEmail: 'smpn1.manado@sekolah.id' },
  ];

  try {
    for (const school of schools) {
      const userResult = await client.query('SELECT id FROM users WHERE email = $1', [school.userEmail]);
      const userId = userResult.rows[0].id;

      await client.query(`
        INSERT INTO schools (npsn, name, province, city, district, jenjang, status, priority_score, latitude, longitude, user_id, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        school.npsn,
        school.name,
        school.province,
        school.city,
        school.district,
        school.jenjang,
        school.status,
        school.priority,
        school.lat,
        school.lng,
        userId,
        `Jl. Pendidikan No. 123, ${school.district}, ${school.city}`
      ]);
    }

    console.log(`  ✅ ${schools.length} schools created`);
  } finally {
    client.release();
  }
}

async function seedCaterings() {
  console.log('\n🍱 Seeding caterings...');

  const client = await pool.connect();

  const caterings = [
    { name: 'Katering Sehat Jaya', company: 'PT Sehat Jaya Abadi', phone: '021-5551234', email: 'sehat.jaya@katering.id', rating: 4.5, wallet: DUMMY_WALLETS[0] },
    { name: 'Nutrisi Prima Catering', company: 'CV Nutrisi Prima', phone: '022-7778899', email: 'nutrisi.prima@katering.id', rating: 4.7, wallet: DUMMY_WALLETS[1] },
    { name: 'Makanan Bergizi Center', company: 'PT Gizi Nusantara', phone: '031-3334455', email: 'makanan.bergizi@katering.id', rating: 4.3, wallet: DUMMY_WALLETS[2] },
    { name: 'Dapur Sehat Indonesia', company: 'CV Dapur Sehat', phone: '024-6667788', email: 'dapur.sehat@katering.id', rating: 4.6, wallet: DUMMY_WALLETS[3] },
    { name: 'Gizi Anak Nusantara', company: 'PT Anak Sehat', phone: '061-2223344', email: 'gizi.anak@katering.id', rating: 4.8, wallet: DUMMY_WALLETS[4] },
  ];

  try {
    for (const catering of caterings) {
      const userResult = await client.query('SELECT id FROM users WHERE email = $1', [catering.email]);
      const userId = userResult.rows[0].id;

      await client.query(`
        INSERT INTO caterings (name, company_name, phone, email, wallet_address, rating, user_id, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        catering.name,
        catering.company,
        catering.phone,
        catering.email,
        catering.wallet,
        catering.rating,
        userId,
        'Jl. Industri No. 456, Jakarta'
      ]);
    }

    console.log(`  ✅ ${caterings.length} caterings created`);
  } finally {
    client.release();
  }
}

async function seedDeliveries() {
  console.log('\n🚚 Seeding deliveries...');

  const client = await pool.connect();

  try {
    const schools = await client.query('SELECT id FROM schools LIMIT 10');
    const caterings = await client.query('SELECT id FROM caterings LIMIT 5');

    const statuses = ['pending', 'scheduled', 'delivered', 'verified'];
    const today = new Date();
    let deliveryCount = 0;

    // Create deliveries for the past 7 days and next 3 days
    for (let dayOffset = -7; dayOffset <= 3; dayOffset++) {
      const deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + dayOffset);

      // Random deliveries per day (2-4 deliveries)
      const deliveriesPerDay = Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < deliveriesPerDay; i++) {
        const schoolId = schools.rows[Math.floor(Math.random() * schools.rows.length)].id;
        const cateringId = caterings.rows[Math.floor(Math.random() * caterings.rows.length)].id;
        const portions = Math.floor(Math.random() * 100) + 50; // 50-150 portions
        const pricePerPortion = 15000; // Rp 15,000 per porsi
        const amount = portions * pricePerPortion;

        // Determine status based on date
        let status;
        if (dayOffset < -2) {
          status = 'verified'; // Past deliveries are verified
        } else if (dayOffset < 0) {
          status = Math.random() > 0.3 ? 'delivered' : 'verified'; // Recent past
        } else if (dayOffset === 0) {
          status = 'scheduled'; // Today
        } else {
          status = 'pending'; // Future
        }

        await client.query(`
          INSERT INTO deliveries (school_id, catering_id, delivery_date, portions, amount, status, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          schoolId,
          cateringId,
          deliveryDate.toISOString().split('T')[0],
          portions,
          amount,
          status,
          `Pengiriman ${portions} porsi untuk tanggal ${deliveryDate.toISOString().split('T')[0]}`
        ]);

        deliveryCount++;
      }
    }

    console.log(`  ✅ ${deliveryCount} deliveries created`);
  } finally {
    client.release();
  }
}

async function seedEscrowTransactions() {
  console.log('\n🔒 Seeding escrow transactions...');

  const client = await pool.connect();

  try {
    // Get deliveries that are not pending (meaning escrow was created)
    const deliveries = await client.query(`
      SELECT d.id, d.school_id, d.catering_id, d.amount, d.status, d.delivery_date
      FROM deliveries d
      WHERE d.status != 'pending'
      ORDER BY d.delivery_date DESC
      LIMIT 20
    `);

    let escrowCount = 0;

    for (const delivery of deliveries.rows) {
      // Generate escrow_id (simulate blockchain hash)
      const escrowId = `0x${Math.random().toString(16).substring(2, 66)}`;
      const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      const blockNumber = Math.floor(Math.random() * 1000000) + 5000000;

      // Determine escrow status based on delivery status
      let escrowStatus;
      let releasedAt = null;

      if (delivery.status === 'verified') {
        escrowStatus = 'released';
        releasedAt = new Date(delivery.delivery_date);
        releasedAt.setHours(releasedAt.getHours() + 12); // Released 12 hours after delivery
      } else {
        escrowStatus = 'locked';
      }

      const lockedAt = new Date(delivery.delivery_date);
      lockedAt.setDate(lockedAt.getDate() - 1); // Locked 1 day before delivery

      await client.query(`
        INSERT INTO escrow_transactions
        (escrow_id, delivery_id, school_id, catering_id, amount, status, tx_hash, block_number, locked_at, released_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        escrowId,
        delivery.id,
        delivery.school_id,
        delivery.catering_id,
        delivery.amount,
        escrowStatus,
        txHash,
        blockNumber,
        lockedAt,
        releasedAt
      ]);

      escrowCount++;
    }

    console.log(`  ✅ ${escrowCount} escrow transactions created`);
  } finally {
    client.release();
  }
}

async function seedVerifications() {
  console.log('\n✅ Seeding verifications...');

  const client = await pool.connect();

  try {
    // Get delivered or verified deliveries
    const deliveries = await client.query(`
      SELECT d.id, d.school_id, d.portions, s.user_id
      FROM deliveries d
      JOIN schools s ON d.school_id = s.id
      WHERE d.status IN ('delivered', 'verified')
      ORDER BY d.delivery_date DESC
      LIMIT 20
    `);

    let verificationCount = 0;

    for (const delivery of deliveries.rows) {
      const portionsReceived = delivery.portions - Math.floor(Math.random() * 5); // Slight variation
      const qualityRating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
      const status = 'approved';

      const notes = [
        'Makanan diterima dengan baik, kualitas sesuai standar',
        'Pengiriman tepat waktu, makanan masih hangat',
        'Porsi sesuai, anak-anak suka',
        'Kualitas bagus, menu bervariasi',
        'Pengiriman lancar, tidak ada masalah'
      ];

      await client.query(`
        INSERT INTO verifications
        (delivery_id, school_id, verified_by, status, portions_received, quality_rating, notes, verified_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '1 hour')
      `, [
        delivery.id,
        delivery.school_id,
        delivery.user_id,
        status,
        portionsReceived,
        qualityRating,
        notes[Math.floor(Math.random() * notes.length)]
      ]);

      verificationCount++;
    }

    console.log(`  ✅ ${verificationCount} verifications created`);
  } finally {
    client.release();
  }
}

async function seedIssues() {
  console.log('\n⚠️  Seeding issues...');

  const client = await pool.connect();

  try {
    const deliveries = await client.query(`
      SELECT d.id, s.user_id as school_user_id
      FROM deliveries d
      JOIN schools s ON d.school_id = s.id
      WHERE d.status IN ('delivered', 'scheduled')
      ORDER BY RANDOM()
      LIMIT 8
    `);

    const issueTypes = [
      { type: 'late_delivery', severity: 'medium', desc: 'Pengiriman terlambat 30 menit dari jadwal' },
      { type: 'wrong_portions', severity: 'high', desc: 'Porsi yang diterima kurang dari pesanan' },
      { type: 'quality_issue', severity: 'high', desc: 'Kualitas makanan tidak sesuai standar' },
      { type: 'late_delivery', severity: 'low', desc: 'Terlambat 15 menit' },
    ];

    let issueCount = 0;

    for (const delivery of deliveries.rows) {
      const issue = issueTypes[Math.floor(Math.random() * issueTypes.length)];

      if (!issue) continue; // Skip if no issue (shouldn't happen)

      const status = Math.random() > 0.5 ? 'resolved' : 'investigating';

      let resolvedAt = null;
      let resolutionNotes = null;

      if (status === 'resolved') {
        resolvedAt = new Date();
        resolutionNotes = 'Masalah telah ditindaklanjuti dengan vendor. Vendor berkomitmen untuk perbaikan.';
      }

      await client.query(`
        INSERT INTO issues
        (delivery_id, reported_by, issue_type, description, severity, status, resolution_notes, resolved_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        delivery.id,
        delivery.school_user_id,
        issue.type,
        issue.desc,
        issue.severity,
        status,
        resolutionNotes,
        resolvedAt
      ]);

      issueCount++;
    }

    console.log(`  ✅ ${issueCount} issues created`);
  } finally {
    client.release();
  }
}

async function updateStats() {
  console.log('\n📊 Updating statistics...');

  const client = await pool.connect();

  try {
    // Update catering total_deliveries
    await client.query(`
      UPDATE caterings c
      SET total_deliveries = (
        SELECT COUNT(*) FROM deliveries d WHERE d.catering_id = c.id
      )
    `);

    console.log('  ✅ Statistics updated');
  } finally {
    client.release();
  }
}

async function printSummary() {
  console.log('\n📋 SEEDING SUMMARY');
  console.log('═'.repeat(50));

  const client = await pool.connect();

  try {
    const users = await client.query('SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role');
    const schools = await client.query('SELECT COUNT(*) as count FROM schools');
    const caterings = await client.query('SELECT COUNT(*) as count FROM caterings');
    const deliveries = await client.query('SELECT status, COUNT(*) as count FROM deliveries GROUP BY status ORDER BY status');
    const escrows = await client.query('SELECT status, COUNT(*) as count FROM escrow_transactions GROUP BY status ORDER BY status');
    const verifications = await client.query('SELECT COUNT(*) as count FROM verifications');
    const issues = await client.query('SELECT status, COUNT(*) as count FROM issues GROUP BY status ORDER BY status');

    console.log('\n👥 USERS:');
    users.rows.forEach(row => {
      console.log(`   ${row.role.padEnd(10)} : ${row.count}`);
    });

    console.log(`\n🏫 SCHOOLS        : ${schools.rows[0].count}`);
    console.log(`🍱 CATERINGS      : ${caterings.rows[0].count}`);

    console.log('\n🚚 DELIVERIES:');
    deliveries.rows.forEach(row => {
      console.log(`   ${row.status.padEnd(10)} : ${row.count}`);
    });

    console.log('\n🔒 ESCROW TRANSACTIONS:');
    escrows.rows.forEach(row => {
      console.log(`   ${row.status.padEnd(10)} : ${row.count}`);
    });

    console.log(`\n✅ VERIFICATIONS  : ${verifications.rows[0].count}`);

    console.log('\n⚠️  ISSUES:');
    issues.rows.forEach(row => {
      console.log(`   ${row.status.padEnd(15)} : ${row.count}`);
    });

    console.log('\n' + '═'.repeat(50));
    console.log('\n🎉 SEEDING COMPLETED SUCCESSFULLY!\n');
    console.log('📝 Login credentials (semua password: password123):');
    console.log('   Admin      : admin@nutrichain.id');
    console.log('   Pemerintah : pemerintah@mbg.go.id');
    console.log('   School     : sdn01.jakarta@sekolah.id');
    console.log('   Catering   : sehat.jaya@katering.id');
    console.log('\n');

  } finally {
    client.release();
  }
}

async function main() {
  console.log('\n🌱 NUTRICHAIN DATABASE SEEDER');
  console.log('═'.repeat(50));

  try {
    await clearDatabase();
    await seedUsers();
    await seedSchools();
    await seedCaterings();
    await seedDeliveries();
    await seedEscrowTransactions();
    await seedVerifications();
    await seedIssues();
    await updateStats();
    await printSummary();
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
