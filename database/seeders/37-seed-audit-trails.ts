/**
 * ============================================================================
 * SEEDING SCRIPT 37: AUDIT TRAILS
 * ============================================================================
 *
 * Purpose: Generate immutable audit log for financial transactions
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: users, escrow_transactions, payments
 *
 * Run: npm run seed:audit-trails
 * Estimated records: 1000-5000 audit trail entries
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface User {
  id: number
  email: string
  role: string
}

interface EscrowTransaction {
  id: number
  school_id: number
  catering_id: number
  amount: number
  status: string
  created_at: string
  updated_at: string
}

interface Payment {
  id: number
  allocation_id: number
  amount: number
  status: string
  created_at: string
}

interface AuditTrailInsert {
  action: string
  actor_id: number | null
  actor_role: string | null
  actor_email: string | null
  entity_type: string
  entity_id: number
  amount: number | null
  currency: string
  before_state: any
  after_state: any
  changes: any
  tx_hash: string | null
  block_number: number | null
  ip_address: string
  user_agent: string
  reason: string | null
  is_system_action: boolean
  created_at: string
}

interface SeedingStats {
  totalActions: number
  successCount: number
  failedCount: number
  byAction: Record<string, number>
  errors: Array<{ error: string }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  BATCH_SIZE: 100,

  SAMPLE_IPS: [
    '103.10.66.12', '103.23.20.45', '103.47.132.88', '114.124.168.99',
    '180.244.139.22', '202.150.213.66', '36.79.88.12', '115.178.208.45'
  ],

  SAMPLE_USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  ],

  ACTIONS: [
    'escrow_locked',
    'escrow_released',
    'payment_sent',
    'payment_confirmed',
    'payment_failed',
    'budget_allocated',
    'refund_issued',
  ],
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

  progress(current: number, total: number, label: string) {
    const percentage = ((current / total) * 100).toFixed(1)
    console.log(`[${((Date.now() - this.startTime) / 1000).toFixed(2)}s] ${label}: ${current}/${total} (${percentage}%)`)
  }

  error(message: string, error?: any) {
    console.error(`❌ ERROR: ${message}`)
    if (error) console.error(error)
  }

  success(message: string) {
    console.log(`✅ ${message}`)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

function generateAuditTrail(
  action: string,
  escrow: EscrowTransaction,
  user: User | null
): AuditTrailInsert {
  const beforeState = {
    status: action.includes('locked') ? 'PENDING' : 'LOCKED',
    amount: escrow.amount,
  }

  const afterState = {
    status: action.includes('locked') ? 'LOCKED' : 'RELEASED',
    amount: escrow.amount,
  }

  const changes = {
    field: 'status',
    old_value: beforeState.status,
    new_value: afterState.status,
  }

  return {
    action: action,
    actor_id: user?.id || null,
    actor_role: user?.role || null,
    actor_email: user?.email || null,
    entity_type: 'escrow',
    entity_id: escrow.id,
    amount: escrow.amount,
    currency: 'IDR',
    before_state: beforeState,
    after_state: afterState,
    changes: changes,
    tx_hash: generateTxHash(),
    block_number: randomInt(10000000, 20000000),
    ip_address: randomElement(CONFIG.SAMPLE_IPS),
    user_agent: randomElement(CONFIG.SAMPLE_USER_AGENTS),
    reason: action.includes('failed') ? 'Insufficient gas fees' : null,
    is_system_action: Math.random() < 0.30, // 30% system actions
    created_at: new Date(escrow.created_at).toISOString(),
  }
}

function generatePaymentAudit(
  payment: Payment,
  user: User | null
): AuditTrailInsert {
  const action = payment.status === 'COMPLETED' ? 'payment_sent' : 'payment_confirmed'

  return {
    action: action,
    actor_id: user?.id || null,
    actor_role: user?.role || null,
    actor_email: user?.email || null,
    entity_type: 'payment',
    entity_id: payment.id,
    amount: payment.amount,
    currency: 'IDR',
    before_state: { status: 'PENDING' },
    after_state: { status: payment.status },
    changes: { field: 'status', old_value: 'PENDING', new_value: payment.status },
    tx_hash: generateTxHash(),
    block_number: randomInt(10000000, 20000000),
    ip_address: randomElement(CONFIG.SAMPLE_IPS),
    user_agent: randomElement(CONFIG.SAMPLE_USER_AGENTS),
    reason: null,
    is_system_action: Math.random() < 0.50, // 50% system actions for payments
    created_at: new Date(payment.created_at).toISOString(),
  }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedAuditTrails() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalActions: 0,
    successCount: 0,
    failedCount: 0,
    byAction: {},
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 37: AUDIT TRAILS')
  logger.log('================================================================================')

  try {
    // STEP 1: FETCH USERS
    logger.log('\nSTEP 1: Fetching users...')

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    logger.success(`Found ${users?.length || 0} users`)

    // STEP 2: FETCH ESCROW TRANSACTIONS
    logger.log('\nSTEP 2: Fetching escrow transactions...')

    const { data: escrows, error: escrowsError } = await supabase
      .from('escrow_transactions')
      .select('id, school_id, catering_id, amount, status, created_at, updated_at')
      .limit(500)

    if (escrowsError) {
      throw new Error(`Failed to fetch escrow transactions: ${escrowsError.message}`)
    }

    logger.success(`Found ${escrows?.length || 0} escrow transactions`)

    // STEP 3: FETCH PAYMENTS
    logger.log('\nSTEP 3: Fetching payments...')

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, allocation_id, amount, status, created_at')
      .limit(500)

    if (paymentsError) {
      throw new Error(`Failed to fetch payments: ${paymentsError.message}`)
    }

    logger.success(`Found ${payments?.length || 0} payments`)

    // STEP 4: GENERATE AUDIT TRAILS
    logger.log('\nSTEP 4: Generating audit trails...')

    const auditTrailsToInsert: AuditTrailInsert[] = []

    // Generate for escrow transactions
    for (const escrow of escrows || []) {
      const user = users && users.length > 0 ? randomElement(users as User[]) : null

      // Locked action
      if (escrow.status !== 'PENDING') {
        const lockedAudit = generateAuditTrail('escrow_locked', escrow as EscrowTransaction, user)
        auditTrailsToInsert.push(lockedAudit)
        stats.byAction['escrow_locked'] = (stats.byAction['escrow_locked'] || 0) + 1
      }

      // Released action
      if (escrow.status === 'RELEASED') {
        const releasedAudit = generateAuditTrail('escrow_released', escrow as EscrowTransaction, user)
        releasedAudit.created_at = new Date(escrow.updated_at).toISOString()
        auditTrailsToInsert.push(releasedAudit)
        stats.byAction['escrow_released'] = (stats.byAction['escrow_released'] || 0) + 1
      }
    }

    // Generate for payments (sample 50%)
    const paymentSample = payments?.filter(() => Math.random() < 0.50) || []
    for (const payment of paymentSample) {
      const user = users && users.length > 0 ? randomElement(users as User[]) : null
      const paymentAudit = generatePaymentAudit(payment as Payment, user)
      auditTrailsToInsert.push(paymentAudit)
      stats.byAction[paymentAudit.action] = (stats.byAction[paymentAudit.action] || 0) + 1
    }

    // Sort by timestamp
    auditTrailsToInsert.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    stats.totalActions = auditTrailsToInsert.length
    logger.success(`Generated ${auditTrailsToInsert.length} audit trail entries`)

    // STEP 5: INSERT AUDIT TRAILS
    logger.log('\nSTEP 5: Inserting audit trails to database...')
    logger.log(`Batch size: ${CONFIG.BATCH_SIZE}`)

    for (let i = 0; i < auditTrailsToInsert.length; i += CONFIG.BATCH_SIZE) {
      const batch = auditTrailsToInsert.slice(i, i + CONFIG.BATCH_SIZE)

      try {
        const { error } = await supabase
          .from('audit_trails')
          .insert(batch)

        if (error) {
          logger.error(`Batch failed: ${error.message}`)
          stats.failedCount += batch.length
          stats.errors.push({ error: error.message })
        } else {
          stats.successCount += batch.length
          logger.progress(
            Math.min(i + CONFIG.BATCH_SIZE, auditTrailsToInsert.length),
            auditTrailsToInsert.length,
            'Progress'
          )
        }
      } catch (error: any) {
        logger.error(`Batch exception:`, error)
        stats.failedCount += batch.length
        stats.errors.push({ error: error.message || 'Unknown error' })
      }
    }

    // STEP 6: SUMMARY
    logger.log('\n================================================================================')
    logger.log('SEEDING SUMMARY')
    logger.log('================================================================================')
    logger.log(`Total audit trails generated: ${stats.totalActions}`)
    logger.log(`Successfully inserted: ${stats.successCount}`)
    logger.log(`Failed: ${stats.failedCount}`)

    if (stats.successCount > 0) {
      logger.log('\nAudit Trails by Action:')
      Object.entries(stats.byAction)
        .sort((a, b) => b[1] - a[1])
        .forEach(([action, count]) => {
          const percentage = ((count / stats.successCount) * 100).toFixed(1)
          logger.log(`  ${action}: ${count} (${percentage}%)`)
        })
    }

    const statsFilePath = path.join(__dirname, '../seeding-logs/37-audit-trails-stats.json')
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

seedAuditTrails()
