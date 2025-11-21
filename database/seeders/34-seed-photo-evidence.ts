/**
 * ============================================================================
 * SEEDING SCRIPT 34: PHOTO EVIDENCE
 * ============================================================================
 *
 * Purpose: Update verifications and AI food analyses with photo URLs
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: verifications, ai_food_analyses
 *
 * Run: npm run seed:photo-evidence
 * Estimated records: Update existing verifications (5000-10000)
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SeedingStats {
  totalVerifications: number
  updatedVerifications: number
  totalAIAnalyses: number
  updatedAIAnalyses: number
  failedCount: number
  errors: Array<{ error: string }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  BATCH_SIZE: 100,

  // Placeholder image services
  IMAGE_SERVICES: [
    'https://picsum.photos/800/600?random=', // Lorem Picsum
    'https://loremflickr.com/800/600/food,meal/', // LoremFlickr
  ],

  // Percentage of records that should have photos (80%)
  PHOTO_RATE: 0.80,
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

function generatePhotoUrl(id: number): string {
  const serviceIndex = id % CONFIG.IMAGE_SERVICES.length
  const baseUrl = CONFIG.IMAGE_SERVICES[serviceIndex]

  if (baseUrl.includes('picsum')) {
    return `${baseUrl}${id}`
  } else {
    return baseUrl
  }
}

function shouldHavePhoto(): boolean {
  return Math.random() < CONFIG.PHOTO_RATE
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedPhotoEvidence() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalVerifications: 0,
    updatedVerifications: 0,
    totalAIAnalyses: 0,
    updatedAIAnalyses: 0,
    failedCount: 0,
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 34: PHOTO EVIDENCE')
  logger.log('================================================================================')

  try {
    // ========================================================================
    // STEP 1: UPDATE VERIFICATIONS
    // ========================================================================

    logger.log('\nSTEP 1: Fetching verifications without photos...')

    const { data: verifications, error: verificationsError } = await supabase
      .from('verifications')
      .select('id')
      .is('photo_url', null)

    if (verificationsError) {
      throw new Error(`Failed to fetch verifications: ${verificationsError.message}`)
    }

    stats.totalVerifications = verifications?.length || 0
    logger.success(`Found ${stats.totalVerifications} verifications without photos`)

    if (verifications && verifications.length > 0) {
      logger.log('\nUpdating verification photo URLs...')

      for (let i = 0; i < verifications.length; i += CONFIG.BATCH_SIZE) {
        const batch = verifications.slice(i, i + CONFIG.BATCH_SIZE)

        for (const verification of batch) {
          if (!shouldHavePhoto()) continue

          const photoUrl = generatePhotoUrl(verification.id)

          try {
            const { error } = await supabase
              .from('verifications')
              .update({ photo_url: photoUrl })
              .eq('id', verification.id)

            if (error) {
              stats.failedCount++
              stats.errors.push({ error: `Verification ${verification.id}: ${error.message}` })
            } else {
              stats.updatedVerifications++
            }
          } catch (error: any) {
            stats.failedCount++
            stats.errors.push({ error: `Verification ${verification.id}: ${error.message}` })
          }
        }

        logger.progress(
          Math.min(i + CONFIG.BATCH_SIZE, verifications.length),
          verifications.length,
          'Verifications'
        )
      }
    }

    // ========================================================================
    // STEP 2: UPDATE AI FOOD ANALYSES
    // ========================================================================

    logger.log('\n\nSTEP 2: Fetching AI food analyses without photos...')

    const { data: aiAnalyses, error: aiAnalysesError } = await supabase
      .from('ai_food_analyses')
      .select('id')
      .is('photo_url', null)

    if (aiAnalysesError) {
      throw new Error(`Failed to fetch AI analyses: ${aiAnalysesError.message}`)
    }

    stats.totalAIAnalyses = aiAnalyses?.length || 0
    logger.success(`Found ${stats.totalAIAnalyses} AI analyses without photos`)

    if (aiAnalyses && aiAnalyses.length > 0) {
      logger.log('\nUpdating AI analysis photo URLs...')

      for (let i = 0; i < aiAnalyses.length; i += CONFIG.BATCH_SIZE) {
        const batch = aiAnalyses.slice(i, i + CONFIG.BATCH_SIZE)

        for (const analysis of batch) {
          const photoUrl = generatePhotoUrl(analysis.id + 10000) // Offset to get different images

          try {
            const { error } = await supabase
              .from('ai_food_analyses')
              .update({ photo_url: photoUrl })
              .eq('id', analysis.id)

            if (error) {
              stats.failedCount++
              stats.errors.push({ error: `AI Analysis ${analysis.id}: ${error.message}` })
            } else {
              stats.updatedAIAnalyses++
            }
          } catch (error: any) {
            stats.failedCount++
            stats.errors.push({ error: `AI Analysis ${analysis.id}: ${error.message}` })
          }
        }

        logger.progress(
          Math.min(i + CONFIG.BATCH_SIZE, aiAnalyses.length),
          aiAnalyses.length,
          'AI Analyses'
        )
      }
    }

    // ========================================================================
    // STEP 3: SUMMARY
    // ========================================================================

    logger.log('\n================================================================================')
    logger.log('SEEDING SUMMARY')
    logger.log('================================================================================')
    logger.log(`Total verifications found: ${stats.totalVerifications}`)
    logger.log(`Verifications updated: ${stats.updatedVerifications}`)
    logger.log(`Total AI analyses found: ${stats.totalAIAnalyses}`)
    logger.log(`AI analyses updated: ${stats.updatedAIAnalyses}`)
    logger.log(`Failed updates: ${stats.failedCount}`)

    if (stats.errors.length > 0) {
      logger.log(`\n⚠️  ${stats.errors.length} errors encountered`)
    }

    const statsFilePath = path.join(__dirname, '../seeding-logs/34-photo-evidence-stats.json')
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

seedPhotoEvidence()
