/**
 * ============================================================================
 * SEEDING SCRIPT 14: BLOCKCHAIN SYNC LOG
 * ============================================================================
 *
 * Purpose: Seed blockchain_sync_log table with blockchain event sync tracking
 * Dependencies:
 *   - 08-seed-escrow-transactions.ts (escrow transactions must exist)
 *   - 09-seed-payment-events.ts (payment events must exist)
 *
 * Run: npx ts-node database/seeders/14-seed-blockchain-sync-log.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface EscrowTransaction {
  id: number
  blockchain_tx_hash: string
  blockchain_block_number: number
  transaction_type: string
  executed_at: string
}

interface PaymentEvent {
  id: number
  event_type: string
  blockchain_tx_hash: string
  blockchain_block_number: number
  created_at: string
}

interface BlockchainSyncLogInsert {
  event_type: string
  event_name: string
  block_number: number
  tx_hash: string
  status: string
  synced_at: string | null
  processed_at: string | null
  error_message: string | null
  created_at: string
}

interface SeedingStats {
  totalSources: number
  totalSyncLogs: number
  successCount: number
  failedCount: number
  byEventType: Record<string, number>
  byStatus: Record<string, number>
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

  // Status distribution for sync logs
  STATUS_DISTRIBUTION: {
    PROCESSED: 0.85,    // 85% successfully processed
    PROCESSING: 0.08,   // 8% currently processing
    PENDING: 0.05,      // 5% pending
    FAILED: 0.02        // 2% failed
  },

  // Event type mapping from escrow transactions
  ESCROW_EVENT_TYPES: {
    LOCK: 'ESCROW_LOCKED',
    RELEASE: 'ESCROW_RELEASED',
    FAILED: 'ESCROW_FAILED'
  },

  // Event name mapping from payment events
  PAYMENT_EVENT_NAMES: {
    ALLOCATION_CREATED: 'AllocationCreated',
    FUND_LOCKED: 'FundLocked',
    DELIVERY_CONFIRMED: 'DeliveryConfirmed',
    PAYMENT_RELEASING: 'PaymentReleasing',
    PAYMENT_RELEASED: 'PaymentReleased',
    PAYMENT_FAILED: 'PaymentFailed',
    REFUND_INITIATED: 'RefundInitiated'
  },

  // Error messages for FAILED status
  ERROR_MESSAGES: [
    'RPC call timeout',
    'Block not found on chain',
    'Transaction receipt not available',
    'Invalid event signature',
    'Deserialization error',
    'Network connectivity issue',
    'Chain reorg detected'
  ],

  // Sync delay ranges (in seconds)
  SYNC_DELAY: { min: 15, max: 300 },      // 15 sec to 5 min
  PROCESSING_DELAY: { min: 5, max: 60 }  // 5 sec to 1 min
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

function addSeconds(date: Date, seconds: number): Date {
  const result = new Date(date)
  result.setSeconds(result.getSeconds() + seconds)
  return result
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchEscrowTransactions(supabase: any): Promise<EscrowTransaction[]> {
  logger.log('Fetching escrow transactions...')

  const { data, error } = await supabase
    .from('escrow_transactions')
    .select('id, blockchain_tx_hash, blockchain_block_number, transaction_type, executed_at')
    .not('blockchain_tx_hash', 'is', null)
    .order('id')

  if (error) {
    throw new Error(`Failed to fetch escrow transactions: ${error.message}`)
  }

  logger.success(`Found ${data?.length || 0} escrow transactions`)
  return data || []
}

async function fetchPaymentEvents(supabase: any): Promise<PaymentEvent[]> {
  logger.log('Fetching payment events...')

  const { data, error } = await supabase
    .from('payment_events')
    .select('id, event_type, blockchain_tx_hash, blockchain_block_number, created_at')
    .not('blockchain_tx_hash', 'is', null)
    .order('id')
    .limit(200) // Limit to avoid too many logs (sample 200 events)

  if (error) {
    throw new Error(`Failed to fetch payment events: ${error.message}`)
  }

  logger.success(`Found ${data?.length || 0} payment events (sampled)`)
  return data || []
}

// ============================================================================
// DATA GENERATION
// ============================================================================

async function generateBlockchainSyncLogs(
  escrowTransactions: EscrowTransaction[],
  paymentEvents: PaymentEvent[]
): Promise<BlockchainSyncLogInsert[]> {
  logger.log('Generating blockchain sync logs...')

  const syncLogs: BlockchainSyncLogInsert[] = []

  // Generate sync logs from escrow transactions
  for (const escrow of escrowTransactions) {
    const eventType = CONFIG.ESCROW_EVENT_TYPES[escrow.transaction_type as keyof typeof CONFIG.ESCROW_EVENT_TYPES]
    const eventName = eventType || 'EscrowTransaction'
    const status = weightedRandom(CONFIG.STATUS_DISTRIBUTION)

    // Calculate sync timestamps
    const baseDate = new Date(escrow.executed_at)
    const syncDelaySeconds = randomInt(CONFIG.SYNC_DELAY.min, CONFIG.SYNC_DELAY.max)
    const synced_at = addSeconds(baseDate, syncDelaySeconds).toISOString()

    let processed_at: string | null = null
    if (status === 'PROCESSED') {
      const processDelaySeconds = randomInt(CONFIG.PROCESSING_DELAY.min, CONFIG.PROCESSING_DELAY.max)
      processed_at = addSeconds(new Date(synced_at), processDelaySeconds).toISOString()
    } else if (status === 'FAILED') {
      // Failed events have processed_at (when failure was detected)
      const processDelaySeconds = randomInt(CONFIG.PROCESSING_DELAY.min, CONFIG.PROCESSING_DELAY.max * 2)
      processed_at = addSeconds(new Date(synced_at), processDelaySeconds).toISOString()
    }

    const error_message = status === 'FAILED'
      ? CONFIG.ERROR_MESSAGES[randomInt(0, CONFIG.ERROR_MESSAGES.length - 1)]
      : null

    syncLogs.push({
      event_type: eventType,
      event_name: eventName,
      block_number: escrow.blockchain_block_number,
      tx_hash: escrow.blockchain_tx_hash,
      status,
      synced_at: status !== 'PENDING' ? synced_at : null,
      processed_at,
      error_message,
      created_at: baseDate.toISOString()
    })
  }

  // Generate sync logs from payment events (sample)
  for (const event of paymentEvents) {
    const eventType = 'PAYMENT_EVENT'
    const eventName = CONFIG.PAYMENT_EVENT_NAMES[event.event_type as keyof typeof CONFIG.PAYMENT_EVENT_NAMES]
      || event.event_type
    const status = weightedRandom(CONFIG.STATUS_DISTRIBUTION)

    // Calculate sync timestamps
    const baseDate = new Date(event.created_at)
    const syncDelaySeconds = randomInt(CONFIG.SYNC_DELAY.min, CONFIG.SYNC_DELAY.max)
    const synced_at = addSeconds(baseDate, syncDelaySeconds).toISOString()

    let processed_at: string | null = null
    if (status === 'PROCESSED') {
      const processDelaySeconds = randomInt(CONFIG.PROCESSING_DELAY.min, CONFIG.PROCESSING_DELAY.max)
      processed_at = addSeconds(new Date(synced_at), processDelaySeconds).toISOString()
    } else if (status === 'FAILED') {
      const processDelaySeconds = randomInt(CONFIG.PROCESSING_DELAY.min, CONFIG.PROCESSING_DELAY.max * 2)
      processed_at = addSeconds(new Date(synced_at), processDelaySeconds).toISOString()
    }

    const error_message = status === 'FAILED'
      ? CONFIG.ERROR_MESSAGES[randomInt(0, CONFIG.ERROR_MESSAGES.length - 1)]
      : null

    syncLogs.push({
      event_type: eventType,
      event_name: eventName,
      block_number: event.blockchain_block_number,
      tx_hash: event.blockchain_tx_hash,
      status,
      synced_at: status !== 'PENDING' ? synced_at : null,
      processed_at,
      error_message,
      created_at: baseDate.toISOString()
    })
  }

  logger.success(`Generated ${syncLogs.length} blockchain sync logs`)

  return syncLogs
}

// ============================================================================
// SUPABASE OPERATIONS
// ============================================================================

async function insertSyncLogsInBatches(
  supabase: any,
  syncLogs: BlockchainSyncLogInsert[],
  batchSize: number
): Promise<{ success: number; failed: number; errors: any[] }> {
  let success = 0
  let failed = 0
  const errors: any[] = []

  if (syncLogs.length === 0) {
    logger.log('No sync logs to insert.')
    return { success: 0, failed: 0, errors: [] }
  }

  const totalBatches = Math.ceil(syncLogs.length / batchSize)
  logger.log(`Inserting ${syncLogs.length} sync logs in ${totalBatches} batches...`)

  for (let i = 0; i < syncLogs.length; i += batchSize) {
    const batch = syncLogs.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1

    try {
      const { data, error } = await supabase
        .from('blockchain_sync_log')
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
          Math.min(i + batchSize, syncLogs.length),
          syncLogs.length,
          'Inserting sync logs'
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

async function seedBlockchainSyncLog() {
  logger.log('='.repeat(80))
  logger.log('SEEDING SCRIPT 14: BLOCKCHAIN SYNC LOG')
  logger.log('='.repeat(80))

  const stats: SeedingStats = {
    totalSources: 0,
    totalSyncLogs: 0,
    successCount: 0,
    failedCount: 0,
    byEventType: {},
    byStatus: {},
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
    // Step 1: Fetch escrow transactions
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 1: FETCHING ESCROW TRANSACTIONS')
    logger.log('='.repeat(80))

    const escrowTransactions = await fetchEscrowTransactions(supabase)

    // Step 2: Fetch payment events
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 2: FETCHING PAYMENT EVENTS')
    logger.log('='.repeat(80))

    const paymentEvents = await fetchPaymentEvents(supabase)
    stats.totalSources = escrowTransactions.length + paymentEvents.length

    if (stats.totalSources === 0) {
      logger.log('\n⚠️ No blockchain events found. Skipping sync log generation.')
      logger.log('Please run escrow & payment event seeders first.')

      // Save empty stats
      const logsDir = path.join(__dirname, '../seeding-logs')
      const statsPath = path.join(logsDir, '14-blockchain-sync-log-stats.json')
      fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2))

      logger.log('\n' + '='.repeat(80))
      logger.success('SEEDING COMPLETED (No events to sync)')
      logger.log('='.repeat(80))
      return
    }

    // Step 3: Generate sync logs
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 3: GENERATING BLOCKCHAIN SYNC LOGS')
    logger.log('='.repeat(80))

    const syncLogs = await generateBlockchainSyncLogs(escrowTransactions, paymentEvents)
    stats.totalSyncLogs = syncLogs.length

    // Calculate statistics
    syncLogs.forEach((log) => {
      stats.byEventType[log.event_type] = (stats.byEventType[log.event_type] || 0) + 1
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1
    })

    // Step 4: Insert to database
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 4: INSERTING SYNC LOGS TO DATABASE')
    logger.log('='.repeat(80))

    const result = await insertSyncLogsInBatches(supabase, syncLogs, CONFIG.BATCH_SIZE)
    stats.successCount = result.success
    stats.failedCount = result.failed
    stats.errors = result.errors

    // Print summary
    logger.log('\n' + '='.repeat(80))
    logger.log('SEEDING SUMMARY')
    logger.log('='.repeat(80))

    console.log(`
📊 BLOCKCHAIN SYNC LOG:
   Total Source Events: ${stats.totalSources}
     - Escrow Transactions: ${escrowTransactions.length}
     - Payment Events (sampled): ${paymentEvents.length}

   Total Sync Logs Generated: ${stats.totalSyncLogs}
   ✅ Success: ${stats.successCount}
   ❌ Failed: ${stats.failedCount}
   Success Rate: ${stats.totalSyncLogs > 0 ? ((stats.successCount / stats.totalSyncLogs) * 100).toFixed(1) : 0}%

📊 BY EVENT TYPE:`)

    Object.entries(stats.byEventType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const percentage = ((count / stats.totalSyncLogs) * 100).toFixed(1)
        console.log(`   ${type.padEnd(20)}: ${count.toString().padStart(4)} (${percentage}%)`)
      })

    console.log(`\n📊 BY SYNC STATUS:`)
    Object.entries(stats.byStatus)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        const percentage = ((count / stats.totalSyncLogs) * 100).toFixed(1)
        console.log(`   ${status.padEnd(15)}: ${count.toString().padStart(4)} (${percentage}%)`)
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
    const statsPath = path.join(logsDir, '14-blockchain-sync-log-stats.json')
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
  seedBlockchainSyncLog()
    .then(() => {
      logger.success('Script execution completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Script execution failed', error)
      process.exit(1)
    })
}

export { seedBlockchainSyncLog }
