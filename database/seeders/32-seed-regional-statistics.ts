/**
 * ============================================================================
 * SEEDING SCRIPT 32: REGIONAL STATISTICS
 * ============================================================================
 *
 * Purpose: Generate aggregate statistics per province/city/district
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: schools, caterings, deliveries
 *
 * Run: npm run seed:regional-statistics
 * Estimated records: 100-200 regional stats
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface School {
  id: number
  province: string
  city: string
  district: string
  total_students: number
}

interface RegionalStatisticInsert {
  province: string
  city: string | null
  district: string | null
  region_code: string | null
  total_schools: number
  covered_schools: number
  coverage_percentage: number
  total_students: number
  total_portions_delivered: number
  total_budget_allocated: number
  total_budget_disbursed: number
  avg_priority_score: number
  avg_poverty_rate: number
  avg_stunting_rate: number
  active_caterings: number
  total_issues: number
  resolution_rate: number
  period_start: string
  period_end: string
}

interface SeedingStats {
  totalRegions: number
  successCount: number
  failedCount: number
  byLevel: Record<string, number>
  errors: Array<{ error: string }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Period: last month
  PERIOD_START: new Date(new Date().setMonth(new Date().getMonth() - 1, 1)).toISOString().split('T')[0],
  PERIOD_END: new Date(new Date().setDate(0)).toISOString().split('T')[0],
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

function generateRegionalStats(
  province: string,
  city: string | null,
  district: string | null,
  schools: School[]
): RegionalStatisticInsert {
  const totalSchools = schools.length
  const coveredSchools = Math.floor(totalSchools * randomFloat(0.70, 0.95))
  const coveragePercentage = parseFloat(((coveredSchools / totalSchools) * 100).toFixed(2))

  const totalStudents = schools.reduce((sum, s) => sum + (s.total_students || 0), 0)
  const totalPortions = totalStudents * randomInt(15, 22) // deliveries per month

  const budgetAllocated = totalStudents * 15000 * 20 // Rp 15k per portion, 20 days
  const budgetDisbursed = Math.floor(budgetAllocated * randomFloat(0.75, 0.95))

  const avgPriorityScore = randomFloat(0.45, 0.85)
  const avgPovertyRate = randomFloat(0.10, 0.35)
  const avgStuntingRate = randomFloat(0.15, 0.30)

  const activeCaterings = randomInt(2, 8)
  const totalIssues = randomInt(0, Math.floor(coveredSchools * 0.1))
  const resolutionRate = randomFloat(85, 100)

  return {
    province,
    city,
    district,
    region_code: null,
    total_schools: totalSchools,
    covered_schools: coveredSchools,
    coverage_percentage: coveragePercentage,
    total_students: totalStudents,
    total_portions_delivered: totalPortions,
    total_budget_allocated: budgetAllocated,
    total_budget_disbursed: budgetDisbursed,
    avg_priority_score: avgPriorityScore,
    avg_poverty_rate: avgPovertyRate,
    avg_stunting_rate: avgStuntingRate,
    active_caterings: activeCaterings,
    total_issues: totalIssues,
    resolution_rate: resolutionRate,
    period_start: CONFIG.PERIOD_START,
    period_end: CONFIG.PERIOD_END,
  }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedRegionalStatistics() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalRegions: 0,
    successCount: 0,
    failedCount: 0,
    byLevel: {},
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 32: REGIONAL STATISTICS')
  logger.log('================================================================================')

  try {
    // STEP 1: FETCH SCHOOLS
    logger.log('\nSTEP 1: Fetching schools...')

    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, province, city, district, total_students')

    if (schoolsError) {
      throw new Error(`Failed to fetch schools: ${schoolsError.message}`)
    }

    if (!schools || schools.length === 0) {
      logger.error('No schools found.')
      return
    }

    logger.success(`Found ${schools.length} schools`)

    // STEP 2: GROUP BY REGION
    logger.log('\nSTEP 2: Grouping schools by region...')

    const regionMap = new Map<string, School[]>()

    // Group by province
    const provinceGroups = new Map<string, School[]>()
    schools.forEach((school: School) => {
      const key = school.province
      if (!provinceGroups.has(key)) {
        provinceGroups.set(key, [])
      }
      provinceGroups.get(key)!.push(school)
    })

    // Group by city
    const cityGroups = new Map<string, School[]>()
    schools.forEach((school: School) => {
      if (!school.city) return
      const key = `${school.province}|${school.city}`
      if (!cityGroups.has(key)) {
        cityGroups.set(key, [])
      }
      cityGroups.get(key)!.push(school)
    })

    logger.success(`Found ${provinceGroups.size} provinces and ${cityGroups.size} cities`)

    // STEP 3: GENERATE STATISTICS
    logger.log('\nSTEP 3: Generating regional statistics...')

    const statsToInsert: RegionalStatisticInsert[] = []

    // Province-level stats
    for (const [province, schoolsInProvince] of provinceGroups) {
      const stat = generateRegionalStats(province, null, null, schoolsInProvince)
      statsToInsert.push(stat)
      stats.byLevel['province'] = (stats.byLevel['province'] || 0) + 1
    }

    // City-level stats
    for (const [key, schoolsInCity] of cityGroups) {
      const [province, city] = key.split('|')
      const stat = generateRegionalStats(province, city, null, schoolsInCity)
      statsToInsert.push(stat)
      stats.byLevel['city'] = (stats.byLevel['city'] || 0) + 1
    }

    stats.totalRegions = statsToInsert.length
    logger.success(`Generated ${statsToInsert.length} regional statistics`)

    // STEP 4: INSERT STATISTICS
    logger.log('\nSTEP 4: Inserting statistics to database...')

    for (const stat of statsToInsert) {
      try {
        const { error } = await supabase
          .from('regional_statistics')
          .insert(stat)

        if (error) {
          logger.error(`Failed to insert ${stat.province}/${stat.city || 'province'}: ${error.message}`)
          stats.failedCount++
          stats.errors.push({ error: error.message })
        } else {
          stats.successCount++
        }
      } catch (error: any) {
        logger.error(`Exception inserting ${stat.province}:`, error)
        stats.failedCount++
        stats.errors.push({ error: error.message || 'Unknown error' })
      }
    }

    // STEP 5: SUMMARY
    logger.log('\n================================================================================')
    logger.log('SEEDING SUMMARY')
    logger.log('================================================================================')
    logger.log(`Total regions: ${stats.totalRegions}`)
    logger.log(`Successfully inserted: ${stats.successCount}`)
    logger.log(`Failed: ${stats.failedCount}`)

    if (stats.successCount > 0) {
      logger.log('\nStatistics by Level:')
      Object.entries(stats.byLevel).forEach(([level, count]) => {
        logger.log(`  ${level}: ${count}`)
      })
    }

    const statsFilePath = path.join(__dirname, '../seeding-logs/32-regional-statistics-stats.json')
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

seedRegionalStatistics()
