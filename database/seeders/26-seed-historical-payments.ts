/**
 * ============================================================================
 * SEEDING SCRIPT 26: HISTORICAL PAYMENTS
 * ============================================================================
 *
 * Purpose: Generate payment history linked dengan historical deliveries
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: historical deliveries (25), allocations, schools, caterings
 *
 * Run: npm run seed:historical-payments
 * Estimated records: 1000-5000 (matching historical deliveries)
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface HistoricalDelivery {
  id: number
  allocation_id: number
  school_id: number
  catering_id: number
  delivered_at: string
  status: string
}

interface AllocationRecord {
  id: number
  amount: number
  tx_hash_lock: string | null
  tx_hash_release: string | null
}

interface PaymentInsert {
  allocation_id: number
  delivery_id: number
  school_id: number
  catering_id: number
  amount: number
  currency: string
  status: string
  blockchain_tx_hash: string | null
  blockchain_block_number: number | null
  xendit_invoice_id: string | null
  xendit_payment_id: string | null
  paid_at: string
  confirmed_by_school_at: string | null
  released_to_catering_at: string | null
}

interface SeedingStats {
  totalDeliveries: number
  totalPayments: number
  successCount: number
  failedCount: number
  byStatus: Record<string, number>
  errors: Array<{ batch?: number; error: string; count?: number }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  BATCH_SIZE: 100,

  // Blockchain block range
  BLOCK_NUMBER_MIN: 10000000,
  BLOCK_NUMBER_MAX: 20000000,

  // Payment completion rate (80% completed, 15% locked, 5% pending)
  COMPLETION_RATE: 0.80,
  LOCKED_RATE: 0.15,
}

// ============================================================================
// UTILITIES
// ============================================================================

class Logger {
  private startTime: number = Date.now()

  log(message: string, data?: any) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2)
    console.log(`[${elapsed}s] ${message}`)
    if (data) {
      console.log(JSON.stringify(data, null, 2))
    }
  }

  progress(current: number, total: number, label: string) {
    const percentage = ((current / total) * 100).toFixed(1)
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2)
    console.log(`[${elapsed}s] ${label}: ${current}/${total} (${percentage}%)`)
  }

  error(message: string, error?: any) {
    console.error(`❌ ERROR: ${message}`)
    if (error) {
      console.error(error)
    }
  }

  success(message: string) {
    console.log(`✅ ${message}`)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateBlockNumber(): number {
  return Math.floor(
    Math.random() * (CONFIG.BLOCK_NUMBER_MAX - CONFIG.BLOCK_NUMBER_MIN + 1) +
      CONFIG.BLOCK_NUMBER_MIN
  )
}

function determinePaymentStatus(random: number): string {
  if (random < CONFIG.COMPLETION_RATE) return 'COMPLETED'
  if (random < CONFIG.COMPLETION_RATE + CONFIG.LOCKED_RATE) return 'LOCKED'
  return 'PENDING'
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)
  return result
}

function generatePayment(
  delivery: HistoricalDelivery,
  allocation: AllocationRecord,
  index: number
): PaymentInsert {
  const random = Math.random()
  const status = determinePaymentStatus(random)

  const deliveredAt = new Date(delivery.delivered_at)
  const paidAt = addHours(deliveredAt, Math.random() * 2) // Paid within 2 hours of delivery
  const confirmedAt = status === 'COMPLETED' ? addHours(paidAt, 1 + Math.random() * 24) : null // Confirmed 1-25 hours after payment
  const releasedAt = status === 'COMPLETED' ? addDays(paidAt, 7) : null // Released 7 days after payment

  return {
    allocation_id: delivery.allocation_id,
    delivery_id: delivery.id,
    school_id: delivery.school_id,
    catering_id: delivery.catering_id,
    amount: allocation.amount,
    currency: 'IDR',
    status,
    blockchain_tx_hash: status !== 'PENDING' ? allocation.tx_hash_lock : null,
    blockchain_block_number: status !== 'PENDING' ? generateBlockNumber() : null,
    xendit_invoice_id: null,
    xendit_payment_id: null,
    paid_at: paidAt.toISOString(),
    confirmed_by_school_at: confirmedAt ? confirmedAt.toISOString() : null,
    released_to_catering_at: releasedAt ? releasedAt.toISOString() : null,
  }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedHistoricalPayments() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalDeliveries: 0,
    totalPayments: 0,
    successCount: 0,
    failedCount: 0,
    byStatus: {},
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 26: HISTORICAL PAYMENTS')
  logger.log('================================================================================')

  try {
    // ========================================================================
    // STEP 1: FETCH HISTORICAL DELIVERIES
    // ========================================================================

    logger.log('\nSTEP 1: Fetching historical deliveries...')

    const { data: deliveries, error: deliveriesError } = await supabase
      .from('deliveries')
      .select('id, allocation_id, school_id, catering_id, delivered_at, status')
      .lt('delivered_at', new Date().toISOString())
      .order('delivered_at', { ascending: true })

    if (deliveriesError) {
      throw new Error(`Failed to fetch deliveries: ${deliveriesError.message}`)
    }

    if (!deliveries || deliveries.length === 0) {
      logger.error('No historical deliveries found. Please run 25-seed-historical-deliveries first.')
      return
    }

    stats.totalDeliveries = deliveries.length
    logger.success(`Found ${deliveries.length} historical deliveries`)

    // ========================================================================
    // STEP 2: FETCH ALLOCATIONS
    // ========================================================================

    logger.log('\nSTEP 2: Fetching allocation details...')

    const allocationIds = [...new Set(deliveries.map((d: any) => d.allocation_id))]

    const { data: allocations, error: allocationsError } = await supabase
      .from('allocations')
      .select('id, amount, tx_hash_lock, tx_hash_release')
      .in('id', allocationIds)

    if (allocationsError) {
      throw new Error(`Failed to fetch allocations: ${allocationsError.message}`)
    }

    const allocationMap = new Map<number, AllocationRecord>()
    allocations?.forEach((a: any) => {
      allocationMap.set(a.id, a)
    })

    logger.success(`Fetched ${allocations?.length} allocations`)

    // ========================================================================
    // STEP 3: CHECK EXISTING PAYMENTS
    // ========================================================================

    logger.log('\nSTEP 3: Checking for existing payments...')

    const { data: existingPayments } = await supabase
      .from('payments')
      .select('delivery_id')
      .in('delivery_id', deliveries.map((d: any) => d.id))

    const existingDeliveryIds = new Set(
      existingPayments?.map((p: any) => p.delivery_id) || []
    )

    const deliveriesToProcess = deliveries.filter(
      (d: any) => !existingDeliveryIds.has(d.id)
    )

    if (deliveriesToProcess.length === 0) {
      logger.success('All historical deliveries already have payments!')
      logger.log('\nSeeding completed - nothing to add.')
      return
    }

    logger.log(`Will create ${deliveriesToProcess.length} new payments`)

    // ========================================================================
    // STEP 4: GENERATE PAYMENTS
    // ========================================================================

    logger.log('\nSTEP 4: Generating payment records...')

    const paymentsToInsert: PaymentInsert[] = []

    for (let i = 0; i < deliveriesToProcess.length; i++) {
      const delivery = deliveriesToProcess[i]
      const allocation = allocationMap.get(delivery.allocation_id)

      if (!allocation) {
        logger.error(`No allocation found for delivery ${delivery.id}`)
        continue
      }

      const payment = generatePayment(delivery, allocation, i)
      paymentsToInsert.push(payment)

      stats.byStatus[payment.status] = (stats.byStatus[payment.status] || 0) + 1
    }

    stats.totalPayments = paymentsToInsert.length
    logger.success(`Generated ${paymentsToInsert.length} payment records`)

    // ========================================================================
    // STEP 5: INSERT PAYMENTS IN BATCHES
    // ========================================================================

    logger.log('\nSTEP 5: Inserting payments to database...')
    logger.log(`Batch size: ${CONFIG.BATCH_SIZE}`)

    for (let i = 0; i < paymentsToInsert.length; i += CONFIG.BATCH_SIZE) {
      const batch = paymentsToInsert.slice(i, i + CONFIG.BATCH_SIZE)
      const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1

      try {
        const { error } = await supabase
          .from('payments')
          .insert(batch)

        if (error) {
          logger.error(`Batch ${batchNum} failed: ${error.message}`)
          stats.failedCount += batch.length
          stats.errors.push({
            batch: batchNum,
            error: error.message,
            count: batch.length,
          })
        } else {
          stats.successCount += batch.length
          logger.progress(
            Math.min(i + CONFIG.BATCH_SIZE, paymentsToInsert.length),
            paymentsToInsert.length,
            'Progress'
          )
        }
      } catch (error: any) {
        logger.error(`Batch ${batchNum} exception:`, error)
        stats.failedCount += batch.length
        stats.errors.push({
          batch: batchNum,
          error: error.message || 'Unknown error',
          count: batch.length,
        })
      }
    }

    // ========================================================================
    // STEP 6: FINAL SUMMARY
    // ========================================================================

    logger.log('\n================================================================================')
    logger.log('SEEDING SUMMARY')
    logger.log('================================================================================')
    logger.log(`Total historical deliveries: ${stats.totalDeliveries}`)
    logger.log(`Payments to create: ${stats.totalPayments}`)
    logger.log(`Successfully inserted: ${stats.successCount}`)
    logger.log(`Failed: ${stats.failedCount}`)

    if (stats.successCount > 0) {
      logger.log('\nBreakdown by Status:')
      const sortedStatuses = Object.entries(stats.byStatus)
        .sort((a, b) => b[1] - a[1])
      sortedStatuses.forEach(([status, count]) => {
        const percentage = ((count / stats.successCount) * 100).toFixed(1)
        logger.log(`  ${status}: ${count} (${percentage}%)`)
      })
    }

    if (stats.errors.length > 0) {
      logger.log('\n⚠️  Errors encountered:')
      stats.errors.forEach((err, idx) => {
        logger.log(`  ${idx + 1}. Batch ${err.batch}: ${err.error} (${err.count} records)`)
      })
    }

    // ========================================================================
    // STEP 7: SAVE STATS TO FILE
    // ========================================================================

    const statsFilePath = path.join(__dirname, '../seeding-logs/26-historical-payments-stats.json')
    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2))
    logger.success(`Stats saved to: ${statsFilePath}`)

    logger.log('\n✅ Seeding completed!')

  } catch (error: any) {
    logger.error('Fatal error during seeding:', error)
    process.exit(1)
  }
}

// ============================================================================
// EXECUTE
// ============================================================================

seedHistoricalPayments()
