/**
 * ============================================================================
 * SEEDING SCRIPT 35: PUBLIC FEEDBACK
 * ============================================================================
 *
 * Purpose: Generate feedback from parents and community
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: schools, caterings
 *
 * Run: npm run seed:public-feedback
 * Estimated records: 200-500 feedback entries
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface PublicFeedbackInsert {
  school_id: number | null
  catering_id: number | null
  feedback_type: string
  category: string
  submitter_name: string | null
  submitter_email: string | null
  submitter_phone: string | null
  submitter_role: string
  subject: string
  message: string
  rating: number | null
  is_anonymous: boolean
  is_published: boolean
  is_featured: boolean
  status: string
  response: string | null
  responded_by: number | null
  responded_at: string | null
  moderated_by: number | null
  moderated_at: string | null
  moderation_notes: string | null
}

interface SeedingStats {
  totalFeedback: number
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

  BATCH_SIZE: 100,

  FEEDBACK_PER_SCHOOL_MIN: 0,
  FEEDBACK_PER_SCHOOL_MAX: 3,

  FEEDBACK_TEMPLATES: [
    {
      type: 'praise',
      category: 'food_quality',
      subject: 'Makanan Sangat Enak dan Bergizi',
      message: 'Anak saya sangat menyukai makanan dari program MBG. Menu bervariasi dan bergizi. Terima kasih!',
      rating: 5,
    },
    {
      type: 'praise',
      category: 'delivery',
      subject: 'Pengiriman Tepat Waktu',
      message: 'Pengiriman selalu tepat waktu dan makanan masih hangat saat tiba. Sangat puas dengan layanan ini.',
      rating: 5,
    },
    {
      type: 'complaint',
      category: 'food_quality',
      subject: 'Kualitas Makanan Menurun',
      message: 'Beberapa hari terakhir, kualitas makanan menurun. Sayuran tidak segar dan porsi berkurang.',
      rating: 2,
    },
    {
      type: 'complaint',
      category: 'delivery',
      subject: 'Terlambat Datang',
      message: 'Pengiriman sering terlambat, anak-anak harus menunggu lama untuk makan siang.',
      rating: 2,
    },
    {
      type: 'complaint',
      category: 'portion',
      subject: 'Porsi Kurang',
      message: 'Porsi makanan terasa kurang untuk anak-anak usia sekolah dasar. Mohon ditingkatkan.',
      rating: 3,
    },
    {
      type: 'complaint',
      category: 'hygiene',
      subject: 'Kebersihan Perlu Ditingkatkan',
      message: 'Wadah makanan kadang tidak terlalu bersih. Mohon perhatikan kebersihan lebih baik.',
      rating: 2,
    },
    {
      type: 'suggestion',
      category: 'food_quality',
      subject: 'Saran Menu Vegetarian',
      message: 'Mohon ditambahkan menu vegetarian untuk anak-anak yang tidak makan daging.',
      rating: 4,
    },
    {
      type: 'suggestion',
      category: 'other',
      subject: 'Tambah Variasi Buah',
      message: 'Sangat bagus ada buah, tapi bisa ditambah variasi seperti mangga, pepaya, atau melon?',
      rating: 4,
    },
    {
      type: 'praise',
      category: 'service',
      subject: 'Pelayanan Ramah',
      message: 'Petugas pengiriman sangat ramah dan membantu. Apresiasi untuk tim katering!',
      rating: 5,
    },
    {
      type: 'question',
      category: 'other',
      subject: 'Informasi Menu Mingguan',
      message: 'Apakah ada cara untuk melihat menu mingguan? Ingin tahu apa yang akan dimakan anak saya.',
      rating: null,
    },
  ],

  SUBMITTER_ROLES: ['parent', 'community', 'teacher'],

  // Indonesian names
  NAMES: [
    'Ibu Siti', 'Bapak Ahmad', 'Ibu Dewi', 'Bapak Budi', 'Ibu Ani',
    'Bapak Rudi', 'Ibu Fitri', 'Bapak Eko', 'Ibu Rina', 'Bapak Hadi'
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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function generateRandomDate(daysBack: number): Date {
  const now = new Date()
  const randomDays = Math.random() * daysBack
  const date = new Date(now)
  date.setDate(date.getDate() - randomDays)
  return date
}

function generateFeedback(
  schoolId: number | null,
  cateringId: number | null,
  moderatorId: number | null
): PublicFeedbackInsert {
  const template = randomElement(CONFIG.FEEDBACK_TEMPLATES)
  const submitterRole = randomElement(CONFIG.SUBMITTER_ROLES)
  const isAnonymous = Math.random() < 0.15 // 15% anonymous

  const createdAt = generateRandomDate(90) // Last 90 days
  const status = Math.random() < 0.70 ? 'reviewed' : Math.random() < 0.85 ? 'responded' : 'pending'
  const isPublished = status !== 'pending' && Math.random() < 0.80 // 80% of reviewed are published
  const isFeatured = isPublished && template.type === 'praise' && Math.random() < 0.20 // 20% of praise are featured

  let response = null
  let respondedAt = null
  let respondedBy = null

  if (status === 'responded') {
    response = template.type === 'praise'
      ? 'Terima kasih atas feedback positifnya! Kami akan terus berusaha memberikan layanan terbaik.'
      : 'Terima kasih atas masukannya. Kami akan segera menindaklanjuti dan meningkatkan kualitas layanan kami.'

    respondedAt = new Date(createdAt.getTime() + randomInt(1, 7) * 86400000).toISOString()
    respondedBy = moderatorId
  }

  const moderatedAt = status !== 'pending' ? new Date(createdAt.getTime() + randomInt(1, 3) * 86400000).toISOString() : null

  return {
    school_id: schoolId,
    catering_id: cateringId,
    feedback_type: template.type,
    category: template.category,
    submitter_name: isAnonymous ? null : randomElement(CONFIG.NAMES),
    submitter_email: isAnonymous ? null : `user${randomInt(1, 1000)}@example.com`,
    submitter_phone: isAnonymous ? null : `08${randomInt(1000000000, 9999999999)}`,
    submitter_role: submitterRole,
    subject: template.subject,
    message: template.message,
    rating: template.rating,
    is_anonymous: isAnonymous,
    is_published: isPublished,
    is_featured: isFeatured,
    status: status,
    response: response,
    responded_by: respondedBy,
    responded_at: respondedAt,
    moderated_by: status !== 'pending' ? moderatorId : null,
    moderated_at: moderatedAt,
    moderation_notes: status !== 'pending' ? 'Reviewed and approved' : null,
  }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedPublicFeedback() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalFeedback: 0,
    successCount: 0,
    failedCount: 0,
    byType: {},
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 35: PUBLIC FEEDBACK')
  logger.log('================================================================================')

  try {
    // STEP 1: FETCH SCHOOLS
    logger.log('\nSTEP 1: Fetching schools...')

    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id')

    if (schoolsError) {
      throw new Error(`Failed to fetch schools: ${schoolsError.message}`)
    }

    logger.success(`Found ${schools?.length || 0} schools`)

    // STEP 2: GET MODERATOR
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'ADMIN')
      .limit(1)

    const moderatorId = admins && admins.length > 0 ? admins[0].id : null

    // STEP 3: GENERATE FEEDBACK
    logger.log('\nSTEP 2: Generating feedback...')

    const feedbackToInsert: PublicFeedbackInsert[] = []

    for (const school of schools || []) {
      const numFeedback = randomInt(CONFIG.FEEDBACK_PER_SCHOOL_MIN, CONFIG.FEEDBACK_PER_SCHOOL_MAX)

      for (let i = 0; i < numFeedback; i++) {
        const feedback = generateFeedback(school.id, null, moderatorId)
        feedbackToInsert.push(feedback)
        stats.byType[feedback.feedback_type] = (stats.byType[feedback.feedback_type] || 0) + 1
      }
    }

    stats.totalFeedback = feedbackToInsert.length
    logger.success(`Generated ${feedbackToInsert.length} feedback entries`)

    // STEP 4: INSERT FEEDBACK
    logger.log('\nSTEP 3: Inserting feedback to database...')
    logger.log(`Batch size: ${CONFIG.BATCH_SIZE}`)

    for (let i = 0; i < feedbackToInsert.length; i += CONFIG.BATCH_SIZE) {
      const batch = feedbackToInsert.slice(i, i + CONFIG.BATCH_SIZE)

      try {
        const { error } = await supabase
          .from('public_feedback')
          .insert(batch)

        if (error) {
          logger.error(`Batch failed: ${error.message}`)
          stats.failedCount += batch.length
          stats.errors.push({ error: error.message })
        } else {
          stats.successCount += batch.length
          logger.progress(
            Math.min(i + CONFIG.BATCH_SIZE, feedbackToInsert.length),
            feedbackToInsert.length,
            'Progress'
          )
        }
      } catch (error: any) {
        logger.error(`Batch exception:`, error)
        stats.failedCount += batch.length
        stats.errors.push({ error: error.message || 'Unknown error' })
      }
    }

    // STEP 5: SUMMARY
    logger.log('\n================================================================================')
    logger.log('SEEDING SUMMARY')
    logger.log('================================================================================')
    logger.log(`Total feedback generated: ${stats.totalFeedback}`)
    logger.log(`Successfully inserted: ${stats.successCount}`)
    logger.log(`Failed: ${stats.failedCount}`)

    if (stats.successCount > 0) {
      logger.log('\nFeedback by Type:')
      Object.entries(stats.byType)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          const percentage = ((count / stats.successCount) * 100).toFixed(1)
          logger.log(`  ${type}: ${count} (${percentage}%)`)
        })
    }

    const statsFilePath = path.join(__dirname, '../seeding-logs/35-public-feedback-stats.json')
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

seedPublicFeedback()
