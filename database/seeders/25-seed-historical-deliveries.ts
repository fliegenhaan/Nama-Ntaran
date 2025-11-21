/**
 * ============================================================================
 * SEEDING SCRIPT 25: HISTORICAL DELIVERIES
 * ============================================================================
 * Purpose: Generate 6 months of historical delivery data for analytics testing
 * Dependencies: schools, caterings, menu_items must exist
 * Data Volume: 3000-5000 historical delivery records
 *
 * Run: npx ts-node database/seeders/25-seed-historical-deliveries.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  BATCH_SIZE: 100,
  MONTHS_OF_HISTORY: 6,
  MIN_DELIVERIES_PER_DAY: 20,
  MAX_DELIVERIES_PER_DAY: 50,

  // Historical data should be mostly completed
  STATUS_DISTRIBUTION: {
    verified: 0.75,
    delivered: 0.15,
    cancelled: 0.05,
    pending: 0.03,
    scheduled: 0.02
  },

  TIME_WINDOWS: [
    { start: '07:00', end: '08:30' },
    { start: '09:00', end: '10:00' },
    { start: '11:00', end: '13:00' },
    { start: '14:00', end: '15:30' }
  ]
}

// ============================================================================
// TYPES
// ============================================================================

interface School { id: number; name: string; npsn: string }
interface Catering { id: number; name: string }
interface MenuItem { id: number; catering_id: number; name: string; price: number; category: string }

// ============================================================================
// UTILITIES
// ============================================================================

class Logger {
  private startTime = Date.now()

  log(msg: string) { console.log(`[${((Date.now() - this.startTime) / 1000).toFixed(2)}s] ${msg}`) }
  success(msg: string) { console.log(`[${((Date.now() - this.startTime) / 1000).toFixed(2)}s] ✅ ${msg}`) }
  error(msg: string, err?: any) { console.error(`[${((Date.now() - this.startTime) / 1000).toFixed(2)}s] ❌ ${msg}`, err || '') }
}

const logger = new Logger()

function getRandomStatus(): string {
  const random = Math.random()
  let cumulative = 0
  for (const [status, prob] of Object.entries(CONFIG.STATUS_DISTRIBUTION)) {
    cumulative += prob
    if (random <= cumulative) return status
  }
  return 'verified'
}

function generateHistoricalDates(): Date[] {
  const dates: Date[] = []
  const today = new Date()
  const startDate = new Date(today)
  startDate.setMonth(startDate.getMonth() - CONFIG.MONTHS_OF_HISTORY)

  // Skip weekends (Saturday=6, Sunday=0)
  for (let d = new Date(startDate); d < today; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(new Date(d))
    }
  }
  return dates
}

function generateQRCode(schoolId: number, date: Date): string {
  const hash = crypto.randomBytes(4).toString('hex')
  return `MBG-HIST-${schoolId}-${date.toISOString().split('T')[0]}-${hash}`
}

function generateDriverName(): string {
  const firstNames = ['Agus', 'Budi', 'Chandra', 'Dedi', 'Eko', 'Fajar', 'Gilang', 'Hadi', 'Indra', 'Joko', 'Rizki', 'Wahyu']
  const lastNames = ['Setiawan', 'Wijaya', 'Pratama', 'Santoso', 'Hidayat', 'Nugroho', 'Saputra', 'Kurniawan']
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
}

function generateDriverPhone(): string {
  const prefixes = ['0812', '0813', '0821', '0822', '0851', '0852']
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
}

function generateVehicleNumber(): string {
  const areas = ['B', 'D', 'F', 'L', 'N', 'T', 'AA', 'AB']
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return `${areas[Math.floor(Math.random() * areas.length)]} ${Math.floor(1000 + Math.random() * 9000)} ${letters[Math.floor(Math.random() * 26)]}${letters[Math.floor(Math.random() * 26)]}${letters[Math.floor(Math.random() * 26)]}`
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedHistoricalDeliveries() {
  logger.log('=' .repeat(80))
  logger.log('SEEDING SCRIPT 25: HISTORICAL DELIVERIES')
  logger.log('=' .repeat(80))

  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_KEY) {
    logger.error('Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    // Fetch dependencies
    logger.log('Fetching schools...')
    const { data: schools, error: schoolsErr } = await supabase
      .from('schools')
      .select('id, name, npsn')
      .limit(500)
    if (schoolsErr || !schools) throw new Error(`Failed to fetch schools: ${schoolsErr?.message}`)
    logger.success(`Found ${schools.length} schools`)

    logger.log('Fetching caterings...')
    const { data: caterings, error: cateringsErr } = await supabase
      .from('caterings')
      .select('id, name')
    if (cateringsErr || !caterings) throw new Error(`Failed to fetch caterings: ${cateringsErr?.message}`)
    logger.success(`Found ${caterings.length} caterings`)

    logger.log('Fetching menu items...')
    const { data: menuItems, error: menuErr } = await supabase
      .from('menu_items')
      .select('id, catering_id, name, price, category')
      .eq('is_available', true)
    if (menuErr || !menuItems) throw new Error(`Failed to fetch menu items: ${menuErr?.message}`)

    // Group menus by catering
    const menuMap = new Map<number, MenuItem[]>()
    menuItems.forEach((item: MenuItem) => {
      if (!menuMap.has(item.catering_id)) menuMap.set(item.catering_id, [])
      menuMap.get(item.catering_id)!.push(item)
    })
    logger.success(`Found ${menuItems.length} menu items`)

    // Generate historical dates
    const historicalDates = generateHistoricalDates()
    logger.log(`Generating deliveries for ${historicalDates.length} school days over ${CONFIG.MONTHS_OF_HISTORY} months`)

    // Generate deliveries
    const deliveries: any[] = []

    for (const date of historicalDates) {
      const deliveriesForDay = CONFIG.MIN_DELIVERIES_PER_DAY +
        Math.floor(Math.random() * (CONFIG.MAX_DELIVERIES_PER_DAY - CONFIG.MIN_DELIVERIES_PER_DAY))

      for (let i = 0; i < deliveriesForDay && i < schools.length; i++) {
        const school = schools[Math.floor(Math.random() * schools.length)]
        const catering = caterings[Math.floor(Math.random() * caterings.length)]
        const cateringMenus = menuMap.get(catering.id) || []

        if (cateringMenus.length === 0) continue

        const timeWindow = CONFIG.TIME_WINDOWS[Math.floor(Math.random() * CONFIG.TIME_WINDOWS.length)]
        const portions = 100 + Math.floor(Math.random() * 400) // 100-500 portions
        const status = getRandomStatus()

        // Select menu items
        const selectedMenus = cateringMenus.slice(0, 1 + Math.floor(Math.random() * 2))
        const menuItemsOrder = selectedMenus.map(m => ({
          menu_id: m.id,
          menu_name: m.name,
          quantity: portions,
          unit_price: m.price,
          subtotal: portions * m.price
        }))
        const totalAmount = menuItemsOrder.reduce((sum, m) => sum + m.subtotal, 0)

        const delivery: any = {
          school_id: school.id,
          catering_id: catering.id,
          delivery_date: date.toISOString().split('T')[0],
          delivery_time_start: timeWindow.start,
          delivery_time_end: timeWindow.end,
          portions,
          menu_items: menuItemsOrder,
          amount: totalAmount,
          total_amount: totalAmount,
          status,
          notes: Math.random() > 0.7 ? 'Historical delivery' : null,
          qr_code: generateQRCode(school.id, date)
        }

        // Add driver info for completed deliveries
        if (['delivered', 'verified'].includes(status)) {
          delivery.driver_name = generateDriverName()
          delivery.driver_phone = generateDriverPhone()
          delivery.vehicle_number = generateVehicleNumber()

          const deliveredAt = new Date(date)
          const [h, m] = timeWindow.start.split(':').map(Number)
          deliveredAt.setHours(h, m + Math.floor(Math.random() * 60), 0, 0)
          delivery.delivered_at = deliveredAt.toISOString()
        }

        deliveries.push(delivery)
      }
    }

    logger.log(`Generated ${deliveries.length} historical deliveries`)

    // Insert in batches
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < deliveries.length; i += CONFIG.BATCH_SIZE) {
      const batch = deliveries.slice(i, i + CONFIG.BATCH_SIZE)
      const { data, error } = await supabase.from('deliveries').insert(batch).select('id')

      if (error) {
        logger.error(`Batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1} failed`, error.message)
        errorCount += batch.length
      } else {
        successCount += data?.length || 0
      }

      if ((i + CONFIG.BATCH_SIZE) % 500 === 0 || i + CONFIG.BATCH_SIZE >= deliveries.length) {
        logger.log(`Progress: ${Math.min(i + CONFIG.BATCH_SIZE, deliveries.length)}/${deliveries.length}`)
      }

      await new Promise(r => setTimeout(r, 50))
    }

    // Summary
    logger.log('=' .repeat(80))
    logger.log('SEEDING SUMMARY')
    logger.log('=' .repeat(80))
    console.log(`
📊 HISTORICAL DELIVERIES:
   Total Generated: ${deliveries.length}
   ✅ Inserted: ${successCount}
   ❌ Failed: ${errorCount}
   Date Range: ${historicalDates[0]?.toISOString().split('T')[0]} to ${historicalDates[historicalDates.length - 1]?.toISOString().split('T')[0]}
   School Days: ${historicalDates.length}
`)

    logger.success('SEEDING COMPLETED!')

  } catch (error) {
    logger.error('Fatal error', error)
    process.exit(1)
  }
}

// Execute
seedHistoricalDeliveries()
  .then(() => process.exit(0))
  .catch((e) => { logger.error('Script failed', e); process.exit(1) })
