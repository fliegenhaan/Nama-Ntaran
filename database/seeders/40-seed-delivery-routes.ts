/**
 * ============================================================================
 * SEEDING SCRIPT 40: DELIVERY ROUTES
 * ============================================================================
 *
 * Purpose: Generate optimized delivery routes for caterings
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: caterings, schools, deliveries
 *
 * Run: npm run seed:delivery-routes
 * Estimated records: 50-150 delivery routes
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

interface School {
  id: number
  name: string
}

interface DeliveryRouteInsert {
  catering_id: number
  route_date: string
  route_name: string
  driver_name: string
  driver_phone: string
  vehicle_number: string
  vehicle_type: string
  schools_order: number[]
  estimated_start_time: string
  estimated_end_time: string
  actual_start_time: string | null
  actual_end_time: string | null
  total_distance_km: number
  total_portions: number
  total_schools: number
  route_status: string
  waypoints: any
  optimization_score: number
  notes: string | null
}

interface SeedingStats {
  totalCaterings: number
  totalRoutes: number
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

  BATCH_SIZE: 50,

  // Generate routes for next 7 days
  DAYS_FORWARD: 7,

  ROUTES_PER_DAY_MIN: 1,
  ROUTES_PER_DAY_MAX: 3,

  VEHICLE_TYPES: ['motorcycle', 'car', 'van', 'truck'],

  DRIVER_NAMES: [
    'Bapak Andi', 'Bapak Budi', 'Bapak Cecep', 'Bapak Dedi', 'Bapak Eko',
    'Bapak Fauzi', 'Bapak Gani', 'Bapak Hadi', 'Bapak Iqbal', 'Bapak Joko'
  ],

  ROUTE_STATUSES: ['planned', 'in_progress', 'completed'],
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

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}

function generateVehicleNumber(): string {
  const prefix = randomElement(['B', 'D', 'E', 'F'])
  const number = randomInt(1000, 9999)
  const suffix = randomElement(['AA', 'AB', 'AC', 'AD', 'AG', 'AH'])
  return `${prefix} ${number} ${suffix}`
}

function generateWaypoints(schools: School[], schoolsOrder: number[]): any {
  const waypoints = []
  let cumulativeTime = 0
  let cumulativeDistance = 0

  for (let i = 0; i < schoolsOrder.length; i++) {
    const schoolId = schoolsOrder[i]
    const school = schools.find(s => s.id === schoolId)

    const timeFromPrev = i === 0 ? randomInt(10, 20) : randomInt(5, 15) // minutes
    const distanceFromPrev = randomFloat(1.5, 8.0) // km

    cumulativeTime += timeFromPrev
    cumulativeDistance += distanceFromPrev

    const baseTime = new Date()
    baseTime.setHours(7, 0, 0, 0) // Start at 07:00
    baseTime.setMinutes(baseTime.getMinutes() + cumulativeTime)

    waypoints.push({
      school_id: schoolId,
      school_name: school?.name || `School ${schoolId}`,
      sequence: i + 1,
      eta: baseTime.toTimeString().slice(0, 5),
      distance_from_prev_km: distanceFromPrev,
      portions: randomInt(100, 500),
    })
  }

  return { waypoints, totalDistance: cumulativeDistance }
}

function generateRoute(
  catering: Catering,
  schools: School[],
  routeDate: Date,
  routeIndex: number
): DeliveryRouteInsert {
  const numSchools = randomInt(3, Math.min(10, schools.length))
  const schoolsOrder: number[] = []

  // Randomly select schools
  const availableSchools = [...schools]
  for (let i = 0; i < numSchools; i++) {
    const randomIndex = randomInt(0, availableSchools.length - 1)
    schoolsOrder.push(availableSchools[randomIndex].id)
    availableSchools.splice(randomIndex, 1)
  }

  const driverName = randomElement(CONFIG.DRIVER_NAMES)
  const vehicleType = randomElement(CONFIG.VEHICLE_TYPES)

  const { waypoints, totalDistance } = generateWaypoints(schools, schoolsOrder)
  const totalPortions = waypoints.reduce((sum: number, wp: any) => sum + wp.portions, 0)

  const estimatedStartTime = '07:00'
  const estimatedDuration = numSchools * 15 + totalDistance * 2 // 15 min per stop + 2 min per km
  const estimatedEndTime = addMinutes(estimatedStartTime, estimatedDuration)

  // Route status based on date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  routeDate.setHours(0, 0, 0, 0)

  let routeStatus = 'planned'
  let actualStartTime = null
  let actualEndTime = null

  if (routeDate < today) {
    routeStatus = 'completed'
    actualStartTime = addMinutes(estimatedStartTime, randomInt(-5, 10))
    actualEndTime = addMinutes(estimatedEndTime, randomInt(-10, 20))
  } else if (routeDate.getTime() === today.getTime()) {
    routeStatus = Math.random() < 0.5 ? 'in_progress' : 'completed'
    if (routeStatus === 'in_progress') {
      actualStartTime = addMinutes(estimatedStartTime, randomInt(-5, 5))
    } else {
      actualStartTime = addMinutes(estimatedStartTime, randomInt(-5, 10))
      actualEndTime = addMinutes(estimatedEndTime, randomInt(-10, 20))
    }
  }

  const optimizationScore = randomFloat(75, 98)

  return {
    catering_id: catering.id,
    route_date: routeDate.toISOString().split('T')[0],
    route_name: `Route ${routeDate.toISOString().split('T')[0]}-${routeIndex}`,
    driver_name: driverName,
    driver_phone: `08${randomInt(1000000000, 9999999999)}`,
    vehicle_number: generateVehicleNumber(),
    vehicle_type: vehicleType,
    schools_order: schoolsOrder,
    estimated_start_time: estimatedStartTime,
    estimated_end_time: estimatedEndTime,
    actual_start_time: actualStartTime,
    actual_end_time: actualEndTime,
    total_distance_km: totalDistance,
    total_portions: totalPortions,
    total_schools: numSchools,
    route_status: routeStatus,
    waypoints: waypoints,
    optimization_score: optimizationScore,
    notes: routeStatus === 'completed' ? 'Delivery completed successfully' : null,
  }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedDeliveryRoutes() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalCaterings: 0,
    totalRoutes: 0,
    successCount: 0,
    failedCount: 0,
    byStatus: {},
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 40: DELIVERY ROUTES')
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
      .select('id, name')

    if (schoolsError) {
      throw new Error(`Failed to fetch schools: ${schoolsError.message}`)
    }

    logger.success(`Found ${schools?.length || 0} schools`)

    // STEP 3: GENERATE ROUTES
    logger.log('\nSTEP 3: Generating delivery routes...')

    const routesToInsert: DeliveryRouteInsert[] = []
    const today = new Date()

    for (const catering of caterings) {
      for (let dayOffset = 0; dayOffset < CONFIG.DAYS_FORWARD; dayOffset++) {
        const routeDate = addDays(today, dayOffset)

        // Skip weekends
        if (routeDate.getDay() === 0 || routeDate.getDay() === 6) continue

        const numRoutes = randomInt(CONFIG.ROUTES_PER_DAY_MIN, CONFIG.ROUTES_PER_DAY_MAX)

        for (let routeIdx = 1; routeIdx <= numRoutes; routeIdx++) {
          const route = generateRoute(catering as Catering, schools as School[], routeDate, routeIdx)
          routesToInsert.push(route)
          stats.byStatus[route.route_status] = (stats.byStatus[route.route_status] || 0) + 1
        }
      }
    }

    stats.totalRoutes = routesToInsert.length
    logger.success(`Generated ${routesToInsert.length} delivery routes`)

    // STEP 4: INSERT ROUTES
    logger.log('\nSTEP 4: Inserting routes to database...')
    logger.log(`Batch size: ${CONFIG.BATCH_SIZE}`)

    for (let i = 0; i < routesToInsert.length; i += CONFIG.BATCH_SIZE) {
      const batch = routesToInsert.slice(i, i + CONFIG.BATCH_SIZE)

      try {
        const { error } = await supabase
          .from('delivery_routes')
          .insert(batch)

        if (error) {
          logger.error(`Batch failed: ${error.message}`)
          stats.failedCount += batch.length
          stats.errors.push({ error: error.message })
        } else {
          stats.successCount += batch.length
          logger.progress(
            Math.min(i + CONFIG.BATCH_SIZE, routesToInsert.length),
            routesToInsert.length,
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
    logger.log(`Total caterings: ${stats.totalCaterings}`)
    logger.log(`Total routes generated: ${stats.totalRoutes}`)
    logger.log(`Successfully inserted: ${stats.successCount}`)
    logger.log(`Failed: ${stats.failedCount}`)

    if (stats.successCount > 0) {
      logger.log('\nRoutes by Status:')
      Object.entries(stats.byStatus)
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
          const percentage = ((count / stats.successCount) * 100).toFixed(1)
          logger.log(`  ${status}: ${count} (${percentage}%)`)
        })
    }

    const statsFilePath = path.join(__dirname, '../seeding-logs/40-delivery-routes-stats.json')
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

seedDeliveryRoutes()
