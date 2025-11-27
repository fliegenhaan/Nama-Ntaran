/**
 * ============================================================================
 * SEEDING SCRIPT 28: NOTIFICATION HISTORY
 * ============================================================================
 *
 * Purpose: Generate in-app notifications for all user roles
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: users, deliveries, payments, issues
 *
 * Run: npm run seed:notification-history
 * Estimated records: 2000-5000 notifications
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
  role: string
  email: string
}

interface NotificationInsert {
  user_id: number
  type: string
  title: string
  message: string
  priority: string
  is_read: boolean
  read_at: string | null
  action_url: string | null
  metadata: any
  expires_at: string | null
  created_at: string
}

interface SeedingStats {
  totalUsers: number
  totalNotifications: number
  successCount: number
  failedCount: number
  byType: Record<string, number>
  errors: Array<{ error: string }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  BATCH_SIZE: 200,

  NOTIFICATIONS_PER_USER_MIN: 5,
  NOTIFICATIONS_PER_USER_MAX: 20,

  DAYS_BACK: 60,

  // 70% read, 30% unread
  READ_RATE: 0.70,

  NOTIFICATION_TEMPLATES_BY_ROLE: {
    school: [
      {
        type: 'delivery_reminder',
        title: 'Pengiriman Akan Tiba',
        message: 'Pengiriman makanan bergizi akan tiba dalam 30 menit. Mohon bersiap untuk verifikasi.',
        priority: 'normal',
        action_url: '/deliveries',
      },
      {
        type: 'verification_required',
        title: 'Verifikasi Diperlukan',
        message: 'Anda memiliki {count} pengiriman yang menunggu verifikasi.',
        priority: 'high',
        action_url: '/verifications/pending',
      },
      {
        type: 'payment_received',
        title: 'Pembayaran Diterima',
        message: 'Pembayaran sebesar Rp {amount} telah diterima dan dikunci dalam escrow.',
        priority: 'normal',
        action_url: '/payments',
      },
    ],
    catering: [
      {
        type: 'payment_pending',
        title: 'Pembayaran Menunggu',
        message: 'Pembayaran senilai Rp {amount} sedang dalam proses verifikasi.',
        priority: 'normal',
        action_url: '/payments/pending',
      },
      {
        type: 'payment_received',
        title: 'Dana Diterima',
        message: 'Pembayaran Rp {amount} telah dicairkan ke rekening Anda.',
        priority: 'high',
        action_url: '/payments/completed',
      },
      {
        type: 'issue_alert',
        title: 'Laporan Masalah Baru',
        message: 'Sekolah {school} melaporkan: {issue_type}. Mohon segera ditanggapi.',
        priority: 'urgent',
        action_url: '/issues',
      },
    ],
    admin: [
      {
        type: 'system_announcement',
        title: 'Pembaruan Sistem',
        message: 'Sistem akan menjalani maintenance pada {date}.',
        priority: 'high',
        action_url: '/admin/system',
      },
      {
        type: 'issue_alert',
        title: 'Masalah Memerlukan Perhatian',
        message: '{count} laporan masalah belum terselesaikan. Mohon ditinjau.',
        priority: 'high',
        action_url: '/admin/issues',
      },
      {
        type: 'system_announcement',
        title: 'Laporan Bulanan Tersedia',
        message: 'Laporan transparansi bulan {month} telah tersedia untuk diunduh.',
        priority: 'normal',
        action_url: '/reports/monthly',
      },
    ],
  },
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

function generateRandomDate(daysBack: number): Date {
  const now = new Date()
  const randomDays = Math.random() * daysBack
  const date = new Date(now)
  date.setDate(date.getDate() - randomDays)
  date.setHours(randomInt(0, 23))
  date.setMinutes(randomInt(0, 59))
  return date
}

function interpolateMessage(message: string): string {
  return message
    .replace('{count}', String(randomInt(1, 10)))
    .replace('{amount}', `${(randomInt(50, 500) * 10000).toLocaleString('id-ID')}`)
    .replace('{school}', `SDN ${randomInt(1, 100)} Jakarta`)
    .replace('{issue_type}', randomElement(['Kualitas makanan', 'Keterlambatan', 'Kuantitas kurang']))
    .replace('{date}', new Date(Date.now() + randomInt(1, 7) * 86400000).toLocaleDateString('id-ID'))
    .replace('{month}', randomElement(['Januari', 'Februari', 'Maret', 'April']))
}

function generateNotification(user: User, template: any, index: number): NotificationInsert {
  const createdAt = generateRandomDate(CONFIG.DAYS_BACK)
  const isRead = Math.random() < CONFIG.READ_RATE
  const readAt = isRead ? new Date(createdAt.getTime() + randomInt(1, 48) * 3600000) : null

  const expiresAt = template.type === 'system_announcement' ?
    new Date(createdAt.getTime() + 30 * 86400000) : // 30 days
    null

  return {
    user_id: user.id,
    type: template.type,
    title: template.title,
    message: interpolateMessage(template.message),
    priority: template.priority,
    is_read: isRead,
    read_at: readAt ? readAt.toISOString() : null,
    action_url: template.action_url,
    metadata: {
      template_id: index,
      generated: true,
    },
    expires_at: expiresAt ? expiresAt.toISOString() : null,
    created_at: createdAt.toISOString(),
  }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedNotificationHistory() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalUsers: 0,
    totalNotifications: 0,
    successCount: 0,
    failedCount: 0,
    byType: {},
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 28: NOTIFICATION HISTORY')
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

    if (!users || users.length === 0) {
      logger.error('No users found.')
      return
    }

    stats.totalUsers = users.length
    logger.success(`Found ${users.length} users`)

    // STEP 2: GENERATE NOTIFICATIONS
    logger.log('\nSTEP 2: Generating notifications...')

    const notificationsToInsert: NotificationInsert[] = []

    for (const user of users) {
      const templates = (CONFIG.NOTIFICATION_TEMPLATES_BY_ROLE as any)[user.role] || []
      if (templates.length === 0) continue

      const numNotifications = randomInt(
        CONFIG.NOTIFICATIONS_PER_USER_MIN,
        CONFIG.NOTIFICATIONS_PER_USER_MAX
      )

      for (let i = 0; i < numNotifications; i++) {
        const template = randomElement(templates)
        const notification = generateNotification(user, template, i)
        notificationsToInsert.push(notification)

        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1
      }
    }

    // Sort by timestamp
    notificationsToInsert.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    stats.totalNotifications = notificationsToInsert.length
    logger.success(`Generated ${notificationsToInsert.length} notifications`)

    // STEP 3: INSERT NOTIFICATIONS
    logger.log('\nSTEP 3: Inserting notifications to database...')
    logger.log(`Batch size: ${CONFIG.BATCH_SIZE}`)

    for (let i = 0; i < notificationsToInsert.length; i += CONFIG.BATCH_SIZE) {
      const batch = notificationsToInsert.slice(i, i + CONFIG.BATCH_SIZE)

      try {
        const { error } = await supabase
          .from('notifications')
          .insert(batch)

        if (error) {
          logger.error(`Batch failed: ${error.message}`)
          stats.failedCount += batch.length
          stats.errors.push({ error: error.message })
        } else {
          stats.successCount += batch.length
          logger.progress(
            Math.min(i + CONFIG.BATCH_SIZE, notificationsToInsert.length),
            notificationsToInsert.length,
            'Progress'
          )
        }
      } catch (error: any) {
        logger.error(`Batch exception:`, error)
        stats.failedCount += batch.length
        stats.errors.push({ error: error.message || 'Unknown error' })
      }
    }

    // STEP 4: SUMMARY
    logger.log('\n================================================================================')
    logger.log('SEEDING SUMMARY')
    logger.log('================================================================================')
    logger.log(`Total users: ${stats.totalUsers}`)
    logger.log(`Total notifications generated: ${stats.totalNotifications}`)
    logger.log(`Successfully inserted: ${stats.successCount}`)
    logger.log(`Failed: ${stats.failedCount}`)

    if (stats.successCount > 0) {
      logger.log('\nNotifications by Type:')
      Object.entries(stats.byType)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          const percentage = ((count / stats.successCount) * 100).toFixed(1)
          logger.log(`  ${type}: ${count} (${percentage}%)`)
        })
    }

    const statsFilePath = path.join(__dirname, '../seeding-logs/28-notification-history-stats.json')
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

seedNotificationHistory()
