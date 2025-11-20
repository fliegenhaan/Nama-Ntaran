/**
 * ============================================================================
 * SEEDING SCRIPT 11: PUBLIC PAYMENT FEED
 * ============================================================================
 *
 * Purpose: Seed public_payment_feed table with transparency dashboard data
 * Dependencies:
 *   - 06-seed-payments.ts (payments must exist)
 *   - 03-seed-allocations.ts (allocations must exist)
 *
 * Run: npx ts-node database/seeders/11-seed-public-payment-feed.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface PaymentData {
  id: number
  allocation_id: number
  delivery_id: number | null
  school_id: number
  catering_id: number
  amount: number
  currency: string
  status: string
  blockchain_tx_hash: string | null
  blockchain_block_number: number | null
  paid_at: string | null
  confirmed_by_school_at: string | null
  released_to_catering_at: string | null
  created_at: string
}

interface AllocationData {
  id: number
  school_id: number
  catering_id: number
  amount: number
  status: string
  locked_at: string | null
  released_at: string | null
  metadata: {
    deliveryDate?: string
    portions?: number
    deliveryId?: number
    schoolName?: string
    cateringName?: string
    notes?: string
  }
}

interface SchoolData {
  id: number
  name: string
  city: string
  province: string
  district: string | null
}

interface CateringData {
  id: number
  name: string
  company_name: string | null
}

interface PublicPaymentFeedInsert {
  payment_id: number
  allocation_id: number
  school_name: string
  school_region: string
  catering_name: string
  amount: number
  currency: string
  portions_count: number
  delivery_date: string
  status: string
  blockchain_tx_hash: string | null
  blockchain_block_number: number | null
  locked_at: string | null
  released_at: string | null
  created_at: string
}

interface SeedingStats {
  totalPayments: number
  totalFeedEntries: number
  successCount: number
  failedCount: number
  byStatus: Record<string, number>
  byRegion: Record<string, number>
  totalAmount: number
  totalPortions: number
  errors: Array<{ batch?: number; error: string; count?: number }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Seeding Options
  BATCH_SIZE: 100,

  // Feed inclusion rate by status (for transparency)
  FEED_INCLUSION_RATE: {
    COMPLETED: 1.0,    // 100% - All completed payments shown
    LOCKED: 0.80,      // 80% - Most locked payments shown
    RELEASING: 0.70,   // 70% - Releasing payments shown
    CONFIRMED: 0.60,   // 60% - Confirmed payments shown
    PENDING: 0.10,     // 10% - Few pending (for demo purposes)
    FAILED: 0.20,      // 20% - Some failed (for transparency)
    REFUNDED: 0.50     // 50% - Half of refunded (for records)
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

function shouldIncludeInFeed(paymentStatus: string): boolean {
  const inclusionRate = CONFIG.FEED_INCLUSION_RATE[paymentStatus as keyof typeof CONFIG.FEED_INCLUSION_RATE] || 0
  return Math.random() < inclusionRate
}

function formatRegion(city: string, province: string, district: string | null): string {
  if (district && district !== city) {
    return `${district}, ${city}, ${province}`
  }
  return `${city}, ${province}`
}

function mapPaymentStatusToFeedStatus(paymentStatus: string): string {
  // Map internal payment status to public-friendly status
  const statusMapping: Record<string, string> = {
    COMPLETED: 'COMPLETED',
    LOCKED: 'LOCKED',
    RELEASING: 'RELEASING',
    CONFIRMED: 'LOCKED',
    PENDING: 'PENDING',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED'
  }
  return statusMapping[paymentStatus] || paymentStatus
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchPayments(supabase: any): Promise<PaymentData[]> {
  logger.log('Fetching payments...')

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('id')

  if (error) {
    throw new Error(`Failed to fetch payments: ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error('No payments found. Please run 06-seed-payments.ts first')
  }

  logger.success(`Found ${data.length} payments`)
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

async function fetchSchools(supabase: any): Promise<Map<number, SchoolData>> {
  logger.log('Fetching schools...')

  const { data, error } = await supabase
    .from('schools')
    .select('id, name, city, province, district')
    .order('id')

  if (error) {
    throw new Error(`Failed to fetch schools: ${error.message}`)
  }

  const schoolMap = new Map<number, SchoolData>()
  if (data) {
    data.forEach((school: SchoolData) => {
      schoolMap.set(school.id, school)
    })
  }

  logger.success(`Found ${data?.length || 0} schools`)
  return schoolMap
}

async function fetchCaterings(supabase: any): Promise<Map<number, CateringData>> {
  logger.log('Fetching caterings...')

  const { data, error } = await supabase
    .from('caterings')
    .select('id, name, company_name')
    .order('id')

  if (error) {
    throw new Error(`Failed to fetch caterings: ${error.message}`)
  }

  const cateringMap = new Map<number, CateringData>()
  if (data) {
    data.forEach((catering: CateringData) => {
      cateringMap.set(catering.id, catering)
    })
  }

  logger.success(`Found ${data?.length || 0} caterings`)
  return cateringMap
}

// ============================================================================
// DATA GENERATION
// ============================================================================

async function generatePublicPaymentFeed(
  payments: PaymentData[],
  allocationMap: Map<number, AllocationData>,
  schoolMap: Map<number, SchoolData>,
  cateringMap: Map<number, CateringData>
): Promise<PublicPaymentFeedInsert[]> {
  logger.log(`Generating public payment feed entries...`)

  const feedEntries: PublicPaymentFeedInsert[] = []

  for (let i = 0; i < payments.length; i++) {
    const payment = payments[i]

    // Check if this payment should be included in public feed
    if (!shouldIncludeInFeed(payment.status)) {
      continue
    }

    const allocation = allocationMap.get(payment.allocation_id)
    if (!allocation) {
      logger.error(`Allocation not found for payment ${payment.id}`)
      continue
    }

    const school = schoolMap.get(payment.school_id)
    if (!school) {
      logger.error(`School not found for payment ${payment.id}`)
      continue
    }

    const catering = cateringMap.get(payment.catering_id)
    if (!catering) {
      logger.error(`Catering not found for payment ${payment.id}`)
      continue
    }

    // Get school name (use from allocation metadata or school table)
    const schoolName = allocation.metadata?.schoolName || school.name

    // Get catering name (use company name if available, otherwise name)
    const cateringName = catering.company_name || catering.name

    // Get region
    const schoolRegion = formatRegion(school.city, school.province, school.district)

    // Get portions
    const portionsCount = allocation.metadata?.portions || 0

    // Get delivery date
    const deliveryDate = allocation.metadata?.deliveryDate || payment.created_at.split('T')[0]

    // Map status to public-friendly status
    const feedStatus = mapPaymentStatusToFeedStatus(payment.status)

    // Determine locked_at and released_at
    let lockedAt: string | null = null
    let releasedAt: string | null = null

    if (payment.paid_at) {
      lockedAt = payment.paid_at
    } else if (allocation.locked_at) {
      lockedAt = allocation.locked_at
    }

    if (payment.released_to_catering_at) {
      releasedAt = payment.released_to_catering_at
    } else if (allocation.released_at) {
      releasedAt = allocation.released_at
    }

    const feedEntry: PublicPaymentFeedInsert = {
      payment_id: payment.id,
      allocation_id: payment.allocation_id,
      school_name: schoolName,
      school_region: schoolRegion,
      catering_name: cateringName,
      amount: payment.amount,
      currency: payment.currency,
      portions_count: portionsCount,
      delivery_date: deliveryDate,
      status: feedStatus,
      blockchain_tx_hash: payment.blockchain_tx_hash,
      blockchain_block_number: payment.blockchain_block_number,
      locked_at: lockedAt,
      released_at: releasedAt,
      created_at: payment.created_at
    }

    feedEntries.push(feedEntry)

    // Progress update
    if ((i + 1) % 100 === 0) {
      logger.progress(i + 1, payments.length, 'Processing payments for feed')
    }
  }

  logger.progress(payments.length, payments.length, 'Processing payments for feed')
  logger.success(`Generated ${feedEntries.length} public feed entries`)

  return feedEntries
}

// ============================================================================
// SUPABASE OPERATIONS
// ============================================================================

async function insertFeedEntriesInBatches(
  supabase: any,
  feedEntries: PublicPaymentFeedInsert[],
  batchSize: number
): Promise<{ success: number; failed: number; errors: any[] }> {
  let success = 0
  let failed = 0
  const errors: any[] = []

  const totalBatches = Math.ceil(feedEntries.length / batchSize)
  logger.log(`Inserting ${feedEntries.length} feed entries in ${totalBatches} batches...`)

  for (let i = 0; i < feedEntries.length; i += batchSize) {
    const batch = feedEntries.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1

    try {
      const { data, error } = await supabase
        .from('public_payment_feed')
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
          Math.min(i + batchSize, feedEntries.length),
          feedEntries.length,
          'Inserting feed entries'
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

  console.log() // New line after progress
  return { success, failed, errors }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedPublicPaymentFeed() {
  logger.log('='.repeat(80))
  logger.log('SEEDING SCRIPT 11: PUBLIC PAYMENT FEED')
  logger.log('='.repeat(80))

  const stats: SeedingStats = {
    totalPayments: 0,
    totalFeedEntries: 0,
    successCount: 0,
    failedCount: 0,
    byStatus: {},
    byRegion: {},
    totalAmount: 0,
    totalPortions: 0,
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
    // Step 1: Fetch payments
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 1: FETCHING PAYMENTS')
    logger.log('='.repeat(80))

    const payments = await fetchPayments(supabase)
    stats.totalPayments = payments.length

    // Step 2: Fetch allocations
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 2: FETCHING ALLOCATIONS')
    logger.log('='.repeat(80))

    const allocationMap = await fetchAllocations(supabase)

    // Step 3: Fetch schools
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 3: FETCHING SCHOOLS')
    logger.log('='.repeat(80))

    const schoolMap = await fetchSchools(supabase)

    // Step 4: Fetch caterings
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 4: FETCHING CATERINGS')
    logger.log('='.repeat(80))

    const cateringMap = await fetchCaterings(supabase)

    // Step 5: Generate feed entries
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 5: GENERATING PUBLIC FEED ENTRIES')
    logger.log('='.repeat(80))

    const feedEntries = await generatePublicPaymentFeed(payments, allocationMap, schoolMap, cateringMap)
    stats.totalFeedEntries = feedEntries.length

    // Calculate statistics
    feedEntries.forEach((entry) => {
      stats.byStatus[entry.status] = (stats.byStatus[entry.status] || 0) + 1

      // Group by province for region stats
      const province = entry.school_region.split(',').pop()?.trim() || 'Unknown'
      stats.byRegion[province] = (stats.byRegion[province] || 0) + 1

      stats.totalAmount += entry.amount
      stats.totalPortions += entry.portions_count
    })

    // Step 6: Insert to database
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 6: INSERTING FEED ENTRIES TO DATABASE')
    logger.log('='.repeat(80))

    const result = await insertFeedEntriesInBatches(supabase, feedEntries, CONFIG.BATCH_SIZE)
    stats.successCount = result.success
    stats.failedCount = result.failed
    stats.errors = result.errors

    // Print summary
    logger.log('\n' + '='.repeat(80))
    logger.log('SEEDING SUMMARY')
    logger.log('='.repeat(80))

    console.log(`
📊 PUBLIC PAYMENT FEED:
   Total Payments: ${stats.totalPayments}
   Total Feed Entries: ${stats.totalFeedEntries}
   ✅ Success: ${stats.successCount}
   ❌ Failed: ${stats.failedCount}
   Success Rate: ${((stats.successCount / stats.totalFeedEntries) * 100).toFixed(1)}%

   Feed Inclusion Rate: ${((stats.totalFeedEntries / stats.totalPayments) * 100).toFixed(1)}%

💰 FINANCIAL TRANSPARENCY:
   Total Amount: Rp ${stats.totalAmount.toLocaleString('id-ID')}
   Total Portions: ${stats.totalPortions.toLocaleString('id-ID')} porsi
   Avg Amount per Entry: Rp ${Math.round(stats.totalAmount / stats.totalFeedEntries).toLocaleString('id-ID')}

📊 BY STATUS:`)

    Object.entries(stats.byStatus)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        const percentage = ((count / stats.totalFeedEntries) * 100).toFixed(1)
        console.log(`   ${status.padEnd(15)}: ${count.toString().padStart(5)} (${percentage}%)`)
      })

    console.log(`\n📊 TOP 10 REGIONS:`)
    Object.entries(stats.byRegion)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([region, count], index) => {
        const percentage = ((count / stats.totalFeedEntries) * 100).toFixed(1)
        console.log(`   ${(index + 1).toString().padStart(2)}. ${region.padEnd(25)}: ${count.toString().padStart(5)} (${percentage}%)`)
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
    const statsPath = path.join(logsDir, '11-public-payment-feed-stats.json')
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
  seedPublicPaymentFeed()
    .then(() => {
      logger.success('Script execution completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Script execution failed', error)
      process.exit(1)
    })
}

export { seedPublicPaymentFeed }
