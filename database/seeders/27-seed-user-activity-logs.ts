/**
 * ============================================================================
 * SEEDING SCRIPT 27: USER ACTIVITY LOGS
 * ============================================================================
 *
 * Purpose: Generate user activity logs for security audit
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: users, deliveries, verifications, issues, escrow_transactions
 *
 * Run: npm run seed:user-activity-logs
 * Estimated records: 5000-10000 activity logs
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

interface User {
  id: number
  email: string
  role: string
}

interface ActivityLogInsert {
  user_id: number
  action_type: string
  entity_type: string | null
  entity_id: number | null
  ip_address: string
  user_agent: string
  metadata: any
  session_id: string
  created_at: string
}

interface SeedingStats {
  totalUsers: number
  totalLogs: number
  successCount: number
  failedCount: number
  byActionType: Record<string, number>
  errors: Array<{ error: string }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  BATCH_SIZE: 200,

  // Number of activity logs per user (average)
  LOGS_PER_USER_MIN: 10,
  LOGS_PER_USER_MAX: 50,

  // Time range: last 90 days
  DAYS_BACK: 90,

  // Action types by role
  ACTION_TYPES_BY_ROLE: {
    admin: [
      'login', 'logout', 'view_dashboard', 'view_report', 'export_data',
      'approve_catering', 'suspend_user', 'system_config_update',
      'allocate_budget', 'approve_contract', 'view_analytics'
    ],
    school: [
      'login', 'logout', 'verify_delivery', 'report_issue', 'view_deliveries',
      'confirm_payment', 'update_profile'
    ],
    catering: [
      'login', 'logout', 'create_delivery', 'update_delivery', 'view_payments',
      'upload_menu', 'view_orders'
    ],
  } as Record<string, string[]>,

  // Sample IP addresses (Indonesian ISPs)
  SAMPLE_IPS: [
    '103.10.66.12', '103.23.20.45', '103.47.132.88', '114.124.168.99',
    '180.244.139.22', '202.150.213.66', '36.79.88.12', '115.178.208.45'
  ],

  // Sample user agents
  SAMPLE_USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Android 13; Mobile) AppleWebKit/537.36'
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
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2)
    console.log(`[${elapsed}s] ${label}: ${current}/${total} (${percentage}%)`)
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

function generateRandomDate(daysBack: number): Date {
  const now = new Date()
  const randomDays = Math.random() * daysBack
  const randomHours = Math.random() * 24
  const randomMinutes = Math.random() * 60

  const date = new Date(now)
  date.setDate(date.getDate() - randomDays)
  date.setHours(date.getHours() - randomHours)
  date.setMinutes(date.getMinutes() - randomMinutes)

  return date
}

function generateSessionId(): string {
  return `sess_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
}

function generateMetadata(actionType: string, role: string): any {
  const baseMetadata = {
    browser: randomElement(['Chrome', 'Firefox', 'Safari', 'Edge']),
    os: randomElement(['Windows 10', 'macOS', 'Linux', 'iOS', 'Android']),
  }

  if (actionType === 'verify_delivery') {
    return { ...baseMetadata, delivery_verified: true, quality_score: randomInt(3, 5) }
  } else if (actionType === 'report_issue') {
    return { ...baseMetadata, issue_type: randomElement(['quality', 'quantity', 'late']) }
  } else if (actionType === 'view_dashboard') {
    return { ...baseMetadata, widgets_loaded: randomInt(5, 12) }
  } else if (actionType === 'export_data') {
    return { ...baseMetadata, format: randomElement(['CSV', 'PDF', 'Excel']) }
  }

  return baseMetadata
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedUserActivityLogs() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalUsers: 0,
    totalLogs: 0,
    successCount: 0,
    failedCount: 0,
    byActionType: {},
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 27: USER ACTIVITY LOGS')
  logger.log('================================================================================')

  try {
    // ========================================================================
    // STEP 1: FETCH USERS
    // ========================================================================

    logger.log('\nSTEP 1: Fetching users...')

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    if (!users || users.length === 0) {
      logger.error('No users found.')
      return
    }

    stats.totalUsers = users.length
    logger.success(`Found ${users.length} users`)

    // ========================================================================
    // STEP 2: GENERATE ACTIVITY LOGS
    // ========================================================================

    logger.log('\nSTEP 2: Generating activity logs...')

    const logsToInsert: ActivityLogInsert[] = []

    for (const user of users) {
      const actionTypes = CONFIG.ACTION_TYPES_BY_ROLE[user.role] || CONFIG.ACTION_TYPES_BY_ROLE.admin
      const numLogs = randomInt(CONFIG.LOGS_PER_USER_MIN, CONFIG.LOGS_PER_USER_MAX)

      for (let i = 0; i < numLogs; i++) {
        const actionType = randomElement(actionTypes)
        const createdAt = generateRandomDate(CONFIG.DAYS_BACK)

        const log: ActivityLogInsert = {
          user_id: user.id,
          action_type: actionType,
          entity_type: actionType.includes('delivery') ? 'delivery' :
                      actionType.includes('payment') ? 'payment' :
                      actionType.includes('issue') ? 'issue' : null,
          entity_id: actionType.includes('delivery') || actionType.includes('payment') ?
                    randomInt(1, 1000) : null,
          ip_address: randomElement(CONFIG.SAMPLE_IPS),
          user_agent: randomElement(CONFIG.SAMPLE_USER_AGENTS),
          metadata: generateMetadata(actionType, user.role),
          session_id: generateSessionId(),
          created_at: createdAt.toISOString(),
        }

        logsToInsert.push(log)
        stats.byActionType[actionType] = (stats.byActionType[actionType] || 0) + 1
      }
    }

    // Sort by timestamp
    logsToInsert.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    stats.totalLogs = logsToInsert.length
    logger.success(`Generated ${logsToInsert.length} activity logs`)

    // ========================================================================
    // STEP 3: INSERT LOGS IN BATCHES
    // ========================================================================

    logger.log('\nSTEP 3: Inserting activity logs to database...')
    logger.log(`Batch size: ${CONFIG.BATCH_SIZE}`)

    for (let i = 0; i < logsToInsert.length; i += CONFIG.BATCH_SIZE) {
      const batch = logsToInsert.slice(i, i + CONFIG.BATCH_SIZE)
      const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1

      try {
        const { error } = await supabase
          .from('user_activity_logs')
          .insert(batch)

        if (error) {
          logger.error(`Batch ${batchNum} failed: ${error.message}`)
          stats.failedCount += batch.length
          stats.errors.push({ error: error.message })
        } else {
          stats.successCount += batch.length
          logger.progress(
            Math.min(i + CONFIG.BATCH_SIZE, logsToInsert.length),
            logsToInsert.length,
            'Progress'
          )
        }
      } catch (error: any) {
        logger.error(`Batch ${batchNum} exception:`, error)
        stats.failedCount += batch.length
        stats.errors.push({ error: error.message || 'Unknown error' })
      }
    }

    // ========================================================================
    // STEP 4: FINAL SUMMARY
    // ========================================================================

    logger.log('\n================================================================================')
    logger.log('SEEDING SUMMARY')
    logger.log('================================================================================')
    logger.log(`Total users: ${stats.totalUsers}`)
    logger.log(`Total logs generated: ${stats.totalLogs}`)
    logger.log(`Successfully inserted: ${stats.successCount}`)
    logger.log(`Failed: ${stats.failedCount}`)

    if (stats.successCount > 0) {
      logger.log('\nTop 10 Action Types:')
      const sortedActions = Object.entries(stats.byActionType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      sortedActions.forEach(([action, count]) => {
        const percentage = ((count / stats.successCount) * 100).toFixed(1)
        logger.log(`  ${action}: ${count} (${percentage}%)`)
      })
    }

    if (stats.errors.length > 0) {
      logger.log(`\n⚠️  ${stats.errors.length} errors encountered`)
    }

    // ========================================================================
    // STEP 5: SAVE STATS TO FILE
    // ========================================================================

    const statsFilePath = path.join(__dirname, '../seeding-logs/27-user-activity-logs-stats.json')
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

seedUserActivityLogs()
