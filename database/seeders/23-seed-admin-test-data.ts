/**
 * ============================================================================
 * SEEDING SCRIPT 23: ADMIN TEST DATA (Anomalies, Escrow, Manual Review)
 * ============================================================================
 *
 * Purpose: Seed test data for admin pages - anomalies, escrow, and manual review
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: users, schools, caterings (from 01-seed-users.ts)
 *
 * Run: npx ts-node database/seeders/23-seed-admin-test-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SeedingStats {
  totalAdmins: number
  totalSchools: number
  totalCaterings: number
  budgetAllocationsCreated: number
  allocationsCreated: number
  deliveriesCreated: number
  anomaliesCreated: number
  escrowTransactionsCreated: number
  aiAnalysesCreated: number
  verificationsCreated: number
  errors: Array<{ step: string; error: string }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // How many records to create
  NUM_BUDGET_ALLOCATIONS: 2,
  NUM_SCHOOLS_TO_USE: 1000, // Fetch all schools
  NUM_CATERINGS_TO_USE: 1000, // Fetch all caterings
  NUM_ADMINS_TO_USE: 100, // Fetch all admins

  // Generate data for all entities
  ALLOCATIONS_PER_SCHOOL: 1, // How many allocations per school
  DELIVERIES_PER_ALLOCATION: 1, // How many deliveries per allocation
  ANOMALY_RATE: 0.15, // 15% of deliveries will have anomalies

  // Skip detailed test data for faster seeding (only create allocations and deliveries)
  SKIP_ANOMALIES: true,
  SKIP_ESCROW: true,
  SKIP_AI_ANALYSES: true,
  SKIP_VERIFICATIONS: true,
}

// ============================================================================
// UTILITIES
// ============================================================================

class Logger {
  private startTime: number = Date.now()

  log(message: string) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2)
    console.log(`[${elapsed}s] ${message}`)
  }

  error(message: string, error?: any) {
    console.error(`❌ ERROR: ${message}`)
    if (error) console.error(error)
  }

  success(message: string) {
    console.log(`✅ ${message}`)
  }

  section(title: string) {
    console.log('\n' + '='.repeat(80))
    console.log(title)
    console.log('='.repeat(80))
  }
}

const logger = new Logger()

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedAdminTestData() {
  logger.section('SEEDING SCRIPT 23: ADMIN TEST DATA')

  const stats: SeedingStats = {
    totalAdmins: 0,
    totalSchools: 0,
    totalCaterings: 0,
    budgetAllocationsCreated: 0,
    allocationsCreated: 0,
    deliveriesCreated: 0,
    anomaliesCreated: 0,
    escrowTransactionsCreated: 0,
    aiAnalysesCreated: 0,
    verificationsCreated: 0,
    errors: [],
  }

  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_KEY) {
    logger.error('Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    // ========================================================================
    // STEP 1: FETCH EXISTING DATA
    // ========================================================================
    logger.section('STEP 1: Fetching existing users, schools, and caterings')

    // Fetch admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'admin')
      .limit(CONFIG.NUM_ADMINS_TO_USE)

    if (adminError) throw new Error(`Failed to fetch admin users: ${adminError.message}`)
    if (!adminUsers || adminUsers.length === 0) {
      throw new Error('No admin users found. Please run 01-seed-users.ts first.')
    }

    stats.totalAdmins = adminUsers.length
    logger.success(`Found ${adminUsers.length} admin users`)

    // Fetch schools
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, npsn, name, user_id')
      .limit(CONFIG.NUM_SCHOOLS_TO_USE)

    if (schoolsError) throw new Error(`Failed to fetch schools: ${schoolsError.message}`)
    if (!schools || schools.length === 0) {
      throw new Error('No schools found. Please run 01-seed-users.ts first.')
    }

    stats.totalSchools = schools.length
    logger.success(`Found ${schools.length} schools`)

    // Fetch caterings
    const { data: caterings, error: cateringsError } = await supabase
      .from('caterings')
      .select('id, name, wallet_address, user_id')
      .limit(CONFIG.NUM_CATERINGS_TO_USE)

    if (cateringsError) throw new Error(`Failed to fetch caterings: ${cateringsError.message}`)
    if (!caterings || caterings.length === 0) {
      throw new Error('No caterings found. Please run 01-seed-users.ts first.')
    }

    stats.totalCaterings = caterings.length
    logger.success(`Found ${caterings.length} caterings`)

    // ========================================================================
    // STEP 2: CREATE BUDGET ALLOCATIONS
    // ========================================================================
    logger.section('STEP 2: Creating budget allocations')

    const budgetAllocations = [
      {
        fiscal_year: 2025,
        fiscal_quarter: 1,
        province: 'Jawa Barat',
        city: 'Bogor',
        allocation_type: 'regular',
        source_fund: 'APBN',
        total_budget: 5000000000,
        allocated_amount: 4500000000,
        disbursed_amount: 3200000000,
        remaining_amount: 1300000000,
        target_schools: 50,
        target_students: 15000,
        target_portions: 900000,
        status: 'active',
        approved_by: adminUsers[0].id,
        approved_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        fiscal_year: 2025,
        fiscal_quarter: 1,
        province: 'Jawa Barat',
        city: 'Depok',
        allocation_type: 'regular',
        source_fund: 'APBD',
        total_budget: 3500000000,
        allocated_amount: 3200000000,
        disbursed_amount: 2100000000,
        remaining_amount: 1100000000,
        target_schools: 35,
        target_students: 10500,
        target_portions: 630000,
        status: 'active',
        approved_by: adminUsers[0].id,
        approved_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    const { data: insertedBudgets, error: budgetError } = await supabase
      .from('budget_allocations')
      .insert(budgetAllocations)
      .select()

    if (budgetError) {
      logger.error('Failed to create budget allocations', budgetError)
      stats.errors.push({ step: 'budget_allocations', error: budgetError.message })
    } else {
      stats.budgetAllocationsCreated = insertedBudgets?.length || 0
      logger.success(`Created ${stats.budgetAllocationsCreated} budget allocations`)
    }

    if (!insertedBudgets || insertedBudgets.length === 0) {
      throw new Error('Failed to create budget allocations')
    }

    // ========================================================================
    // STEP 3: CREATE ALLOCATIONS
    // ========================================================================
    logger.section('STEP 3: Creating allocations (dynamically for all schools)')

    // Generate allocations dynamically for all schools
    const allocations = []
    const statuses = ['LOCKED', 'LOCKED', 'LOCKED', 'RELEASED', 'PLANNED']

    for (let i = 0; i < schools.length; i++) {
      for (let j = 0; j < CONFIG.ALLOCATIONS_PER_SCHOOL; j++) {
        const school = schools[i]
        const catering = caterings[i % caterings.length] // Distribute caterings evenly
        const budget = insertedBudgets[i % insertedBudgets.length]
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const adminUser = adminUsers[i % adminUsers.length]
        const daysAgo = Math.floor(Math.random() * 60) + 1 // 1-60 days ago

        const allocation: any = {
          allocation_id: `ALLOC-2025-Q1-${String(i * CONFIG.ALLOCATIONS_PER_SCHOOL + j + 1).padStart(6, '0')}`,
          school_id: school.id,
          catering_id: catering.id,
          budget_id: budget.id,
          amount: Math.floor(Math.random() * 30000000) + 30000000, // 30-60 million IDR
          currency: 'IDR',
          status: status,
          created_by: adminUser.id,
          blockchain_confirmed: status !== 'PLANNED',
        }

        if (status !== 'PLANNED') {
          allocation.locked_at = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
          allocation.tx_hash_lock = `0x${Math.random().toString(36).substring(2, 15)}...lock${i}`
          allocation.approved_by = adminUser.id
          allocation.approved_at = new Date(Date.now() - (daysAgo + 5) * 24 * 60 * 60 * 1000).toISOString()
        }

        if (status === 'RELEASED') {
          allocation.released_at = new Date(Date.now() - Math.floor(daysAgo / 2) * 24 * 60 * 60 * 1000).toISOString()
          allocation.tx_hash_release = `0x${Math.random().toString(36).substring(2, 15)}...release${i}`
        }

        allocations.push(allocation)
      }
    }

    logger.log(`Inserting ${allocations.length} allocations in batches...`)

    // Insert in batches to avoid timeout
    const BATCH_SIZE = 500
    let insertedAllocations: any[] = []

    for (let i = 0; i < allocations.length; i += BATCH_SIZE) {
      const batch = allocations.slice(i, i + BATCH_SIZE)
      logger.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allocations.length / BATCH_SIZE)} (${batch.length} records)...`)

      const { data: batchData, error: allocError } = await supabase
        .from('allocations')
        .insert(batch)
        .select()

      if (allocError) {
        logger.error('Failed to create allocations batch', allocError)
        stats.errors.push({ step: 'allocations', error: allocError.message })
        break
      } else {
        insertedAllocations = insertedAllocations.concat(batchData || [])
        logger.log(`✓ Batch inserted successfully`)
      }
    }

    stats.allocationsCreated = insertedAllocations.length
    logger.success(`Created ${stats.allocationsCreated} allocations`)

    if (insertedAllocations.length === 0) {
      throw new Error('Failed to create allocations')
    }

    // ========================================================================
    // STEP 4: CREATE DELIVERIES
    // ========================================================================
    logger.section('STEP 4: Creating deliveries (dynamically for all allocations)')

    // Generate deliveries dynamically for allocations (only LOCKED and RELEASED allocations get deliveries)
    const deliveries = []
    const deliveryStatuses = ['delivered', 'delivered', 'delivered', 'verified', 'pending']
    const driverNames = ['Joko Susanto', 'Rudi Hermawan', 'Andi Wijaya', 'Bambang Setiawan', 'Siti Rahayu', 'Ahmad Fauzi']

    const lockedOrReleasedAllocations = insertedAllocations.filter(a => a.status === 'LOCKED' || a.status === 'RELEASED')

    for (let i = 0; i < lockedOrReleasedAllocations.length; i++) {
      for (let j = 0; j < CONFIG.DELIVERIES_PER_ALLOCATION; j++) {
        const allocation = lockedOrReleasedAllocations[i]
        const daysAgo = Math.floor(Math.random() * 30) + 1
        const status = deliveryStatuses[Math.floor(Math.random() * deliveryStatuses.length)]
        const portions = Math.floor(Math.random() * 200) + 300 // 300-500 portions
        const pricePerPortion = 15000 // IDR 15,000 per portion

        const delivery: any = {
          allocation_id: allocation.id,
          school_id: allocation.school_id,
          catering_id: allocation.catering_id,
          delivery_date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          portions: portions,
          amount: portions * pricePerPortion,
          status: status,
          driver_name: driverNames[Math.floor(Math.random() * driverNames.length)],
          driver_phone: `+62${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          vehicle_number: `B ${Math.floor(Math.random() * 9000) + 1000} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
          notes: status === 'verified' ? 'Pengiriman sukses dan sudah diverifikasi' : 'Pengiriman normal',
        }

        if (status !== 'pending') {
          delivery.delivered_at = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
        }

        deliveries.push(delivery)
      }
    }

    logger.log(`Inserting ${deliveries.length} deliveries in batches...`)

    // Insert in batches
    let insertedDeliveries: any[] = []

    for (let i = 0; i < deliveries.length; i += BATCH_SIZE) {
      const batch = deliveries.slice(i, i + BATCH_SIZE)
      logger.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(deliveries.length / BATCH_SIZE)} (${batch.length} records)...`)

      const { data: batchData, error: deliveryError } = await supabase
        .from('deliveries')
        .insert(batch)
        .select()

      if (deliveryError) {
        logger.error('Failed to create deliveries batch', deliveryError)
        stats.errors.push({ step: 'deliveries', error: deliveryError.message })
        break
      } else {
        insertedDeliveries = insertedDeliveries.concat(batchData || [])
        logger.log(`✓ Batch inserted successfully`)
      }
    }

    stats.deliveriesCreated = insertedDeliveries.length
    logger.success(`Created ${stats.deliveriesCreated} deliveries`)

    if (insertedDeliveries.length === 0) {
      throw new Error('Failed to create deliveries')
    }

    // ========================================================================
    // STEP 5: CREATE ANOMALY ALERTS (Sample based on ANOMALY_RATE)
    // ========================================================================
    let insertedAnomalies: any[] = []

    if (CONFIG.SKIP_ANOMALIES) {
      logger.section('STEP 5: Skipping anomaly alerts (SKIP_ANOMALIES = true)')
      stats.anomaliesCreated = 0
    } else {
      logger.section(`STEP 5: Creating anomaly alerts (sampling ${CONFIG.ANOMALY_RATE * 100}% of deliveries)`)

      const anomalies = [
      {
        type: 'quality_fraud',
        severity: 'critical',
        title: 'Pola Kualitas Makanan Mencurigakan',
        description: `${caterings[2].name} memiliki pola penurunan kualitas drastis setelah kontrak disetujui. Rating turun dari 4.5 ke 2.8 dalam 2 minggu.`,
        catering_id: caterings[2].id,
        confidence_score: 0.89,
        detected_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'investigating',
        suspicious_patterns: ['sudden_quality_drop', 'pattern_after_contract', 'multiple_complaints'],
        data_points: { avg_quality_before: 4.5, avg_quality_after: 2.8, complaints_count: 12, delivery_count: 15 },
        recommendation: 'immediate_audit',
        investigated_by: adminUsers.length > 2 ? adminUsers[2].id : adminUsers[0].id,
        investigated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        type: 'delivery_fraud',
        severity: 'critical',
        title: 'Manipulasi Porsi Pengiriman',
        description: `${caterings[3] ? caterings[3].name : caterings[0].name} melaporkan pengiriman 800 porsi tetapi verifikasi sekolah hanya menerima 650 porsi (81% dari laporan).`,
        catering_id: caterings[3] ? caterings[3].id : caterings[0].id,
        school_id: schools[0].id,
        confidence_score: 0.92,
        detected_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        status: 'new',
        suspicious_patterns: ['portion_mismatch', 'systematic_underdelivery', 'photo_evidence_conflict'],
        data_points: { reported_portions: 800, verified_portions: 650, discrepancy_rate: 0.19, financial_impact: 2250000 },
        recommendation: 'suspend_payment',
      },
      {
        type: 'financial_anomaly',
        severity: 'high',
        title: 'Keterlambatan Pencairan Dana Berulang',
        description: `Alokasi ALLOC-2025-Q1-003 terkunci lebih dari 30 hari tanpa pencairan. Pola serupa terdeteksi pada 3 alokasi lainnya untuk catering yang sama.`,
        catering_id: caterings[2].id,
        school_id: schools[2].id,
        confidence_score: 0.76,
        detected_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'investigating',
        suspicious_patterns: ['prolonged_lock', 'payment_delay_pattern', 'delivery_completion_verified'],
        data_points: { locked_days: 35, expected_release_days: 7, similar_cases: 3, total_locked_amount: 156000000 },
        recommendation: 'review_contract',
        investigated_by: adminUsers.length > 2 ? adminUsers[2].id : adminUsers[0].id,
        investigated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        resolution_notes: 'Sedang dikaji oleh tim legal',
      },
      {
        type: 'quality_trend',
        severity: 'medium',
        title: 'Tren Penurunan Kualitas Bertahap',
        description: `${caterings[1].name} menunjukkan tren penurunan rating kualitas makanan secara konsisten dari 4.2 ke 3.8 dalam 3 bulan terakhir.`,
        catering_id: caterings[1].id,
        confidence_score: 0.68,
        detected_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'resolved',
        suspicious_patterns: ['gradual_decline', 'seasonal_pattern', 'ingredient_quality'],
        data_points: { month_1_rating: 4.2, month_2_rating: 4.0, month_3_rating: 3.8, trend_slope: -0.2 },
        recommendation: 'quality_audit',
        investigated_by: adminUsers.length > 1 ? adminUsers[1].id : adminUsers[0].id,
        investigated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        resolution_notes: 'Katering telah melakukan perbaikan supply chain. Kualitas kembali membaik ke rating 4.1.',
      },
      {
        type: 'hygiene_violation',
        severity: 'high',
        title: 'Pelanggaran Standar Kebersihan',
        description: 'Foto verifikasi dari 3 pengiriman terakhir menunjukkan kemasan makanan yang tidak higienis dan tidak sesuai standar BPOM.',
        catering_id: caterings[3] ? caterings[3].id : caterings[0].id,
        school_id: schools[1].id,
        confidence_score: 0.84,
        detected_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        status: 'investigating',
        suspicious_patterns: ['hygiene_standard_breach', 'packaging_violation', 'multiple_occurrences'],
        data_points: { violation_count: 3, affected_deliveries: [], health_risk_level: 'medium' },
        recommendation: 'immediate_inspection',
        investigated_by: adminUsers.length > 1 ? adminUsers[1].id : adminUsers[0].id,
        investigated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        type: 'delivery_delay',
        severity: 'low',
        title: 'Keterlambatan Pengiriman Minor',
        description: `${caterings[0].name} mengalami keterlambatan pengiriman 10-20 menit pada 5 dari 10 pengiriman terakhir.`,
        catering_id: caterings[0].id,
        confidence_score: 0.55,
        detected_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'resolved',
        suspicious_patterns: ['minor_delay', 'traffic_related', 'consistent_pattern'],
        data_points: { avg_delay_minutes: 15, delayed_deliveries: 5, total_deliveries: 10, delay_rate: 0.5 },
        recommendation: 'route_optimization',
        investigated_by: adminUsers.length > 1 ? adminUsers[1].id : adminUsers[0].id,
        investigated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        resolution_notes: 'Katering telah menyesuaikan jadwal keberangkatan lebih pagi. Masalah teratasi.',
      },
    ]

      const { data: batchAnomalies, error: anomalyError } = await supabase
        .from('anomaly_alerts')
        .insert(anomalies)
        .select()

      if (anomalyError) {
        logger.error('Failed to create anomaly alerts', anomalyError)
        stats.errors.push({ step: 'anomaly_alerts', error: anomalyError.message })
      } else {
        insertedAnomalies = batchAnomalies || []
        stats.anomaliesCreated = insertedAnomalies.length
        logger.success(`Created ${stats.anomaliesCreated} anomaly alerts`)
      }
    }

    // ========================================================================
    // STEP 6: CREATE ESCROW TRANSACTIONS
    // ========================================================================
    let insertedEscrowTxs: any[] = []

    if (CONFIG.SKIP_ESCROW) {
      logger.section('STEP 6: Skipping escrow transactions (SKIP_ESCROW = true)')
      stats.escrowTransactionsCreated = 0
    } else {
      logger.section('STEP 6: Creating escrow transactions')

    const escrowTxs = [
      {
        allocation_id: insertedAllocations[0].id,
        transaction_type: 'LOCK',
        amount: 45000000,
        currency: 'IDR',
        status: 'CONFIRMED',
        blockchain_tx_hash: '0x7a8f3e9d1c5b4a6e2f8d9c3b5a7e1f4d6c8b2a9e5d7c3f1a4b6e8d2c5a7e9f1b',
        blockchain_block_number: 18234567,
        blockchain_confirmed: true,
        from_address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        to_address: '0xSMARTCONTRACT1234567890abcdef1234567890',
        smart_contract_address: '0xCONTRACT1234567890abcdef1234567890abcdef',
        gas_used: 145000,
        gas_price_gwei: 25.5,
        executed_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        confirmed_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        retry_count: 0,
        metadata: { allocation_id: 'ALLOC-2025-Q1-001', school_npsn: schools[0].npsn, catering_name: caterings[0].name },
      },
      {
        allocation_id: insertedAllocations[1].id,
        transaction_type: 'LOCK',
        amount: 38000000,
        currency: 'IDR',
        status: 'CONFIRMED',
        blockchain_tx_hash: '0x2b9e4f0a3d6c5b7e9f1a4c6d8e0b2f5a7c9e1d3b5a7e9f2c4a6b8d0e2f4a6c8',
        blockchain_block_number: 18256789,
        blockchain_confirmed: true,
        from_address: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
        to_address: '0xSMARTCONTRACT1234567890abcdef1234567890',
        smart_contract_address: '0xCONTRACT1234567890abcdef1234567890abcdef',
        gas_used: 142000,
        gas_price_gwei: 23.8,
        executed_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        confirmed_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        retry_count: 0,
        metadata: { allocation_id: 'ALLOC-2025-Q1-002', school_npsn: schools[1].npsn, catering_name: caterings[1].name },
      },
      {
        allocation_id: insertedAllocations[2].id,
        transaction_type: 'LOCK',
        amount: 52000000,
        currency: 'IDR',
        status: 'CONFIRMED',
        blockchain_tx_hash: '0x3c0f5a1e4d7c6b8e0f2a5c7d9e1b3f6a8c0e2d4b6a8e0f3c5a7b9d1e3f5a7c9',
        blockchain_block_number: 18278901,
        blockchain_confirmed: true,
        from_address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
        to_address: '0xSMARTCONTRACT1234567890abcdef1234567890',
        smart_contract_address: '0xCONTRACT1234567890abcdef1234567890abcdef',
        gas_used: 148000,
        gas_price_gwei: 27.2,
        executed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        confirmed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        retry_count: 0,
        metadata: { allocation_id: 'ALLOC-2025-Q1-003', school_npsn: schools[2].npsn, catering_name: caterings[2].name, anomaly_flag: true },
      },
      {
        allocation_id: insertedAllocations[3].id,
        transaction_type: 'RELEASE',
        amount: 41000000,
        currency: 'IDR',
        status: 'CONFIRMED',
        blockchain_tx_hash: '0x4d1f6a2e5d8c7b9e1f3a6c8d0e2b4f7a9c1e3d5b7a9e1f4c6a8b0d2e4f6a8c0',
        blockchain_block_number: 18312345,
        blockchain_confirmed: true,
        from_address: '0xSMARTCONTRACT1234567890abcdef1234567890',
        to_address: caterings[0].wallet_address,
        smart_contract_address: '0xCONTRACT1234567890abcdef1234567890abcdef',
        gas_used: 98000,
        gas_price_gwei: 22.1,
        executed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        confirmed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        retry_count: 0,
        metadata: { allocation_id: 'ALLOC-2025-Q1-004', school_npsn: schools[3] ? schools[3].npsn : schools[0].npsn, catering_name: caterings[0].name, verified: true },
      },
      {
        allocation_id: insertedAllocations[0].id,
        transaction_type: 'LOCK',
        amount: 45000000,
        currency: 'IDR',
        status: 'PENDING',
        blockchain_tx_hash: '0x5e2f7a3e6d9c8b0e2f4a7c9d1e3b5f8a0c2e4d6b8a0e2f5c7a9b1d3e5f7a9c1',
        blockchain_block_number: 18334567,
        blockchain_confirmed: false,
        from_address: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
        to_address: '0xSMARTCONTRACT1234567890abcdef1234567890',
        smart_contract_address: '0xCONTRACT1234567890abcdef1234567890abcdef',
        gas_price_gwei: 26.3,
        executed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        retry_count: 0,
        metadata: { allocation_id: 'ALLOC-2025-Q1-001-B', school_npsn: schools[0].npsn, catering_name: caterings[0].name, status: 'awaiting_confirmation' },
      },
      {
        allocation_id: insertedAllocations[4].id,
        transaction_type: 'LOCK',
        amount: 35000000,
        currency: 'IDR',
        status: 'FAILED',
        blockchain_tx_hash: '0x6e3f8a4e7d0c9b1e3f5a8c0d2e4b6f9a1c3e5d7b9a1e3f6c8a0b2d4e6f8a0c2',
        blockchain_block_number: 18345678,
        blockchain_confirmed: false,
        from_address: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
        to_address: '0xSMARTCONTRACT1234567890abcdef1234567890',
        smart_contract_address: '0xCONTRACT1234567890abcdef1234567890abcdef',
        gas_used: 0,
        gas_price_gwei: 24.7,
        executed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        retry_count: 2,
        error_message: 'Gas estimation failed',
        metadata: { allocation_id: 'ALLOC-2025-Q1-005', school_npsn: schools[0].npsn, catering_name: caterings[3] ? caterings[3].name : caterings[0].name },
      },
    ]

      const { data: batchEscrowTxs, error: escrowError } = await supabase
        .from('escrow_transactions')
        .insert(escrowTxs)
        .select()

      if (escrowError) {
        logger.error('Failed to create escrow transactions', escrowError)
        stats.errors.push({ step: 'escrow_transactions', error: escrowError.message })
      } else {
        insertedEscrowTxs = batchEscrowTxs || []
        stats.escrowTransactionsCreated = insertedEscrowTxs.length
        logger.success(`Created ${stats.escrowTransactionsCreated} escrow transactions`)
      }
    }

    // ========================================================================
    // STEP 7: CREATE AI FOOD ANALYSES
    // ========================================================================
    let insertedAnalyses: any[] = []

    if (CONFIG.SKIP_AI_ANALYSES) {
      logger.section('STEP 7: Skipping AI food analyses (SKIP_AI_ANALYSES = true)')
      stats.aiAnalysesCreated = 0
    } else {
      logger.section('STEP 7: Creating AI food analyses')

    const aiAnalyses = [
      {
        delivery_id: insertedDeliveries[2].id,
        menu_match: true,
        quality_score: 62,
        freshness_score: 55,
        presentation_score: 60,
        hygiene_score: 58,
        estimated_calories: 520,
        estimated_protein: 18,
        estimated_carbs: 68,
        detected_items: ['nasi putih', 'ayam goreng', 'sayur sop', 'tempe goreng', 'buah pisang'],
        reasoning: 'Makanan terdeteksi lengkap sesuai menu standar BGN, namun ada kekhawatiran pada aspek kesegaran. Sayur terlihat sedikit layu dan kemasan kurang rapi. Porsi protein mencukupi tetapi presentasi kurang menarik.',
        issues: ['freshness_concern', 'presentation_poor', 'packaging_issue'],
        warnings: ['Sayur terlihat tidak fresh', 'Kemasan tidak rapi', 'Hygiene score dibawah standar (58/100)'],
        recommendations: ['Tingkatkan quality control', 'Gunakan kemasan yang lebih baik', 'Pastikan sayuran fresh setiap hari'],
        portion_estimate: 520,
        portion_confidence: 0.78,
        portion_match: true,
        quality_acceptable: false,
        has_vegetables: true,
        meets_bgn_standards: false,
        confidence: 0.78,
        needs_manual_review: true,
        manual_review_status: 'pending',
        analyzed_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        delivery_id: insertedDeliveries[1].id,
        menu_match: true,
        quality_score: 72,
        freshness_score: 75,
        presentation_score: 70,
        hygiene_score: 68,
        estimated_calories: 480,
        estimated_protein: 16,
        estimated_carbs: 62,
        detected_items: ['nasi putih', 'ikan goreng', 'sayur bayam', 'tahu goreng', 'buah jeruk'],
        reasoning: 'Menu lengkap namun AI mendeteksi kemungkinan porsi lebih kecil dari standar. Estimasi porsi 380 namun seharusnya 450 berdasarkan kontrak.',
        issues: ['portion_size_concern', 'quantity_mismatch'],
        warnings: ['Porsi terlihat kurang dari standar', 'Discrepancy antara laporan (380) dan kontrak (450)'],
        recommendations: ['Verifikasi ulang jumlah porsi', 'Timbang sample porsi', 'Cek kepatuhan kontrak'],
        portion_estimate: 380,
        portion_confidence: 0.82,
        portion_match: false,
        quality_acceptable: true,
        has_vegetables: true,
        meets_bgn_standards: true,
        confidence: 0.82,
        needs_manual_review: true,
        manual_review_status: 'pending',
        analyzed_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      },
      {
        delivery_id: insertedDeliveries[4].id,
        menu_match: false,
        quality_score: 58,
        freshness_score: 70,
        presentation_score: 65,
        hygiene_score: 55,
        estimated_calories: 550,
        estimated_protein: 22,
        estimated_carbs: 75,
        detected_items: ['nasi putih', 'ayam goreng', 'tempe goreng', 'sambal', 'kerupuk'],
        reasoning: 'Makanan tidak sesuai menu standar BGN. Sayuran tidak terdeteksi dalam foto. Porsi protein berlebih namun tidak ada komponen sayur yang merupakan bagian wajib menu BGN.',
        issues: ['missing_vegetables', 'menu_non_compliance', 'bgn_standard_violation'],
        warnings: ['Tidak ada sayuran', 'Menu tidak sesuai standar BGN', 'Hygiene score rendah'],
        recommendations: ['Segera tambahkan komponen sayuran', 'Review menu dengan panduan BGN', 'Tingkatkan kebersihan'],
        portion_estimate: 450,
        portion_confidence: 0.85,
        portion_match: true,
        quality_acceptable: false,
        has_vegetables: false,
        meets_bgn_standards: false,
        confidence: 0.85,
        needs_manual_review: true,
        manual_review_status: 'pending',
        analyzed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        delivery_id: insertedDeliveries[0].id,
        menu_match: true,
        quality_score: 88,
        freshness_score: 90,
        presentation_score: 85,
        hygiene_score: 87,
        estimated_calories: 510,
        estimated_protein: 20,
        estimated_carbs: 65,
        detected_items: ['nasi putih', 'ikan bakar', 'sayur asem', 'tempe mendoan', 'buah pepaya'],
        reasoning: 'Makanan sesuai standar BGN dengan kualitas sangat baik. Semua komponen gizi terpenuhi. Presentasi menarik dan kemasan higienis.',
        issues: [],
        warnings: [],
        recommendations: ['Pertahankan kualitas ini'],
        portion_estimate: 450,
        portion_confidence: 0.95,
        portion_match: true,
        quality_acceptable: true,
        has_vegetables: true,
        meets_bgn_standards: true,
        confidence: 0.95,
        needs_manual_review: false,
        manual_review_status: 'approved',
        analyzed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewed_by: adminUsers.length > 1 ? adminUsers[1].id : adminUsers[0].id,
        reviewed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        delivery_id: insertedDeliveries[3].id,
        menu_match: true,
        quality_score: 45,
        freshness_score: 40,
        presentation_score: 50,
        hygiene_score: 38,
        estimated_calories: 420,
        estimated_protein: 12,
        estimated_carbs: 58,
        detected_items: ['nasi putih', 'nugget ayam', 'sayur kol', 'kerupuk'],
        reasoning: 'Kualitas makanan sangat buruk. Sayur terlihat tidak fresh, kemasan kotor, dan presentasi sangat kurang. Tidak memenuhi standar minimum BGN.',
        issues: ['severe_quality_issue', 'hygiene_violation', 'freshness_critical'],
        warnings: ['Makanan tidak layak konsumsi', 'Kemasan tidak higienis', 'Sayur sudah layu'],
        recommendations: ['Tolak pengiriman', 'Audit katering', 'Pertimbangkan suspend kontrak'],
        portion_estimate: 410,
        portion_confidence: 0.88,
        portion_match: true,
        quality_acceptable: false,
        has_vegetables: true,
        meets_bgn_standards: false,
        confidence: 0.88,
        needs_manual_review: true,
        manual_review_status: 'rejected',
        analyzed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        reviewed_by: adminUsers.length > 2 ? adminUsers[2].id : adminUsers[0].id,
        reviewed_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        delivery_id: insertedDeliveries[0].id,
        menu_match: true,
        quality_score: 68,
        freshness_score: 72,
        presentation_score: 65,
        hygiene_score: 70,
        estimated_calories: 500,
        estimated_protein: 19,
        estimated_carbs: 67,
        detected_items: ['nasi merah', 'ayam bumbu kuning', 'sayur kangkung', 'tempe bacem', 'buah apel'],
        reasoning: 'Makanan cukup memenuhi standar namun ada beberapa area yang perlu improvement. Quality score borderline (68/100). Perlu verifikasi manual untuk memastikan kelayakan.',
        issues: ['borderline_quality', 'needs_verification'],
        warnings: ['Quality score mendekati batas minimum (70)', 'Presentasi bisa ditingkatkan'],
        recommendations: ['Review manual diperlukan', 'Berikan feedback ke katering', 'Monitor trend kualitas'],
        portion_estimate: 450,
        portion_confidence: 0.80,
        portion_match: true,
        quality_acceptable: true,
        has_vegetables: true,
        meets_bgn_standards: true,
        confidence: 0.80,
        needs_manual_review: true,
        manual_review_status: 'pending',
        analyzed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
    ]

      const { data: batchAnalyses, error: analysisError } = await supabase
        .from('ai_food_analyses')
        .insert(aiAnalyses)
        .select()

      if (analysisError) {
        logger.error('Failed to create AI analyses', analysisError)
        stats.errors.push({ step: 'ai_food_analyses', error: analysisError.message })
      } else {
        insertedAnalyses = batchAnalyses || []
        stats.aiAnalysesCreated = insertedAnalyses.length
        logger.success(`Created ${stats.aiAnalysesCreated} AI food analyses`)
      }
    }

    // ========================================================================
    // STEP 8: CREATE VERIFICATIONS
    // ========================================================================
    if (CONFIG.SKIP_VERIFICATIONS) {
      logger.section('STEP 8: Skipping verifications (SKIP_VERIFICATIONS = true)')
      stats.verificationsCreated = 0
    } else {
      logger.section('STEP 8: Creating verifications')

      if (insertedAnalyses && insertedAnalyses.length > 0) {
      const verifications = [
        {
          delivery_id: insertedDeliveries[0].id,
          school_id: schools[0].id,
          ai_analysis_id: insertedAnalyses[3].id,
          portions_received: 450,
          quality_rating: 4,
          photo_url: 'https://storage.example.com/verifications/del001_img1.jpg',
          notes: 'Makanan diterima dalam kondisi baik, porsi sesuai, kualitas memuaskan.',
          status: 'verified',
          verified_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          delivery_id: insertedDeliveries[1].id,
          school_id: schools[1].id,
          ai_analysis_id: insertedAnalyses[1].id,
          portions_received: 380,
          quality_rating: 3,
          photo_url: 'https://storage.example.com/verifications/del002_img1.jpg',
          notes: 'Porsi lebih sedikit dari yang dijanjikan. Kualitas cukup baik tetapi kuantitas tidak sesuai kontrak.',
          status: 'pending',
        },
        {
          delivery_id: insertedDeliveries[2].id,
          school_id: schools[2].id,
          ai_analysis_id: insertedAnalyses[0].id,
          portions_received: 520,
          quality_rating: 2,
          photo_url: 'https://storage.example.com/verifications/del003_img1.jpg',
          notes: 'Kualitas makanan mengkhawatirkan. Sayur tidak fresh, kemasan kurang rapi. Perlu tindak lanjut.',
          status: 'pending',
        },
        {
          delivery_id: insertedDeliveries[3].id,
          school_id: schools[3] ? schools[3].id : schools[0].id,
          ai_analysis_id: insertedAnalyses[4].id,
          portions_received: 410,
          quality_rating: 2,
          photo_url: 'https://storage.example.com/verifications/del004_img1.jpg',
          notes: 'Makanan tidak memenuhi standar. Tidak higienis dan kualitas sangat buruk.',
          status: 'rejected',
          verified_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          delivery_id: insertedDeliveries[4].id,
          school_id: schools[0].id,
          ai_analysis_id: insertedAnalyses[2].id,
          portions_received: 450,
          quality_rating: 2,
          photo_url: 'https://storage.example.com/verifications/del005_img1.jpg',
          notes: 'Sayuran tidak ada sama sekali. Menu tidak sesuai standar BGN. Complaint diajukan.',
          status: 'pending',
        },
        {
          delivery_id: insertedDeliveries[0].id,
          school_id: schools[0].id,
          ai_analysis_id: insertedAnalyses[5].id,
          portions_received: 450,
          quality_rating: 3,
          photo_url: 'https://storage.example.com/verifications/del001_img2.jpg',
          notes: 'Kualitas borderline, perlu review lebih detail oleh admin.',
          status: 'pending',
        },
      ]

        const { data: insertedVerifications, error: verificationError } = await supabase
          .from('verifications')
          .insert(verifications)
          .select()

        if (verificationError) {
          logger.error('Failed to create verifications', verificationError)
          stats.errors.push({ step: 'verifications', error: verificationError.message })
        } else {
          stats.verificationsCreated = insertedVerifications?.length || 0
          logger.success(`Created ${stats.verificationsCreated} verifications`)
        }
      }
    }

    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================
    logger.section('SEEDING SUMMARY')

    console.log(`
📊 DATA SEEDED:
   Admin Users Found: ${stats.totalAdmins}
   Schools Found: ${stats.totalSchools}
   Caterings Found: ${stats.totalCaterings}

   ✅ Budget Allocations: ${stats.budgetAllocationsCreated}
   ✅ Allocations: ${stats.allocationsCreated}
   ✅ Deliveries: ${stats.deliveriesCreated}
   ✅ Anomaly Alerts: ${stats.anomaliesCreated}
   ✅ Escrow Transactions: ${stats.escrowTransactionsCreated}
   ✅ AI Food Analyses: ${stats.aiAnalysesCreated}
   ✅ Verifications: ${stats.verificationsCreated}
`)

    if (stats.errors.length > 0) {
      logger.log('\n❌ ERRORS ENCOUNTERED:')
      stats.errors.forEach((err, index) => {
        console.log(`${index + 1}. [${err.step}] ${err.error}`)
      })
    }

    const statsPath = path.join(__dirname, '../seeding-logs/23-admin-test-data-stats.json')
    fs.mkdirSync(path.dirname(statsPath), { recursive: true })
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2))
    logger.log(`\nStats saved to: ${statsPath}`)

    logger.success('\n✅ Seeding completed!')

  } catch (error) {
    logger.error('Fatal error during seeding', error)
    process.exit(1)
  }
}

// ============================================================================
// EXECUTE
// ============================================================================

if (require.main === module) {
  seedAdminTestData()
    .then(() => {
      logger.success('Script execution completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Script execution failed', error)
      process.exit(1)
    })
}

export { seedAdminTestData }
