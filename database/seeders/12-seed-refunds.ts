/**
 * ============================================================================
 * SEEDING SCRIPT 12: REFUNDS
 * ============================================================================
 *
 * Purpose: Seed refunds table with refund tracking data
 * Dependencies:
 *   - 06-seed-payments.ts (payments must exist)
 *   - 03-seed-allocations.ts (allocations must exist)
 *
 * Run: npx ts-node database/seeders/12-seed-refunds.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface PaymentData {
  id: number
  allocation_id: number
  amount: number
  status: string
  blockchain_tx_hash: string | null
  created_at: string
}

interface AllocationData {
  id: number
  amount: number
  status: string
  metadata: any
}

interface RefundInsert {
  payment_id: number
  allocation_id: number
  amount: number
  reason: string
  status: string
  blockchain_tx_hash: string | null
  requested_at: string
  processed_at: string | null
  created_at: string
}

interface SeedingStats {
  totalPayments: number
  totalRefunds: number
  successCount: number
  failedCount: number
  byStatus: Record<string, number>
  byReason: Record<string, number>
  totalRefundAmount: number
  errors: Array<{ batch?: number; error: string; count?: number }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Seeding Options
  BATCH_SIZE: 50,

  // Refund reasons distribution
  REFUND_REASONS: {
    'Delivery cancelled by school': 0.25,
    'Catering unable to fulfill order': 0.20,
    'Quality issues reported': 0.15,
    'Duplicate payment': 0.10,
    'School closure/emergency': 0.10,
    'Contract termination': 0.08,
    'Payment processing error': 0.07,
    'Force majeure event': 0.05
  },

  // Refund status distribution
  STATUS_DISTRIBUTION: {
    COMPLETED: 0.70,    // 70% completed
    PROCESSING: 0.15,   // 15% processing
    PENDING: 0.10,      // 10% pending
    FAILED: 0.05        // 5% failed
  },

  // Processing time ranges (in hours)
  PROCESSING_TIME: {
    COMPLETED: { min: 24, max: 168 },    // 1-7 days
    PROCESSING: { min: 12, max: 72 },    // 0.5-3 days
    PENDING: { min: 0, max: 24 },        // 0-1 day
    FAILED: { min: 48, max: 240 }        // 2-10 days
  }
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
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2)
    console.error(`[${elapsed}s] ❌ ERROR: ${message}`)
    if (error) console.error(error)
  }

  success(message: string) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2)
    console.log(`[${elapsed}s] ✅ ${message}`)
  }

  progress(current: number, total: number, label: string) {
    const percentage = ((current / total) * 100).toFixed(1)
    const bar = this.generateProgressBar(current, total)
    process.stdout.write(`\r${bar} ${percentage}% - ${label} (${current}/${total})`)
    if (current === total) console.log() // New line when complete
  }

  private generateProgressBar(current: number, total: number, length: number = 30): string {
    const filled = Math.floor((current / total) * length)
    const empty = length - filled
    return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`
  }
}

const logger = new Logger()

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function weightedRandom(distribution: Record<string, number>): string {
  const random = Math.random()
  let cumulative = 0

  for (const [key, probability] of Object.entries(distribution)) {
    cumulative += probability
    if (random <= cumulative) {
      return key
    }
  }

  return Object.keys(distribution)[0]
}

function generateTxHash(): string {
  const randomHex = crypto.randomBytes(32).toString('hex')
  return `0x${randomHex}`
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)
  return result
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchRefundablePayments(supabase: any): Promise<PaymentData[]> {
  logger.log('Fetching refundable payments...')

  // Fetch payments that are REFUNDED or FAILED (candidates for refunds)
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .in('status', ['REFUNDED', 'FAILED'])
    .order('id')

  if (error) {
    throw new Error(`Failed to fetch payments: ${error.message}`)
  }

  if (!data || data.length === 0) {
    logger.log('⚠️ No refundable payments found. This is normal if no payments failed/refunded.')
    return []
  }

  logger.success(`Found ${data.length} refundable payments`)
  return data
}

async function fetchAllocations(supabase: any): Promise<Map<number, AllocationData>> {
  logger.log('Fetching allocations...')

  const { data, error } = await supabase
    .from('allocations')
    .select('*')
    .order('id')

  if (error) {
    throw new Error(`Failed to fetch allocations: ${error.message}`)
  }

  const allocationMap = new Map<number, AllocationData>()
  if (data) {
    data.forEach((allocation: AllocationData) => {
      allocationMap.set(allocation.id, allocation)
    })
  }

  logger.success(`Found ${data?.length || 0} allocations`)
  return allocationMap
}

// ============================================================================
// DATA GENERATION
// ============================================================================

async function generateRefunds(
  payments: PaymentData[],
  allocationMap: Map<number, AllocationData>
): Promise<RefundInsert[]> {
  logger.log(`Generating refunds for ${payments.length} payments...`)

  const refunds: RefundInsert[] = []

  for (const payment of payments) {
    const allocation = allocationMap.get(payment.allocation_id)
    if (!allocation) {
      logger.error(`Allocation not found for payment ${payment.id}`)
      continue
    }

    // Determine refund reason based on distribution
    const reason = weightedRandom(CONFIG.REFUND_REASONS)

    // Determine refund status
    const status = weightedRandom(CONFIG.STATUS_DISTRIBUTION)

    // Calculate refund amount (usually full amount, but can be partial)
    let refundAmount = payment.amount
    if (Math.random() < 0.15) {
      // 15% chance of partial refund (80-99% of original amount)
      const percentage = randomInt(80, 99) / 100
      refundAmount = Math.round(payment.amount * percentage)
    }

    // Generate blockchain tx hash for refund transaction
    const blockchainTxHash = status !== 'PENDING' ? generateTxHash() : null

    // Calculate requested_at (same as payment created_at or slightly after)
    const requestedAt = new Date(payment.created_at)
    const extraHours = randomInt(1, 48) // 1-48 hours after payment creation
    const requested_at = addHours(requestedAt, extraHours).toISOString()

    // Calculate processed_at based on status
    let processed_at: string | null = null
    if (status === 'COMPLETED' || status === 'FAILED') {
      const timeRange = CONFIG.PROCESSING_TIME[status as keyof typeof CONFIG.PROCESSING_TIME]
      const processingHours = randomInt(timeRange.min, timeRange.max)
      processed_at = addHours(new Date(requested_at), processingHours).toISOString()
    } else if (status === 'PROCESSING') {
      // Processing status: some have processed_at (started processing), some don't
      if (Math.random() < 0.5) {
        const timeRange = CONFIG.PROCESSING_TIME.PROCESSING
        const processingHours = randomInt(timeRange.min, timeRange.max)
        processed_at = addHours(new Date(requested_at), processingHours).toISOString()
      }
    }

    const refund: RefundInsert = {
      payment_id: payment.id,
      allocation_id: payment.allocation_id,
      amount: refundAmount,
      reason,
      status,
      blockchain_tx_hash: blockchainTxHash,
      requested_at,
      processed_at,
      created_at: requested_at
    }

    refunds.push(refund)
  }

  logger.success(`Generated ${refunds.length} refunds`)

  return refunds
}

// ============================================================================
// SUPABASE OPERATIONS
// ============================================================================

async function insertRefundsInBatches(
  supabase: any,
  refunds: RefundInsert[],
  batchSize: number
): Promise<{ success: number; failed: number; errors: any[] }> {
  let success = 0
  let failed = 0
  const errors: any[] = []

  if (refunds.length === 0) {
    logger.log('No refunds to insert.')
    return { success: 0, failed: 0, errors: [] }
  }

  const totalBatches = Math.ceil(refunds.length / batchSize)
  logger.log(`Inserting ${refunds.length} refunds in ${totalBatches} batches...`)

  for (let i = 0; i < refunds.length; i += batchSize) {
    const batch = refunds.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1

    try {
      const { data, error } = await supabase
        .from('refunds')
        .insert(batch)
        .select()

      if (error) {
        logger.error(`Batch ${batchNumber} failed`, error)
        failed += batch.length
        errors.push({
          batch: batchNumber,
          error: error.message,
          count: batch.length
        })
      } else {
        success += data.length
        logger.progress(
          Math.min(i + batchSize, refunds.length),
          refunds.length,
          'Inserting refunds'
        )
      }
    } catch (error) {
      logger.error(`Batch ${batchNumber} exception`, error)
      failed += batch.length
      errors.push({
        batch: batchNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: batch.length
      })
    }

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  if (refunds.length > 0) {
    console.log() // New line after progress
  }
  return { success, failed, errors }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedRefunds() {
  logger.log('='.repeat(80))
  logger.log('SEEDING SCRIPT 12: REFUNDS')
  logger.log('='.repeat(80))

  const stats: SeedingStats = {
    totalPayments: 0,
    totalRefunds: 0,
    successCount: 0,
    failedCount: 0,
    byStatus: {},
    byReason: {},
    totalRefundAmount: 0,
    errors: []
  }

  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_KEY) {
    logger.error('Missing Supabase credentials in environment variables')
    process.exit(1)
  }

  logger.log('Initializing Supabase client...')
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  logger.success('Supabase client initialized')

  try {
    // Step 1: Fetch refundable payments
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 1: FETCHING REFUNDABLE PAYMENTS')
    logger.log('='.repeat(80))

    const payments = await fetchRefundablePayments(supabase)
    stats.totalPayments = payments.length

    if (payments.length === 0) {
      logger.log('\n⚠️ No refundable payments found. Skipping refund generation.')
      logger.log('This is normal if all payments succeeded. No refunds needed! ✅')

      // Save empty stats
      const logsDir = path.join(__dirname, '../seeding-logs')
      const statsPath = path.join(logsDir, '12-refunds-stats.json')
      fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2))

      logger.log('\n' + '='.repeat(80))
      logger.success('SEEDING COMPLETED (No refunds needed)')
      logger.log('='.repeat(80))
      return
    }

    // Step 2: Fetch allocations
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 2: FETCHING ALLOCATIONS')
    logger.log('='.repeat(80))

    const allocationMap = await fetchAllocations(supabase)

    // Step 3: Generate refunds
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 3: GENERATING REFUNDS')
    logger.log('='.repeat(80))

    const refunds = await generateRefunds(payments, allocationMap)
    stats.totalRefunds = refunds.length

    // Calculate statistics
    refunds.forEach((refund) => {
      stats.byStatus[refund.status] = (stats.byStatus[refund.status] || 0) + 1
      stats.byReason[refund.reason] = (stats.byReason[refund.reason] || 0) + 1
      stats.totalRefundAmount += refund.amount
    })

    // Step 4: Insert to database
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 4: INSERTING REFUNDS TO DATABASE')
    logger.log('='.repeat(80))

    const result = await insertRefundsInBatches(supabase, refunds, CONFIG.BATCH_SIZE)
    stats.successCount = result.success
    stats.failedCount = result.failed
    stats.errors = result.errors

    // Print summary
    logger.log('\n' + '='.repeat(80))
    logger.log('SEEDING SUMMARY')
    logger.log('='.repeat(80))

    console.log(`
📊 REFUNDS:
   Total Refundable Payments: ${stats.totalPayments}
   Total Refunds Generated: ${stats.totalRefunds}
   ✅ Success: ${stats.successCount}
   ❌ Failed: ${stats.failedCount}
   Success Rate: ${stats.totalRefunds > 0 ? ((stats.successCount / stats.totalRefunds) * 100).toFixed(1) : 0}%

💰 REFUND AMOUNTS:
   Total Refund Amount: Rp ${stats.totalRefundAmount.toLocaleString('id-ID')}
   Avg Refund per Case: Rp ${stats.totalRefunds > 0 ? Math.round(stats.totalRefundAmount / stats.totalRefunds).toLocaleString('id-ID') : 0}

📊 BY STATUS:`)

    Object.entries(stats.byStatus)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        const percentage = ((count / stats.totalRefunds) * 100).toFixed(1)
        console.log(`   ${status.padEnd(15)}: ${count.toString().padStart(5)} (${percentage}%)`)
      })

    console.log(`\n📊 TOP REFUND REASONS:`)
    Object.entries(stats.byReason)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([reason, count], index) => {
        const percentage = ((count / stats.totalRefunds) * 100).toFixed(1)
        console.log(`   ${(index + 1).toString().padStart(2)}. ${reason.padEnd(35)}: ${count.toString().padStart(3)} (${percentage}%)`)
      })

    if (stats.errors.length > 0) {
      logger.log('\n❌ ERRORS ENCOUNTERED:')
      stats.errors.slice(0, 10).forEach((err: any, index: number) => {
        console.log(`${index + 1}. Batch ${err.batch}: ${err.error}`)
      })
      if (stats.errors.length > 10) {
        logger.log(`... and ${stats.errors.length - 10} more errors`)
      }
    }

    logger.log('\n' + '='.repeat(80))
    logger.success('SEEDING COMPLETED!')
    logger.log('='.repeat(80))

    // Save stats
    const logsDir = path.join(__dirname, '../seeding-logs')
    const statsPath = path.join(logsDir, '12-refunds-stats.json')
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2))
    logger.log(`\nStats saved to: ${statsPath}`)

  } catch (error) {
    logger.error('Fatal error during seeding', error)
    process.exit(1)
  }
}

// ============================================================================
// EXECUTE
// ============================================================================

if (require.main === module) {
  seedRefunds()
    .then(() => {
      logger.success('Script execution completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Script execution failed', error)
      process.exit(1)
    })
}

export { seedRefunds }
