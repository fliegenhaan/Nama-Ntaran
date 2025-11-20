/**
 * ============================================================================
 * SEEDING SCRIPT 09: PAYMENT EVENTS
 * ============================================================================
 *
 * Purpose: Seed payment_events table with comprehensive audit trail
 * Dependencies: 06-seed-payments.ts (payments must exist)
 *
 * Run: npx ts-node database/seeders/09-seed-payment-events.ts
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
  delivery_id: number | null
  school_id: number
  catering_id: number
  amount: number
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
  allocation_id: string
  school_id: number
  catering_id: number
  amount: number
  status: string
  locked_at: string | null
  released_at: string | null
  metadata: any
}

interface PaymentEventInsert {
  payment_id: number
  allocation_id: number
  event_type: string
  blockchain_event_signature: string
  blockchain_tx_hash: string
  blockchain_block_number: number
  event_data: {
    allocationId: string
    payer: string
    payee: string
    amount: number
    timestamp: string
    metadata: {
      schoolId: number
      cateringId: number
      deliveryId: number | null
      portions?: number
      notes: string
    }
  }
  processed: boolean
  processed_at: string | null
  created_at: string
}

interface SeedingStats {
  totalPayments: number
  totalEvents: number
  successEvents: number
  failedEvents: number
  eventsByType: Record<string, number>
  eventsByStatus: Record<string, number>
  errors: Array<{ type: string; batch?: number; error?: string; count?: number }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Seeding Options
  BATCH_SIZE: 100,

  // Ethereum Event Signatures (keccak256 hash)
  EVENT_SIGNATURES: {
    ALLOCATION_CREATED: '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    FUND_LOCKED: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    DELIVERY_CONFIRMED: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    PAYMENT_RELEASING: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
    PAYMENT_RELEASED: '0xcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    PAYMENT_FAILED: '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
    REFUND_INITIATED: '0x34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'
  },

  // Event flow based on payment status
  EVENT_FLOWS: {
    PENDING: ['ALLOCATION_CREATED'],
    LOCKED: ['ALLOCATION_CREATED', 'FUND_LOCKED'],
    CONFIRMED: ['ALLOCATION_CREATED', 'FUND_LOCKED', 'DELIVERY_CONFIRMED'],
    RELEASING: ['ALLOCATION_CREATED', 'FUND_LOCKED', 'DELIVERY_CONFIRMED', 'PAYMENT_RELEASING'],
    COMPLETED: ['ALLOCATION_CREATED', 'FUND_LOCKED', 'DELIVERY_CONFIRMED', 'PAYMENT_RELEASING', 'PAYMENT_RELEASED'],
    FAILED: ['ALLOCATION_CREATED', 'FUND_LOCKED', 'PAYMENT_FAILED'],
    REFUNDED: ['ALLOCATION_CREATED', 'FUND_LOCKED', 'DELIVERY_CONFIRMED', 'REFUND_INITIATED']
  } as Record<string, string[]>,

  // Processing status distribution
  PROCESSED_RATE: 0.95, // 95% events already processed

  // System wallet address (government/payer)
  SYSTEM_WALLET: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',

  // Block number range (Ethereum/Polygon)
  BLOCK_NUMBER_RANGE: { min: 15000000, max: 18000000 }
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

function generateTxHash(): string {
  const randomHex = crypto.randomBytes(32).toString('hex')
  return `0x${randomHex}`
}

function generateEthAddress(): string {
  const randomHex = crypto.randomBytes(20).toString('hex')
  return `0x${randomHex}`
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function addSeconds(date: Date, seconds: number): Date {
  const result = new Date(date)
  result.setSeconds(result.getSeconds() + seconds)
  return result
}

function addMinutes(date: Date, minutes: number): Date {
  return addSeconds(date, minutes * 60)
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

  if (!data || data.length === 0) {
    throw new Error('No allocations found')
  }

  const allocationMap = new Map<number, AllocationData>()
  data.forEach((allocation: AllocationData) => {
    allocationMap.set(allocation.id, allocation)
  })

  logger.success(`Found ${data.length} allocations`)
  return allocationMap
}

// ============================================================================
// DATA GENERATION
// ============================================================================

async function generatePaymentEvents(
  payments: PaymentData[],
  allocationMap: Map<number, AllocationData>
): Promise<PaymentEventInsert[]> {
  logger.log(`Generating payment events for ${payments.length} payments...`)

  const events: PaymentEventInsert[] = []
  const eventTypeCounters: Record<string, number> = {}

  // Generate catering wallet addresses (one per unique catering)
  const cateringWallets = new Map<number, string>()

  for (let i = 0; i < payments.length; i++) {
    const payment = payments[i]
    const allocation = allocationMap.get(payment.allocation_id)

    if (!allocation) {
      logger.error(`Allocation not found for payment ${payment.id}`)
      continue
    }

    // Get catering wallet
    if (!cateringWallets.has(payment.catering_id)) {
      cateringWallets.set(payment.catering_id, generateEthAddress())
    }
    const cateringWallet = cateringWallets.get(payment.catering_id)!

    // Determine event flow based on payment status
    const eventFlow = CONFIG.EVENT_FLOWS[payment.status] || CONFIG.EVENT_FLOWS.PENDING

    // Generate events for this payment
    let eventTimestamp = new Date(payment.created_at)
    let blockNumber = randomInt(CONFIG.BLOCK_NUMBER_RANGE.min, CONFIG.BLOCK_NUMBER_RANGE.max)

    for (let j = 0; j < eventFlow.length; j++) {
      const eventType = eventFlow[j]

      // Calculate event timestamp (events happen in sequence)
      if (j > 0) {
        // Add realistic delay between events
        const delayMinutes = randomInt(5, 180) // 5 minutes to 3 hours
        eventTimestamp = addMinutes(eventTimestamp, delayMinutes)
      }

      // For specific events, use actual timestamps
      if (eventType === 'FUND_LOCKED' && payment.paid_at) {
        eventTimestamp = new Date(payment.paid_at)
      } else if (eventType === 'DELIVERY_CONFIRMED' && payment.confirmed_by_school_at) {
        eventTimestamp = new Date(payment.confirmed_by_school_at)
      } else if (eventType === 'PAYMENT_RELEASED' && payment.released_to_catering_at) {
        eventTimestamp = new Date(payment.released_to_catering_at)
      }

      // Generate blockchain transaction hash
      const txHash = payment.blockchain_tx_hash || generateTxHash()

      // Increment block number for each event
      blockNumber = blockNumber + randomInt(1, 100)

      // Determine if event is processed
      const isProcessed = Math.random() < CONFIG.PROCESSED_RATE
      const processedAt = isProcessed ? addSeconds(eventTimestamp, randomInt(10, 300)).toISOString() : null

      // Build event data
      const eventData = {
        allocationId: allocation.allocation_id,
        payer: CONFIG.SYSTEM_WALLET,
        payee: cateringWallet,
        amount: payment.amount,
        timestamp: eventTimestamp.toISOString(),
        metadata: {
          schoolId: payment.school_id,
          cateringId: payment.catering_id,
          deliveryId: payment.delivery_id,
          portions: allocation.metadata?.portions || null,
          notes: getEventNotes(eventType, allocation, payment)
        }
      }

      // Create payment event
      const paymentEvent: PaymentEventInsert = {
        payment_id: payment.id,
        allocation_id: payment.allocation_id,
        event_type: eventType,
        blockchain_event_signature: CONFIG.EVENT_SIGNATURES[eventType as keyof typeof CONFIG.EVENT_SIGNATURES],
        blockchain_tx_hash: txHash,
        blockchain_block_number: blockNumber,
        event_data: eventData,
        processed: isProcessed,
        processed_at: processedAt,
        created_at: eventTimestamp.toISOString()
      }

      events.push(paymentEvent)

      // Count event types
      eventTypeCounters[eventType] = (eventTypeCounters[eventType] || 0) + 1
    }

    // Progress update every 100 payments
    if ((i + 1) % 100 === 0) {
      logger.progress(i + 1, payments.length, 'Generating payment events')
    }
  }

  logger.success(`Generated ${events.length} payment events`)

  // Log event type distribution
  console.log('\n📊 EVENT TYPE DISTRIBUTION:')
  Object.entries(eventTypeCounters)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const percentage = ((count / events.length) * 100).toFixed(1)
      console.log(`   ${type.padEnd(25)}: ${count.toString().padStart(6)} (${percentage}%)`)
    })

  return events
}

function getEventNotes(eventType: string, allocation: AllocationData, payment: PaymentData): string {
  const schoolId = allocation.school_id
  const cateringId = allocation.catering_id
  const amount = payment.amount.toLocaleString('id-ID')

  switch (eventType) {
    case 'ALLOCATION_CREATED':
      return `Allocation ${allocation.allocation_id.substring(0, 8)} dibuat untuk sekolah ${schoolId}`

    case 'FUND_LOCKED':
      return `Dana Rp ${amount} di-lock ke smart contract untuk delivery ke sekolah ${schoolId}`

    case 'DELIVERY_CONFIRMED':
      return `Sekolah ${schoolId} mengkonfirmasi penerimaan makanan dari catering ${cateringId}`

    case 'PAYMENT_RELEASING':
      return `Memulai proses release dana Rp ${amount} ke catering ${cateringId}`

    case 'PAYMENT_RELEASED':
      return `Dana Rp ${amount} berhasil di-release ke catering ${cateringId}`

    case 'PAYMENT_FAILED':
      return `Gagal memproses pembayaran untuk allocation ${allocation.allocation_id.substring(0, 8)}`

    case 'REFUND_INITIATED':
      return `Refund dimulai untuk dana Rp ${amount} ke system wallet`

    default:
      return `Event ${eventType} untuk payment ${payment.id}`
  }
}

// ============================================================================
// SUPABASE OPERATIONS
// ============================================================================

async function insertEventsInBatches(
  supabase: any,
  events: PaymentEventInsert[],
  batchSize: number
): Promise<{ success: number; failed: number; errors: any[] }> {
  let success = 0
  let failed = 0
  const errors: any[] = []

  const totalBatches = Math.ceil(events.length / batchSize)
  logger.log(`Inserting ${events.length} events in ${totalBatches} batches...`)

  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1

    try {
      const { data, error } = await supabase
        .from('payment_events')
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
          Math.min(i + batchSize, events.length),
          events.length,
          'Inserting payment events'
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

async function seedPaymentEvents() {
  logger.log('='.repeat(80))
  logger.log('SEEDING SCRIPT 09: PAYMENT EVENTS')
  logger.log('='.repeat(80))

  const stats: SeedingStats = {
    totalPayments: 0,
    totalEvents: 0,
    successEvents: 0,
    failedEvents: 0,
    eventsByType: {},
    eventsByStatus: {},
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

    // Step 3: Generate payment events
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 3: GENERATING PAYMENT EVENTS')
    logger.log('='.repeat(80))

    const events = await generatePaymentEvents(payments, allocationMap)
    stats.totalEvents = events.length

    // Count by type
    events.forEach((event: PaymentEventInsert) => {
      stats.eventsByType[event.event_type] = (stats.eventsByType[event.event_type] || 0) + 1
      const processStatus = event.processed ? 'PROCESSED' : 'PENDING'
      stats.eventsByStatus[processStatus] = (stats.eventsByStatus[processStatus] || 0) + 1
    })

    // Step 4: Insert events to database
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 4: INSERTING PAYMENT EVENTS TO DATABASE')
    logger.log('='.repeat(80))

    const result = await insertEventsInBatches(supabase, events, CONFIG.BATCH_SIZE)
    stats.successEvents = result.success
    stats.failedEvents = result.failed
    stats.errors = result.errors

    // Print summary
    logger.log('\n' + '='.repeat(80))
    logger.log('SEEDING SUMMARY')
    logger.log('='.repeat(80))

    console.log(`
📊 PAYMENT EVENTS:
   Total Payments: ${stats.totalPayments}
   Total Events Generated: ${stats.totalEvents}
   ✅ Success: ${stats.successEvents}
   ❌ Failed: ${stats.failedEvents}
   Success Rate: ${((stats.successEvents / stats.totalEvents) * 100).toFixed(1)}%

   Average Events per Payment: ${(stats.totalEvents / stats.totalPayments).toFixed(1)}

📊 BY EVENT TYPE:`)

    Object.entries(stats.eventsByType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const percentage = ((count / stats.totalEvents) * 100).toFixed(1)
        console.log(`   ${type.padEnd(25)}: ${count.toString().padStart(6)} (${percentage}%)`)
      })

    console.log(`\n📊 BY PROCESSING STATUS:`)
    Object.entries(stats.eventsByStatus)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        const percentage = ((count / stats.totalEvents) * 100).toFixed(1)
        console.log(`   ${status.padEnd(15)}: ${count.toString().padStart(6)} (${percentage}%)`)
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
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
      logger.log(`Created logs directory: ${logsDir}`)
    }

    const statsPath = path.join(logsDir, '09-payment-events-stats.json')
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
  seedPaymentEvents()
    .then(() => {
      logger.success('Script execution completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Script execution failed', error)
      process.exit(1)
    })
}

export { seedPaymentEvents }
