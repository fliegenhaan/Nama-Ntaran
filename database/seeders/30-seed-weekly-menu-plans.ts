/**
 * ============================================================================
 * SEEDING SCRIPT 30: WEEKLY MENU PLANS
 * ============================================================================
 *
 * Purpose: Generate weekly menu plans with nutritional information
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: caterings
 *
 * Run: npm run seed:weekly-menu-plans
 * Estimated records: 500-1000 menu plans
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

interface MenuPlanInsert {
  catering_id: number
  plan_date: string
  meal_type: string
  menu_name: string
  description: string
  calories: number
  protein_grams: number
  carbs_grams: number
  fat_grams: number
  fiber_grams: number
  sodium_mg: number
  sugar_grams: number
  ingredients: any
  allergens: string[]
  is_vegetarian: boolean
  is_halal: boolean
  is_bgn_compliant: boolean
  bgn_score: number
  estimated_cost: number
  image_url: string | null
  approved_by: number | null
  approved_at: string | null
}

interface SeedingStats {
  totalCaterings: number
  totalMenuPlans: number
  successCount: number
  failedCount: number
  byMealType: Record<string, number>
  errors: Array<{ error: string }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  BATCH_SIZE: 100,

  // Generate menu plans for next 30 days
  DAYS_FORWARD: 30,

  MEAL_TYPES: ['lunch'], // Focus on lunch untuk program MBG

  // Sample menu items
  MENU_ITEMS: [
    {
      name: 'Nasi Putih + Ayam Goreng + Sayur Asem',
      description: 'Nasi putih dengan ayam goreng berbumbu dan sayur asem segar',
      calories: 650, protein: 35, carbs: 85, fat: 18, fiber: 8, sodium: 850, sugar: 5,
      ingredients: [
        { name: 'Nasi Putih', amount: '150g' },
        { name: 'Ayam Goreng', amount: '100g' },
        { name: 'Sayur Asem', amount: '100g' },
        { name: 'Sambal', amount: '20g' }
      ],
      allergens: [],
      is_vegetarian: false,
      bgn_compliant: true,
      bgn_score: 0.85,
      cost: 12000,
    },
    {
      name: 'Nasi Merah + Ikan Kembung Goreng + Tumis Kangkung',
      description: 'Nasi merah dengan ikan kembung goreng dan tumis kangkung',
      calories: 580, protein: 32, carbs: 75, fat: 15, fiber: 10, sodium: 780, sugar: 4,
      ingredients: [
        { name: 'Nasi Merah', amount: '150g' },
        { name: 'Ikan Kembung', amount: '80g' },
        { name: 'Tumis Kangkung', amount: '100g' }
      ],
      allergens: ['fish'],
      is_vegetarian: false,
      bgn_compliant: true,
      bgn_score: 0.92,
      cost: 11000,
    },
    {
      name: 'Nasi Putih + Tempe Goreng + Sayur Bayam',
      description: 'Nasi putih dengan tempe goreng dan sayur bayam bening',
      calories: 520, protein: 22, carbs: 80, fat: 12, fiber: 12, sodium: 650, sugar: 3,
      ingredients: [
        { name: 'Nasi Putih', amount: '150g' },
        { name: 'Tempe Goreng', amount: '100g' },
        { name: 'Sayur Bayam', amount: '100g' }
      ],
      allergens: ['soy'],
      is_vegetarian: true,
      bgn_compliant: true,
      bgn_score: 0.88,
      cost: 9000,
    },
    {
      name: 'Nasi Uduk + Rendang Sapi + Sayur Lodeh',
      description: 'Nasi uduk harum dengan rendang sapi empuk dan sayur lodeh',
      calories: 720, protein: 38, carbs: 88, fat: 22, fiber: 9, sodium: 920, sugar: 6,
      ingredients: [
        { name: 'Nasi Uduk', amount: '150g' },
        { name: 'Rendang Sapi', amount: '100g' },
        { name: 'Sayur Lodeh', amount: '100g' }
      ],
      allergens: [],
      is_vegetarian: false,
      bgn_compliant: true,
      bgn_score: 0.82,
      cost: 15000,
    },
    {
      name: 'Nasi Kuning + Ayam Bakar + Urap',
      description: 'Nasi kuning dengan ayam bakar bumbu kecap dan urap sayuran',
      calories: 680, protein: 36, carbs: 82, fat: 20, fiber: 11, sodium: 880, sugar: 5,
      ingredients: [
        { name: 'Nasi Kuning', amount: '150g' },
        { name: 'Ayam Bakar', amount: '100g' },
        { name: 'Urap', amount: '80g' }
      ],
      allergens: [],
      is_vegetarian: false,
      bgn_compliant: true,
      bgn_score: 0.90,
      cost: 13000,
    },
    {
      name: 'Nasi Putih + Tahu Tempe Bacem + Sayur Sop',
      description: 'Nasi putih dengan tahu tempe bacem manis dan sayur sop',
      calories: 540, protein: 24, carbs: 78, fat: 14, fiber: 13, sodium: 720, sugar: 8,
      ingredients: [
        { name: 'Nasi Putih', amount: '150g' },
        { name: 'Tahu Bacem', amount: '50g' },
        { name: 'Tempe Bacem', amount: '50g' },
        { name: 'Sayur Sop', amount: '100g' }
      ],
      allergens: ['soy'],
      is_vegetarian: true,
      bgn_compliant: true,
      bgn_score: 0.87,
      cost: 10000,
    },
    {
      name: 'Nasi Putih + Telur Balado + Tumis Buncis',
      description: 'Nasi putih dengan telur balado pedas dan tumis buncis',
      calories: 560, protein: 26, carbs: 76, fat: 16, fiber: 9, sodium: 800, sugar: 4,
      ingredients: [
        { name: 'Nasi Putih', amount: '150g' },
        { name: 'Telur Balado', amount: '2 butir' },
        { name: 'Tumis Buncis', amount: '100g' }
      ],
      allergens: ['egg'],
      is_vegetarian: true,
      bgn_compliant: true,
      bgn_score: 0.84,
      cost: 10500,
    },
    {
      name: 'Nasi Putih + Ikan Gurame Goreng + Lalapan',
      description: 'Nasi putih dengan ikan gurame goreng crispy dan lalapan segar',
      calories: 620, protein: 34, carbs: 80, fat: 18, fiber: 7, sodium: 820, sugar: 3,
      ingredients: [
        { name: 'Nasi Putih', amount: '150g' },
        { name: 'Ikan Gurame', amount: '100g' },
        { name: 'Lalapan', amount: '80g' },
        { name: 'Sambal', amount: '20g' }
      ],
      allergens: ['fish'],
      is_vegetarian: false,
      bgn_compliant: true,
      bgn_score: 0.86,
      cost: 14000,
    },
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

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function generateMenuPlan(
  catering: Catering,
  date: Date,
  mealType: string
): MenuPlanInsert {
  const menuItem = randomElement(CONFIG.MENU_ITEMS)

  const approved = Math.random() > 0.1 // 90% approved
  const approvedAt = approved ? new Date(date.getTime() - 7 * 86400000) : null

  return {
    catering_id: catering.id,
    plan_date: date.toISOString().split('T')[0],
    meal_type: mealType,
    menu_name: menuItem.name,
    description: menuItem.description,
    calories: menuItem.calories,
    protein_grams: menuItem.protein,
    carbs_grams: menuItem.carbs,
    fat_grams: menuItem.fat,
    fiber_grams: menuItem.fiber,
    sodium_mg: menuItem.sodium,
    sugar_grams: menuItem.sugar,
    ingredients: menuItem.ingredients,
    allergens: menuItem.allergens,
    is_vegetarian: menuItem.is_vegetarian,
    is_halal: true, // All menu items are halal for Indonesian schools
    is_bgn_compliant: menuItem.bgn_compliant,
    bgn_score: menuItem.bgn_score,
    estimated_cost: menuItem.cost,
    image_url: null, // Could be added later with placeholder URLs
    approved_by: approved ? 1 : null, // Admin user ID
    approved_at: approvedAt ? approvedAt.toISOString() : null,
  }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedWeeklyMenuPlans() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalCaterings: 0,
    totalMenuPlans: 0,
    successCount: 0,
    failedCount: 0,
    byMealType: {},
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 30: WEEKLY MENU PLANS')
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

    // STEP 2: GENERATE MENU PLANS
    logger.log('\nSTEP 2: Generating menu plans...')

    const menuPlansToInsert: MenuPlanInsert[] = []
    const today = new Date()

    for (let dayOffset = 0; dayOffset < CONFIG.DAYS_FORWARD; dayOffset++) {
      const planDate = addDays(today, dayOffset)

      // Skip weekends (Saturday = 6, Sunday = 0)
      if (planDate.getDay() === 0 || planDate.getDay() === 6) continue

      for (const catering of caterings) {
        for (const mealType of CONFIG.MEAL_TYPES) {
          const menuPlan = generateMenuPlan(catering, planDate, mealType)
          menuPlansToInsert.push(menuPlan)

          stats.byMealType[mealType] = (stats.byMealType[mealType] || 0) + 1
        }
      }
    }

    stats.totalMenuPlans = menuPlansToInsert.length
    logger.success(`Generated ${menuPlansToInsert.length} menu plans`)

    // STEP 3: INSERT MENU PLANS
    logger.log('\nSTEP 3: Inserting menu plans to database...')
    logger.log(`Batch size: ${CONFIG.BATCH_SIZE}`)

    for (let i = 0; i < menuPlansToInsert.length; i += CONFIG.BATCH_SIZE) {
      const batch = menuPlansToInsert.slice(i, i + CONFIG.BATCH_SIZE)

      try {
        const { error } = await supabase
          .from('menu_plans')
          .insert(batch)

        if (error) {
          logger.error(`Batch failed: ${error.message}`)
          stats.failedCount += batch.length
          stats.errors.push({ error: error.message })
        } else {
          stats.successCount += batch.length
          logger.progress(
            Math.min(i + CONFIG.BATCH_SIZE, menuPlansToInsert.length),
            menuPlansToInsert.length,
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
    logger.log(`Total caterings: ${stats.totalCaterings}`)
    logger.log(`Total menu plans generated: ${stats.totalMenuPlans}`)
    logger.log(`Successfully inserted: ${stats.successCount}`)
    logger.log(`Failed: ${stats.failedCount}`)

    if (stats.successCount > 0) {
      logger.log('\nMenu Plans by Meal Type:')
      Object.entries(stats.byMealType).forEach(([type, count]) => {
        logger.log(`  ${type}: ${count}`)
      })
    }

    const statsFilePath = path.join(__dirname, '../seeding-logs/30-weekly-menu-plans-stats.json')
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

seedWeeklyMenuPlans()
