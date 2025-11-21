/**
 * ============================================================================
 * SEEDING SCRIPT 31: PERFORMANCE METRICS
 * ============================================================================
 *
 * Purpose: Generate KPI metrics for schools and caterings
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: schools, caterings, deliveries, verifications
 *
 * Run: npm run seed:performance-metrics
 * Estimated records: 200-500 metrics
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface PerformanceMetricInsert {
  entity_type: string
  entity_id: number
  period_type: string
  period_start: string
  period_end: string
  total_deliveries: number
  total_portions: number
  on_time_deliveries?: number
  on_time_rate?: number
  quality_avg_score?: number
  total_issues: number
  issue_rate?: number
  total_revenue?: number
  verifications_completed?: number
  verification_speed_avg_minutes?: number
  reports_submitted?: number
  response_time_avg_hours?: number
  overall_score: number
  rank_in_category: number | null
}

interface SeedingStats {
  totalEntities: number
  totalMetrics: number
  successCount: number
  failedCount: number
  byEntityType: Record<string, number>
  errors: Array<{ error: string }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  BATCH_SIZE: 100,

  // Generate metrics for last 3 months (monthly)
  MONTHS_BACK: 3,

  PERIOD_TYPE: 'monthly',
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

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function getMonthStart(monthsBack: number): Date {
  const date = new Date()
  date.setMonth(date.getMonth() - monthsBack)
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date
}

function getMonthEnd(monthsBack: number): Date {
  const date = new Date()
  date.setMonth(date.getMonth() - monthsBack + 1)
  date.setDate(0)
  date.setHours(23, 59, 59, 999)
  return date
}

function generateCateringMetric(
  cateringId: number,
  monthsBack: number
): PerformanceMetricInsert {
  const totalDeliveries = randomInt(80, 300)
  const totalPortions = totalDeliveries * randomInt(100, 500)
  const onTimeDeliveries = Math.floor(totalDeliveries * randomFloat(0.85, 0.98))
  const onTimeRate = parseFloat(((onTimeDeliveries / totalDeliveries) * 100).toFixed(2))
  const qualityScore = randomFloat(3.5, 5.0)
  const totalIssues = randomInt(0, Math.floor(totalDeliveries * 0.1))
  const issueRate = parseFloat(((totalIssues / totalDeliveries) * 100).toFixed(2))
  const totalRevenue = totalPortions * randomInt(12000, 18000)

  // Calculate overall score (weighted average)
  const overallScore = parseFloat((
    onTimeRate * 0.4 +
    (qualityScore / 5) * 100 * 0.4 +
    (100 - issueRate) * 0.2
  ).toFixed(2))

  return {
    entity_type: 'catering',
    entity_id: cateringId,
    period_type: CONFIG.PERIOD_TYPE,
    period_start: getMonthStart(monthsBack).toISOString().split('T')[0],
    period_end: getMonthEnd(monthsBack).toISOString().split('T')[0],
    total_deliveries: totalDeliveries,
    total_portions: totalPortions,
    on_time_deliveries: onTimeDeliveries,
    on_time_rate: onTimeRate,
    quality_avg_score: qualityScore,
    total_issues: totalIssues,
    issue_rate: issueRate,
    total_revenue: totalRevenue,
    overall_score: overallScore,
    rank_in_category: null, // Will be calculated later
  }
}

function generateSchoolMetric(
  schoolId: number,
  monthsBack: number
): PerformanceMetricInsert {
  const totalDeliveries = randomInt(15, 25)
  const totalPortions = totalDeliveries * randomInt(100, 500)
  const verificationsCompleted = Math.floor(totalDeliveries * randomFloat(0.90, 1.0))
  const verificationSpeedAvg = randomInt(10, 120) // minutes
  const reportsSubmitted = randomInt(0, 5)
  const responseTimeAvg = randomInt(1, 48) // hours
  const totalIssues = randomInt(0, 3)

  // Calculate overall score
  const verificationRate = (verificationsCompleted / totalDeliveries) * 100
  const speedScore = Math.max(0, 100 - (verificationSpeedAvg / 120) * 100)
  const overallScore = parseFloat((
    verificationRate * 0.6 +
    speedScore * 0.3 +
    (totalIssues === 0 ? 10 : 0)
  ).toFixed(2))

  return {
    entity_type: 'school',
    entity_id: schoolId,
    period_type: CONFIG.PERIOD_TYPE,
    period_start: getMonthStart(monthsBack).toISOString().split('T')[0],
    period_end: getMonthEnd(monthsBack).toISOString().split('T')[0],
    total_deliveries: totalDeliveries,
    total_portions: totalPortions,
    total_issues: totalIssues,
    verifications_completed: verificationsCompleted,
    verification_speed_avg_minutes: verificationSpeedAvg,
    reports_submitted: reportsSubmitted,
    response_time_avg_hours: responseTimeAvg,
    overall_score: overallScore,
    rank_in_category: null,
  }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedPerformanceMetrics() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalEntities: 0,
    totalMetrics: 0,
    successCount: 0,
    failedCount: 0,
    byEntityType: {},
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 31: PERFORMANCE METRICS')
  logger.log('================================================================================')

  try {
    // STEP 1: FETCH CATERINGS AND SCHOOLS
    logger.log('\nSTEP 1: Fetching caterings and schools...')

    const [cateringsResult, schoolsResult] = await Promise.all([
      supabase.from('caterings').select('id'),
      supabase.from('schools').select('id')
    ])

    if (cateringsResult.error) {
      throw new Error(`Failed to fetch caterings: ${cateringsResult.error.message}`)
    }
    if (schoolsResult.error) {
      throw new Error(`Failed to fetch schools: ${schoolsResult.error.message}`)
    }

    const caterings = cateringsResult.data || []
    const schools = schoolsResult.data || []

    stats.totalEntities = caterings.length + schools.length
    logger.success(`Found ${caterings.length} caterings and ${schools.length} schools`)

    // STEP 2: GENERATE METRICS
    logger.log('\nSTEP 2: Generating performance metrics...')

    const metricsToInsert: PerformanceMetricInsert[] = []

    for (let monthOffset = 0; monthOffset < CONFIG.MONTHS_BACK; monthOffset++) {
      // Generate catering metrics
      for (const catering of caterings) {
        const metric = generateCateringMetric(catering.id, monthOffset)
        metricsToInsert.push(metric)
        stats.byEntityType['catering'] = (stats.byEntityType['catering'] || 0) + 1
      }

      // Generate school metrics
      for (const school of schools) {
        const metric = generateSchoolMetric(school.id, monthOffset)
        metricsToInsert.push(metric)
        stats.byEntityType['school'] = (stats.byEntityType['school'] || 0) + 1
      }
    }

    stats.totalMetrics = metricsToInsert.length
    logger.success(`Generated ${metricsToInsert.length} performance metrics`)

    // STEP 3: INSERT METRICS
    logger.log('\nSTEP 3: Inserting metrics to database...')
    logger.log(`Batch size: ${CONFIG.BATCH_SIZE}`)

    for (let i = 0; i < metricsToInsert.length; i += CONFIG.BATCH_SIZE) {
      const batch = metricsToInsert.slice(i, i + CONFIG.BATCH_SIZE)

      try {
        const { error } = await supabase
          .from('performance_metrics')
          .insert(batch)

        if (error) {
          logger.error(`Batch failed: ${error.message}`)
          stats.failedCount += batch.length
          stats.errors.push({ error: error.message })
        } else {
          stats.successCount += batch.length
          logger.progress(
            Math.min(i + CONFIG.BATCH_SIZE, metricsToInsert.length),
            metricsToInsert.length,
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
    logger.log(`Total entities: ${stats.totalEntities}`)
    logger.log(`Total metrics generated: ${stats.totalMetrics}`)
    logger.log(`Successfully inserted: ${stats.successCount}`)
    logger.log(`Failed: ${stats.failedCount}`)

    if (stats.successCount > 0) {
      logger.log('\nMetrics by Entity Type:')
      Object.entries(stats.byEntityType).forEach(([type, count]) => {
        logger.log(`  ${type}: ${count}`)
      })
    }

    const statsFilePath = path.join(__dirname, '../seeding-logs/31-performance-metrics-stats.json')
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

seedPerformanceMetrics()
