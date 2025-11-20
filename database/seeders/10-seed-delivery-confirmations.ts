/**
 * ============================================================================
 * SEEDING SCRIPT 10: DELIVERY CONFIRMATIONS
 * ============================================================================
 *
 * Purpose: Seed delivery_confirmations table with detailed confirmation records
 * Dependencies:
 *   - 04-seed-deliveries.ts (deliveries must exist)
 *   - 03-seed-allocations.ts (allocations must exist)
 *   - 05-seed-verifications.ts (verifications must exist)
 *   - 01-seed-users.ts (school users must exist)
 *
 * Run: npx ts-node database/seeders/10-seed-delivery-confirmations.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface DeliveryData {
  id: number
  school_id: number
  catering_id: number
  delivery_date: string
  portions: number
  status: string
  allocation_id: number | null
  delivered_at: string | null
}

interface AllocationData {
  id: number
  school_id: number
  catering_id: number
  status: string
}

interface VerificationData {
  id: number
  delivery_id: number
  school_id: number
  verified_by: number | null
  status: string
  portions_received: number | null
  quality_rating: number | null
  notes: string | null
  verified_at: string | null
}

interface SchoolUserData {
  id: number
  school_id: number
}

interface DeliveryConfirmationInsert {
  delivery_id: number
  allocation_id: number | null
  school_id: number
  verified_by: number | null
  status: string
  portions_received: number
  quality_rating: number
  notes: string
  photo_urls: string[]
  confirmed_at: string | null
  created_at: string
}

interface SeedingStats {
  totalDeliveries: number
  totalConfirmations: number
  successCount: number
  failedCount: number
  byStatus: Record<string, number>
  byQualityRating: Record<number, number>
  avgPhotosPerConfirmation: number
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
  CONFIRMATION_RATE: 0.95, // 95% deliveries have confirmations

  // Status Distribution
  STATUS_DISTRIBUTION: {
    APPROVED: 0.85,    // 85% approved
    PENDING: 0.10,     // 10% pending
    REJECTED: 0.03,    // 3% rejected
    ON_HOLD: 0.02      // 2% on hold
  },

  // Quality Rating Distribution (1-5 stars)
  QUALITY_RATING_DISTRIBUTION: {
    5: 0.40,  // 40% excellent (5 stars)
    4: 0.35,  // 35% good (4 stars)
    3: 0.15,  // 15% average (3 stars)
    2: 0.07,  // 7% below average (2 stars)
    1: 0.03   // 3% poor (1 star)
  },

  // Photos per confirmation distribution
  PHOTOS_DISTRIBUTION: {
    1: 0.15,  // 15% have 1 photo
    2: 0.30,  // 30% have 2 photos
    3: 0.35,  // 35% have 3 photos
    4: 0.15,  // 15% have 4 photos
    5: 0.05   // 5% have 5 photos
  },

  // Photo URL templates (realistic URLs)
  PHOTO_URL_TEMPLATES: [
    'https://storage.supabase.co/deliveries/photos/',
    'https://cdn.mbg.id/delivery-confirmations/',
    'https://s3.amazonaws.com/mbg-deliveries/'
  ]
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

function weightedRandom(distribution: Record<string | number, number>): string | number {
  const random = Math.random()
  let cumulative = 0

  for (const [key, probability] of Object.entries(distribution)) {
    cumulative += probability
    if (random <= cumulative) {
      return isNaN(Number(key)) ? key : Number(key)
    }
  }

  return Object.keys(distribution)[0]
}

function generatePhotoUrls(count: number, deliveryId: number, timestamp: string): string[] {
  const urls: string[] = []
  const baseTemplate = CONFIG.PHOTO_URL_TEMPLATES[randomInt(0, CONFIG.PHOTO_URL_TEMPLATES.length - 1)]
  const dateStr = new Date(timestamp).toISOString().split('T')[0].replace(/-/g, '')

  for (let i = 0; i < count; i++) {
    const photoId = `${deliveryId}_${dateStr}_${i + 1}_${randomInt(1000, 9999)}`
    urls.push(`${baseTemplate}${photoId}.jpg`)
  }

  return urls
}

function generateConfirmationNotes(
  status: string,
  qualityRating: number,
  portionsReceived: number,
  portionsExpected: number
): string {
  const portionsDiff = portionsReceived - portionsExpected

  const noteTemplates: Record<string, string[]> = {
    APPROVED: [
      `Makanan diterima dengan baik. Kualitas sangat memuaskan.`,
      `Pengiriman tepat waktu. Porsi sesuai dan kualitas baik.`,
      `Siswa menyukai makanan yang dikirim. Terima kasih.`,
      `Makanan fresh dan porsi cukup. Packaging rapi.`,
      `Kualitas makanan excellent. Delivery tepat waktu.`
    ],
    PENDING: [
      `Sedang menunggu verifikasi kepala sekolah.`,
      `Makanan sudah diterima, sedang proses verifikasi.`,
      `Menunggu konfirmasi final dari pihak sekolah.`,
      `Dalam proses review oleh komite sekolah.`
    ],
    REJECTED: [
      `Makanan tidak sesuai spesifikasi yang diminta.`,
      `Kualitas makanan di bawah standar. Porsi kurang.`,
      `Pengiriman terlambat dan makanan sudah dingin.`,
      `Beberapa porsi tidak layak konsumsi.`,
      `Tidak sesuai menu yang dijanjikan.`
    ],
    ON_HOLD: [
      `Ada beberapa issue yang perlu klarifikasi dengan catering.`,
      `Menunggu penjelasan terkait perbedaan porsi.`,
      `Ada komplain dari beberapa siswa, sedang investigasi.`,
      `Perlu diskusi lebih lanjut dengan pihak catering.`
    ]
  }

  let baseNote = noteTemplates[status][randomInt(0, noteTemplates[status].length - 1)]

  // Add quality-specific notes
  if (qualityRating === 5) {
    baseNote += ` Rating: ⭐⭐⭐⭐⭐ Excellent!`
  } else if (qualityRating === 4) {
    baseNote += ` Rating: ⭐⭐⭐⭐ Good quality.`
  } else if (qualityRating === 3) {
    baseNote += ` Rating: ⭐⭐⭐ Acceptable.`
  } else if (qualityRating === 2) {
    baseNote += ` Rating: ⭐⭐ Needs improvement.`
  } else if (qualityRating === 1) {
    baseNote += ` Rating: ⭐ Very disappointed.`
  }

  // Add portion difference note
  if (portionsDiff > 0) {
    baseNote += ` Kelebihan ${portionsDiff} porsi.`
  } else if (portionsDiff < 0) {
    baseNote += ` Kekurangan ${Math.abs(portionsDiff)} porsi.`
  } else {
    baseNote += ` Porsi sesuai.`
  }

  return baseNote
}

function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date)
  result.setMinutes(result.getMinutes() + minutes)
  return result
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchDeliveries(supabase: any): Promise<DeliveryData[]> {
  logger.log('Fetching deliveries...')

  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .in('status', ['delivered', 'verified'])
    .not('delivered_at', 'is', null)
    .order('id')

  if (error) {
    throw new Error(`Failed to fetch deliveries: ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error('No deliveries found. Please run 04-seed-deliveries.ts first')
  }

  logger.success(`Found ${data.length} deliveries`)
  return data
}

async function fetchVerifications(supabase: any): Promise<Map<number, VerificationData>> {
  logger.log('Fetching verifications...')

  const { data, error } = await supabase
    .from('verifications')
    .select('*')
    .order('delivery_id')

  if (error) {
    throw new Error(`Failed to fetch verifications: ${error.message}`)
  }

  const verificationMap = new Map<number, VerificationData>()
  if (data) {
    data.forEach((verification: VerificationData) => {
      verificationMap.set(verification.delivery_id, verification)
    })
  }

  logger.success(`Found ${data?.length || 0} verifications`)
  return verificationMap
}

async function fetchSchoolUsers(supabase: any): Promise<Map<number, number>> {
  logger.log('Fetching school users...')

  const { data, error } = await supabase
    .from('schools')
    .select('id, user_id')
    .not('user_id', 'is', null)

  if (error) {
    throw new Error(`Failed to fetch school users: ${error.message}`)
  }

  const userMap = new Map<number, number>()
  if (data) {
    data.forEach((school: any) => {
      userMap.set(school.id, school.user_id)
    })
  }

  logger.success(`Found ${data?.length || 0} school users`)
  return userMap
}

// ============================================================================
// DATA GENERATION
// ============================================================================

async function generateDeliveryConfirmations(
  deliveries: DeliveryData[],
  verificationMap: Map<number, VerificationData>,
  schoolUserMap: Map<number, number>
): Promise<DeliveryConfirmationInsert[]> {
  logger.log(`Generating delivery confirmations...`)

  const confirmations: DeliveryConfirmationInsert[] = []
  const confirmationCount = Math.floor(deliveries.length * CONFIG.CONFIRMATION_RATE)

  logger.log(`Target confirmations: ${confirmationCount} (${(CONFIG.CONFIRMATION_RATE * 100).toFixed(0)}% of deliveries)`)

  // Shuffle deliveries to get random selection
  const selectedDeliveries = [...deliveries]
    .sort(() => Math.random() - 0.5)
    .slice(0, confirmationCount)

  for (let i = 0; i < selectedDeliveries.length; i++) {
    const delivery = selectedDeliveries[i]
    const verification = verificationMap.get(delivery.id)
    const verifiedBy = schoolUserMap.get(delivery.school_id) || null

    // Determine status
    let status: string
    if (verification) {
      // If verification exists, use its status with some mapping
      if (verification.status === 'approved') {
        status = 'APPROVED'
      } else if (verification.status === 'rejected') {
        status = 'REJECTED'
      } else {
        status = Math.random() < 0.8 ? 'APPROVED' : 'PENDING'
      }
    } else {
      // Random status based on distribution
      status = weightedRandom(CONFIG.STATUS_DISTRIBUTION) as string
    }

    // Determine quality rating
    let qualityRating: number
    if (verification && verification.quality_rating) {
      qualityRating = verification.quality_rating
    } else {
      qualityRating = weightedRandom(CONFIG.QUALITY_RATING_DISTRIBUTION) as number
    }

    // Determine portions received
    let portionsReceived: number
    if (verification && verification.portions_received) {
      portionsReceived = verification.portions_received
    } else {
      // 85% exact, 10% more, 5% less
      const variance = Math.random()
      if (variance < 0.85) {
        portionsReceived = delivery.portions
      } else if (variance < 0.95) {
        portionsReceived = delivery.portions + randomInt(1, 5)
      } else {
        portionsReceived = delivery.portions - randomInt(1, Math.min(5, Math.floor(delivery.portions * 0.1)))
      }
    }

    // Generate photo URLs
    const photoCount = weightedRandom(CONFIG.PHOTOS_DISTRIBUTION) as number
    const photoUrls = generatePhotoUrls(photoCount, delivery.id, delivery.delivered_at || delivery.delivery_date)

    // Generate notes
    const notes = generateConfirmationNotes(status, qualityRating, portionsReceived, delivery.portions)

    // Determine confirmed_at timestamp
    let confirmedAt: string | null = null
    const createdAt = delivery.delivered_at || delivery.delivery_date

    if (status === 'APPROVED') {
      // Confirmed 10 minutes to 2 hours after delivery
      const delayMinutes = randomInt(10, 120)
      confirmedAt = addMinutes(new Date(createdAt), delayMinutes).toISOString()
    } else if (status === 'REJECTED') {
      // Rejected 30 minutes to 4 hours after delivery
      const delayMinutes = randomInt(30, 240)
      confirmedAt = addMinutes(new Date(createdAt), delayMinutes).toISOString()
    }
    // PENDING and ON_HOLD don't have confirmed_at yet

    const confirmation: DeliveryConfirmationInsert = {
      delivery_id: delivery.id,
      allocation_id: delivery.allocation_id,
      school_id: delivery.school_id,
      verified_by: verifiedBy,
      status,
      portions_received: portionsReceived,
      quality_rating: qualityRating,
      notes,
      photo_urls: photoUrls,
      confirmed_at: confirmedAt,
      created_at: createdAt
    }

    confirmations.push(confirmation)

    // Progress update
    if ((i + 1) % 100 === 0) {
      logger.progress(i + 1, selectedDeliveries.length, 'Generating confirmations')
    }
  }

  logger.progress(confirmations.length, confirmations.length, 'Generating confirmations')
  logger.success(`Generated ${confirmations.length} delivery confirmations`)

  return confirmations
}

// ============================================================================
// SUPABASE OPERATIONS
// ============================================================================

async function insertConfirmationsInBatches(
  supabase: any,
  confirmations: DeliveryConfirmationInsert[],
  batchSize: number
): Promise<{ success: number; failed: number; errors: any[] }> {
  let success = 0
  let failed = 0
  const errors: any[] = []

  const totalBatches = Math.ceil(confirmations.length / batchSize)
  logger.log(`Inserting ${confirmations.length} confirmations in ${totalBatches} batches...`)

  for (let i = 0; i < confirmations.length; i += batchSize) {
    const batch = confirmations.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1

    try {
      const { data, error } = await supabase
        .from('delivery_confirmations')
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
          Math.min(i + batchSize, confirmations.length),
          confirmations.length,
          'Inserting confirmations'
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

async function seedDeliveryConfirmations() {
  logger.log('='.repeat(80))
  logger.log('SEEDING SCRIPT 10: DELIVERY CONFIRMATIONS')
  logger.log('='.repeat(80))

  const stats: SeedingStats = {
    totalDeliveries: 0,
    totalConfirmations: 0,
    successCount: 0,
    failedCount: 0,
    byStatus: {},
    byQualityRating: {},
    avgPhotosPerConfirmation: 0,
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
    // Step 1: Fetch deliveries
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 1: FETCHING DELIVERIES')
    logger.log('='.repeat(80))

    const deliveries = await fetchDeliveries(supabase)
    stats.totalDeliveries = deliveries.length

    // Step 2: Fetch verifications
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 2: FETCHING VERIFICATIONS')
    logger.log('='.repeat(80))

    const verificationMap = await fetchVerifications(supabase)

    // Step 3: Fetch school users
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 3: FETCHING SCHOOL USERS')
    logger.log('='.repeat(80))

    const schoolUserMap = await fetchSchoolUsers(supabase)

    // Step 4: Generate confirmations
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 4: GENERATING DELIVERY CONFIRMATIONS')
    logger.log('='.repeat(80))

    const confirmations = await generateDeliveryConfirmations(deliveries, verificationMap, schoolUserMap)
    stats.totalConfirmations = confirmations.length

    // Calculate statistics
    let totalPhotos = 0
    confirmations.forEach((confirmation) => {
      stats.byStatus[confirmation.status] = (stats.byStatus[confirmation.status] || 0) + 1
      stats.byQualityRating[confirmation.quality_rating] =
        (stats.byQualityRating[confirmation.quality_rating] || 0) + 1
      totalPhotos += confirmation.photo_urls.length
    })
    stats.avgPhotosPerConfirmation = totalPhotos / confirmations.length

    // Step 5: Insert to database
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 5: INSERTING CONFIRMATIONS TO DATABASE')
    logger.log('='.repeat(80))

    const result = await insertConfirmationsInBatches(supabase, confirmations, CONFIG.BATCH_SIZE)
    stats.successCount = result.success
    stats.failedCount = result.failed
    stats.errors = result.errors

    // Print summary
    logger.log('\n' + '='.repeat(80))
    logger.log('SEEDING SUMMARY')
    logger.log('='.repeat(80))

    console.log(`
📊 DELIVERY CONFIRMATIONS:
   Total Deliveries: ${stats.totalDeliveries}
   Total Confirmations: ${stats.totalConfirmations}
   ✅ Success: ${stats.successCount}
   ❌ Failed: ${stats.failedCount}
   Success Rate: ${((stats.successCount / stats.totalConfirmations) * 100).toFixed(1)}%

   Confirmation Rate: ${((stats.totalConfirmations / stats.totalDeliveries) * 100).toFixed(1)}%
   Avg Photos per Confirmation: ${stats.avgPhotosPerConfirmation.toFixed(1)}

📊 BY STATUS:`)

    Object.entries(stats.byStatus)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        const percentage = ((count / stats.totalConfirmations) * 100).toFixed(1)
        console.log(`   ${status.padEnd(15)}: ${count.toString().padStart(5)} (${percentage}%)`)
      })

    console.log(`\n📊 BY QUALITY RATING:`)
    Object.entries(stats.byQualityRating)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .forEach(([rating, count]) => {
        const stars = '⭐'.repeat(Number(rating))
        const percentage = ((count / stats.totalConfirmations) * 100).toFixed(1)
        console.log(`   ${rating} ${stars.padEnd(10)}: ${count.toString().padStart(5)} (${percentage}%)`)
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
    const statsPath = path.join(logsDir, '10-delivery-confirmations-stats.json')
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
  seedDeliveryConfirmations()
    .then(() => {
      logger.success('Script execution completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Script execution failed', error)
      process.exit(1)
    })
}

export { seedDeliveryConfirmations }
