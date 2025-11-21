/**
 * ============================================================================
 * SEEDING SCRIPT 36: BUDGET ALLOCATIONS
 * ============================================================================
 *
 * Purpose: Generate budget allocation per fiscal period per region
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: users (for approval)
 *
 * Run: npm run seed:budget-allocations
 * Estimated records: 50-150 budget allocations
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface BudgetAllocationInsert {
  fiscal_year: number
  fiscal_quarter: number | null
  province: string
  city: string | null
  district: string | null
  allocation_type: string
  source_fund: string
  total_budget: number
  allocated_amount: number
  disbursed_amount: number
  remaining_amount: number
  target_schools: number
  target_students: number
  target_portions: number
  approved_by: number | null
  approved_at: string | null
  status: string
  notes: string | null
}

interface SeedingStats {
  totalAllocations: number
  successCount: number
  failedCount: number
  byStatus: Record<string, number>
  byYear: Record<number, number>
  errors: Array<{ error: string }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Generate for current and previous fiscal year
  CURRENT_YEAR: new Date().getFullYear(),

  PROVINCES: [
    'DKI Jakarta',
    'Jawa Barat',
    'Jawa Tengah',
    'Jawa Timur',
    'Banten',
    'Sumatera Utara',
    'Sumatera Selatan',
    'Kalimantan Timur',
    'Sulawesi Selatan',
    'Papua',
  ],

  CITIES: {
    'DKI Jakarta': ['Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Timur', 'Jakarta Barat', 'Jakarta Utara'],
    'Jawa Barat': ['Bandung', 'Bekasi', 'Depok', 'Bogor', 'Cimahi'],
    'Jawa Tengah': ['Semarang', 'Surakarta', 'Magelang', 'Salatiga', 'Pekalongan'],
    'Jawa Timur': ['Surabaya', 'Malang', 'Kediri', 'Madiun', 'Pasuruan'],
    'Banten': ['Tangerang', 'Tangerang Selatan', 'Serang', 'Cilegon'],
  },

  ALLOCATION_TYPES: ['regular', 'emergency', 'supplemental'],

  SOURCE_FUNDS: ['APBN', 'APBD', 'DAK', 'BOS'],

  STATUSES: ['active', 'approved', 'depleted', 'closed'],
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

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function generateProvinceBudget(
  fiscalYear: number,
  quarter: number | null,
  province: string,
  approvedBy: number | null
): BudgetAllocationInsert {
  const allocationType = quarter === null ? 'regular' : randomElement(CONFIG.ALLOCATION_TYPES)
  const sourceFund = randomElement(CONFIG.SOURCE_FUNDS)

  const targetSchools = randomInt(50, 200)
  const targetStudents = targetSchools * randomInt(100, 500)
  const targetPortions = targetStudents * (quarter ? 60 : 240) // Per quarter or full year

  const totalBudget = targetPortions * randomInt(12000, 18000)
  const allocatedAmount = Math.floor(totalBudget * randomFloat(0.70, 0.95))
  const disbursedAmount = Math.floor(allocatedAmount * randomFloat(0.60, 0.90))
  const remainingAmount = allocatedAmount - disbursedAmount

  const status = remainingAmount < totalBudget * 0.05 ? 'depleted' :
                 disbursedAmount > 0 ? 'active' : 'approved'

  const approvedAt = new Date(fiscalYear, 0, randomInt(1, 31)).toISOString()

  return {
    fiscal_year: fiscalYear,
    fiscal_quarter: quarter,
    province: province,
    city: null,
    district: null,
    allocation_type: allocationType,
    source_fund: sourceFund,
    total_budget: totalBudget,
    allocated_amount: allocatedAmount,
    disbursed_amount: disbursedAmount,
    remaining_amount: remainingAmount,
    target_schools: targetSchools,
    target_students: targetStudents,
    target_portions: targetPortions,
    approved_by: approvedBy,
    approved_at: approvedAt,
    status: status,
    notes: allocationType === 'emergency' ? 'Alokasi darurat untuk daerah terdampak bencana' : null,
  }
}

function generateCityBudget(
  fiscalYear: number,
  quarter: number | null,
  province: string,
  city: string,
  approvedBy: number | null
): BudgetAllocationInsert {
  const allocationType = randomElement(CONFIG.ALLOCATION_TYPES)
  const sourceFund = randomElement(CONFIG.SOURCE_FUNDS)

  const targetSchools = randomInt(10, 50)
  const targetStudents = targetSchools * randomInt(100, 500)
  const targetPortions = targetStudents * (quarter ? 60 : 240)

  const totalBudget = targetPortions * randomInt(12000, 18000)
  const allocatedAmount = Math.floor(totalBudget * randomFloat(0.70, 0.95))
  const disbursedAmount = Math.floor(allocatedAmount * randomFloat(0.60, 0.90))
  const remainingAmount = allocatedAmount - disbursedAmount

  const status = remainingAmount < totalBudget * 0.05 ? 'depleted' :
                 disbursedAmount > 0 ? 'active' : 'approved'

  const approvedAt = new Date(fiscalYear, quarter ? (quarter - 1) * 3 : 0, randomInt(1, 28)).toISOString()

  return {
    fiscal_year: fiscalYear,
    fiscal_quarter: quarter,
    province: province,
    city: city,
    district: null,
    allocation_type: allocationType,
    source_fund: sourceFund,
    total_budget: totalBudget,
    allocated_amount: allocatedAmount,
    disbursed_amount: disbursedAmount,
    remaining_amount: remainingAmount,
    target_schools: targetSchools,
    target_students: targetStudents,
    target_portions: targetPortions,
    approved_by: approvedBy,
    approved_at: approvedAt,
    status: status,
    notes: null,
  }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedBudgetAllocations() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalAllocations: 0,
    successCount: 0,
    failedCount: 0,
    byStatus: {},
    byYear: {},
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 36: BUDGET ALLOCATIONS')
  logger.log('================================================================================')

  try {
    // STEP 1: GET APPROVER
    logger.log('\nSTEP 1: Fetching government users...')

    const { data: govUsers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'GOVERNMENT')
      .limit(1)

    const approvedBy = govUsers && govUsers.length > 0 ? govUsers[0].id : null
    logger.success(`Approver: ${approvedBy || 'None'}`)

    // STEP 2: GENERATE ALLOCATIONS
    logger.log('\nSTEP 2: Generating budget allocations...')

    const allocationsToInsert: BudgetAllocationInsert[] = []

    // Generate for current and previous year
    for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
      const year = CONFIG.CURRENT_YEAR - yearOffset

      // Annual provincial budgets
      for (const province of CONFIG.PROVINCES) {
        const allocation = generateProvinceBudget(year, null, province, approvedBy)
        allocationsToInsert.push(allocation)
        stats.byStatus[allocation.status] = (stats.byStatus[allocation.status] || 0) + 1
        stats.byYear[year] = (stats.byYear[year] || 0) + 1
      }

      // Quarterly city budgets (only for provinces with cities defined)
      for (const [province, cities] of Object.entries(CONFIG.CITIES)) {
        for (let quarter = 1; quarter <= 4; quarter++) {
          // Only generate for Q1-Q3 for current year, all quarters for previous year
          if (year === CONFIG.CURRENT_YEAR && quarter > 3) continue

          const city = randomElement(cities)
          const allocation = generateCityBudget(year, quarter, province, city, approvedBy)
          allocationsToInsert.push(allocation)
          stats.byStatus[allocation.status] = (stats.byStatus[allocation.status] || 0) + 1
          stats.byYear[year] = (stats.byYear[year] || 0) + 1
        }
      }
    }

    stats.totalAllocations = allocationsToInsert.length
    logger.success(`Generated ${allocationsToInsert.length} budget allocations`)

    // STEP 3: INSERT ALLOCATIONS
    logger.log('\nSTEP 3: Inserting allocations to database...')

    for (let i = 0; i < allocationsToInsert.length; i++) {
      const allocation = allocationsToInsert[i]

      try {
        const { error } = await supabase
          .from('budget_allocations')
          .insert(allocation)

        if (error) {
          logger.error(`Failed to insert ${allocation.province}/${allocation.city || 'province'}: ${error.message}`)
          stats.failedCount++
          stats.errors.push({ error: error.message })
        } else {
          stats.successCount++

          if ((i + 1) % 10 === 0) {
            logger.progress(i + 1, allocationsToInsert.length, 'Progress')
          }
        }
      } catch (error: any) {
        logger.error(`Exception inserting allocation:`, error)
        stats.failedCount++
        stats.errors.push({ error: error.message || 'Unknown error' })
      }
    }

    // STEP 4: SUMMARY
    logger.log('\n================================================================================')
    logger.log('SEEDING SUMMARY')
    logger.log('================================================================================')
    logger.log(`Total allocations generated: ${stats.totalAllocations}`)
    logger.log(`Successfully inserted: ${stats.successCount}`)
    logger.log(`Failed: ${stats.failedCount}`)

    if (stats.successCount > 0) {
      logger.log('\nAllocations by Status:')
      Object.entries(stats.byStatus)
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
          logger.log(`  ${status}: ${count}`)
        })

      logger.log('\nAllocations by Fiscal Year:')
      Object.entries(stats.byYear)
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
        .forEach(([year, count]) => {
          logger.log(`  ${year}: ${count}`)
        })
    }

    const statsFilePath = path.join(__dirname, '../seeding-logs/36-budget-allocations-stats.json')
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

seedBudgetAllocations()
