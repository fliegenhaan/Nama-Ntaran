/**
 * ============================================================================
 * SEEDING SCRIPT 33: CATERING CONTRACTS
 * ============================================================================
 *
 * Purpose: Generate formal contracts between government and caterings
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: caterings, schools
 *
 * Run: npm run seed:catering-contracts
 * Estimated records: 20-50 contracts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Catering {
  id: number
  name: string
}

interface CateringContractInsert {
  catering_id: number
  contract_number: string
  contract_type: string
  start_date: string
  end_date: string
  service_provinces: string[]
  service_cities: string[]
  service_districts: string[]
  assigned_school_ids: number[]
  max_schools: number
  price_per_portion: number
  max_daily_portions: number
  min_daily_portions: number
  total_contract_value: number
  sla_terms: any
  penalties: any
  payment_terms: string
  status: string
  signed_at: string
  signed_by: number
  terminated_at: string | null
  termination_reason: string | null
}

interface SeedingStats {
  totalCaterings: number
  totalContracts: number
  successCount: number
  failedCount: number
  byStatus: Record<string, number>
  errors: Array<{ error: string }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Contract duration: 6 months to 1 year
  CONTRACT_DURATION_MONTHS_MIN: 6,
  CONTRACT_DURATION_MONTHS_MAX: 12,

  // Indonesia provinces/cities for service areas
  REGIONS: [
    { province: 'DKI Jakarta', cities: ['Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Timur', 'Jakarta Barat', 'Jakarta Utara'] },
    { province: 'Jawa Barat', cities: ['Bandung', 'Bekasi', 'Depok', 'Bogor', 'Cimahi'] },
    { province: 'Jawa Tengah', cities: ['Semarang', 'Surakarta', 'Magelang', 'Salatiga'] },
    { province: 'Jawa Timur', cities: ['Surabaya', 'Malang', 'Kediri', 'Madiun', 'Pasuruan'] },
    { province: 'Banten', cities: ['Tangerang', 'Tangerang Selatan', 'Serang', 'Cilegon'] },
  ],

  CONTRACT_TYPES: ['standard', 'premium'],

  PAYMENT_TERMS: ['weekly', 'bi-weekly', 'monthly'],
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

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function generateContractNumber(cateringId: number, year: number): string {
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `CTR/${year}/MBG/${cateringId.toString().padStart(3, '0')}/${randomNum}`
}

function generateContract(
  catering: Catering,
  schoolIds: number[],
  signedBy: number
): CateringContractInsert {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(1) // Start of current month

  const contractDuration = randomInt(
    CONFIG.CONTRACT_DURATION_MONTHS_MIN,
    CONFIG.CONTRACT_DURATION_MONTHS_MAX
  )
  const endDate = addMonths(startDate, contractDuration)

  const signedAt = new Date(startDate)
  signedAt.setDate(signedAt.getDate() - randomInt(7, 30)) // Signed 1-4 weeks before start

  const region = randomElement(CONFIG.REGIONS)
  const numCities = randomInt(1, Math.min(3, region.cities.length))
  const serviceCities = []
  for (let i = 0; i < numCities; i++) {
    const city = randomElement(region.cities)
    if (!serviceCities.includes(city)) {
      serviceCities.push(city)
    }
  }

  const contractType = randomElement(CONFIG.CONTRACT_TYPES)
  const pricePerPortion = contractType === 'premium' ? randomInt(20000, 25000) : randomInt(12000, 18000)

  const assignedSchoolIds = schoolIds.slice(0, randomInt(5, Math.min(20, schoolIds.length)))
  const maxSchools = assignedSchoolIds.length + randomInt(5, 10)
  const maxDailyPortions = assignedSchoolIds.length * randomInt(100, 500)
  const minDailyPortions = Math.floor(maxDailyPortions * 0.5)

  const workingDaysPerMonth = 20
  const avgPortionsPerDay = (maxDailyPortions + minDailyPortions) / 2
  const totalContractValue = avgPortionsPerDay * pricePerPortion * workingDaysPerMonth * contractDuration

  const slaTerms = {
    on_time_percentage: randomInt(90, 98),
    quality_min_score: 4.0,
    max_issues_per_month: randomInt(3, 8),
    max_late_deliveries_per_month: randomInt(2, 5),
    max_cancelled_deliveries_per_month: 1,
  }

  const penalties = {
    late_delivery: randomInt(50000, 150000),
    quality_issue: randomInt(200000, 500000),
    missed_delivery: randomInt(500000, 1000000),
    sla_breach_monthly: randomInt(2000000, 5000000),
  }

  const status = Math.random() > 0.05 ? 'active' : randomElement(['suspended', 'expired'])

  return {
    catering_id: catering.id,
    contract_number: generateContractNumber(catering.id, now.getFullYear()),
    contract_type: contractType,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    service_provinces: [region.province],
    service_cities: serviceCities,
    service_districts: [],
    assigned_school_ids: assignedSchoolIds,
    max_schools: maxSchools,
    price_per_portion: pricePerPortion,
    max_daily_portions: maxDailyPortions,
    min_daily_portions: minDailyPortions,
    total_contract_value: totalContractValue,
    sla_terms: slaTerms,
    penalties: penalties,
    payment_terms: randomElement(CONFIG.PAYMENT_TERMS),
    status: status,
    signed_at: signedAt.toISOString(),
    signed_by: signedBy,
    terminated_at: status === 'suspended' ? new Date().toISOString() : null,
    termination_reason: status === 'suspended' ? 'Multiple SLA violations' : null,
  }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedCateringContracts() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalCaterings: 0,
    totalContracts: 0,
    successCount: 0,
    failedCount: 0,
    byStatus: {},
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 33: CATERING CONTRACTS')
  logger.log('================================================================================')

  try {
    // STEP 1: FETCH CATERINGS
    logger.log('\nSTEP 1: Fetching caterings...')

    const { data: caterings, error: cateringsError } = await supabase
      .from('caterings')
      .select('id, name')

    if (cateringsError) {
      throw new Error(`Failed to fetch caterings: ${cateringsError.message}`)
    }

    if (!caterings || caterings.length === 0) {
      logger.error('No caterings found.')
      return
    }

    stats.totalCaterings = caterings.length
    logger.success(`Found ${caterings.length} caterings`)

    // STEP 2: FETCH SCHOOLS
    logger.log('\nSTEP 2: Fetching schools...')

    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id')

    if (schoolsError) {
      throw new Error(`Failed to fetch schools: ${schoolsError.message}`)
    }

    const schoolIds = schools?.map((s: any) => s.id) || []
    logger.success(`Found ${schoolIds.length} schools`)

    // STEP 3: GET ADMIN USER
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'ADMIN')
      .limit(1)

    const signedBy = admins && admins.length > 0 ? admins[0].id : 1

    // STEP 4: GENERATE CONTRACTS
    logger.log('\nSTEP 3: Generating contracts...')

    const contractsToInsert: CateringContractInsert[] = []

    for (const catering of caterings) {
      const contract = generateContract(catering, schoolIds, signedBy)
      contractsToInsert.push(contract)
      stats.byStatus[contract.status] = (stats.byStatus[contract.status] || 0) + 1
    }

    stats.totalContracts = contractsToInsert.length
    logger.success(`Generated ${contractsToInsert.length} contracts`)

    // STEP 5: INSERT CONTRACTS
    logger.log('\nSTEP 4: Inserting contracts to database...')

    for (const contract of contractsToInsert) {
      try {
        const { error } = await supabase
          .from('catering_contracts')
          .insert(contract)

        if (error) {
          logger.error(`Failed to insert contract ${contract.contract_number}: ${error.message}`)
          stats.failedCount++
          stats.errors.push({ error: error.message })
        } else {
          stats.successCount++
          logger.log(`  ✓ ${contract.contract_number}`)
        }
      } catch (error: any) {
        logger.error(`Exception inserting contract:`, error)
        stats.failedCount++
        stats.errors.push({ error: error.message || 'Unknown error' })
      }
    }

    // STEP 6: SUMMARY
    logger.log('\n================================================================================')
    logger.log('SEEDING SUMMARY')
    logger.log('================================================================================')
    logger.log(`Total caterings: ${stats.totalCaterings}`)
    logger.log(`Total contracts generated: ${stats.totalContracts}`)
    logger.log(`Successfully inserted: ${stats.successCount}`)
    logger.log(`Failed: ${stats.failedCount}`)

    if (stats.successCount > 0) {
      logger.log('\nContracts by Status:')
      Object.entries(stats.byStatus).forEach(([status, count]) => {
        logger.log(`  ${status}: ${count}`)
      })
    }

    const statsFilePath = path.join(__dirname, '../seeding-logs/33-catering-contracts-stats.json')
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

seedCateringContracts()
