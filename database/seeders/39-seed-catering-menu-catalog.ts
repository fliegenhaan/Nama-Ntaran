/**
 * ============================================================================
 * SEEDING SCRIPT 39: CATERING MENU CATALOG
 * ============================================================================
 *
 * Purpose: Generate master catalog of menu items per catering
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: caterings
 *
 * Run: npm run seed:catering-menu-catalog
 * Estimated records: 100-300 menu items
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

interface CateringMenuCatalogInsert {
  catering_id: number
  menu_code: string
  menu_name: string
  category: string
  description: string
  base_price: number
  portion_size: string
  preparation_time_minutes: number
  shelf_life_hours: number
  storage_temp: string
  calories: number
  protein_grams: number
  carbs_grams: number
  fat_grams: number
  ingredients: string[]
  allergens: string[]
  is_vegetarian: boolean
  is_halal: boolean
  is_available: boolean
  min_order_quantity: number
  image_url: string | null
  nutritional_info: any
}

interface SeedingStats {
  totalCaterings: number
  totalMenuItems: number
  successCount: number
  failedCount: number
  byCategory: Record<string, number>
  errors: Array<{ error: string }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  BATCH_SIZE: 100,

  MENU_ITEMS_PER_CATERING_MIN: 5,
  MENU_ITEMS_PER_CATERING_MAX: 15,

  MENU_TEMPLATES: [
    {
      category: 'main_course',
      name: 'Nasi Putih + Ayam Goreng',
      description: 'Nasi putih dengan ayam goreng berbumbu rempah',
      portion_size: '250g',
      prep_time: 30,
      shelf_life: 6,
      storage: 'room',
      calories: 650,
      protein: 35,
      carbs: 85,
      fat: 18,
      ingredients: ['Nasi Putih', 'Ayam', 'Bumbu', 'Minyak Goreng'],
      allergens: [],
      is_vegetarian: false,
      price_min: 12000,
      price_max: 15000,
    },
    {
      category: 'main_course',
      name: 'Nasi Merah + Ikan Goreng',
      description: 'Nasi merah dengan ikan kembung goreng',
      portion_size: '250g',
      prep_time: 25,
      shelf_life: 5,
      storage: 'room',
      calories: 580,
      protein: 32,
      carbs: 75,
      fat: 15,
      ingredients: ['Nasi Merah', 'Ikan Kembung', 'Bumbu', 'Minyak Goreng'],
      allergens: ['fish'],
      is_vegetarian: false,
      price_min: 11000,
      price_max: 14000,
    },
    {
      category: 'main_course',
      name: 'Nasi Putih + Tempe Bacem',
      description: 'Nasi putih dengan tempe bacem manis',
      portion_size: '220g',
      prep_time: 45,
      shelf_life: 8,
      storage: 'room',
      calories: 520,
      protein: 22,
      carbs: 80,
      fat: 12,
      ingredients: ['Nasi Putih', 'Tempe', 'Gula Merah', 'Kecap', 'Bumbu'],
      allergens: ['soy'],
      is_vegetarian: true,
      price_min: 9000,
      price_max: 11000,
    },
    {
      category: 'side_dish',
      name: 'Sayur Asem',
      description: 'Sayur asem segar dengan kacang panjang dan jagung',
      portion_size: '150g',
      prep_time: 20,
      shelf_life: 4,
      storage: 'room',
      calories: 80,
      protein: 4,
      carbs: 15,
      fat: 1,
      ingredients: ['Kacang Panjang', 'Jagung', 'Labu', 'Asam Jawa', 'Garam'],
      allergens: [],
      is_vegetarian: true,
      price_min: 5000,
      price_max: 7000,
    },
    {
      category: 'side_dish',
      name: 'Tumis Kangkung',
      description: 'Kangkung tumis bawang putih',
      portion_size: '120g',
      prep_time: 10,
      shelf_life: 3,
      storage: 'room',
      calories: 60,
      protein: 3,
      carbs: 8,
      fat: 2,
      ingredients: ['Kangkung', 'Bawang Putih', 'Cabai', 'Minyak', 'Garam'],
      allergens: [],
      is_vegetarian: true,
      price_min: 4000,
      price_max: 6000,
    },
    {
      category: 'soup',
      name: 'Sop Sayur',
      description: 'Sop sayuran segar',
      portion_size: '200ml',
      prep_time: 25,
      shelf_life: 4,
      storage: 'room',
      calories: 90,
      protein: 5,
      carbs: 12,
      fat: 2,
      ingredients: ['Wortel', 'Kentang', 'Kol', 'Seledri', 'Kaldu'],
      allergens: [],
      is_vegetarian: true,
      price_min: 5000,
      price_max: 7000,
    },
    {
      category: 'dessert',
      name: 'Buah Potong',
      description: 'Campuran buah segar potong',
      portion_size: '100g',
      prep_time: 10,
      shelf_life: 2,
      storage: 'refrigerated',
      calories: 60,
      protein: 1,
      carbs: 15,
      fat: 0,
      ingredients: ['Semangka', 'Melon', 'Pepaya', 'Nanas'],
      allergens: [],
      is_vegetarian: true,
      price_min: 6000,
      price_max: 8000,
    },
    {
      category: 'beverage',
      name: 'Air Mineral',
      description: 'Air mineral kemasan 250ml',
      portion_size: '250ml',
      prep_time: 0,
      shelf_life: 720,
      storage: 'room',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      ingredients: ['Air Mineral'],
      allergens: [],
      is_vegetarian: true,
      price_min: 2000,
      price_max: 3000,
    },
    {
      category: 'snack',
      name: 'Pisang Goreng',
      description: 'Pisang goreng crispy',
      portion_size: '100g',
      prep_time: 15,
      shelf_life: 4,
      storage: 'room',
      calories: 180,
      protein: 3,
      carbs: 30,
      fat: 6,
      ingredients: ['Pisang', 'Tepung', 'Gula', 'Minyak Goreng'],
      allergens: [],
      is_vegetarian: true,
      price_min: 5000,
      price_max: 7000,
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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function generateMenuCode(cateringId: number, index: number): string {
  return `M${cateringId.toString().padStart(3, '0')}-${index.toString().padStart(3, '0')}`
}

function generateMenuItem(
  catering: Catering,
  template: any,
  index: number
): CateringMenuCatalogInsert {
  const basePrice = randomInt(template.price_min, template.price_max)
  const isAvailable = Math.random() > 0.10 // 90% available

  return {
    catering_id: catering.id,
    menu_code: generateMenuCode(catering.id, index),
    menu_name: template.name,
    category: template.category,
    description: template.description,
    base_price: basePrice,
    portion_size: template.portion_size,
    preparation_time_minutes: template.prep_time,
    shelf_life_hours: template.shelf_life,
    storage_temp: template.storage,
    calories: template.calories,
    protein_grams: template.protein,
    carbs_grams: template.carbs,
    fat_grams: template.fat,
    ingredients: template.ingredients,
    allergens: template.allergens,
    is_vegetarian: template.is_vegetarian,
    is_halal: true,
    is_available: isAvailable,
    min_order_quantity: randomInt(30, 100),
    image_url: null,
    nutritional_info: {
      serving_size: template.portion_size,
      calories: template.calories,
      protein: template.protein,
      carbohydrates: template.carbs,
      fat: template.fat,
      fiber: randomInt(3, 10),
      sodium: randomInt(200, 800),
      sugar: randomInt(2, 15),
    },
  }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedCateringMenuCatalog() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalCaterings: 0,
    totalMenuItems: 0,
    successCount: 0,
    failedCount: 0,
    byCategory: {},
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 39: CATERING MENU CATALOG')
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

    // STEP 2: GENERATE MENU ITEMS
    logger.log('\nSTEP 2: Generating menu items...')

    const menuItemsToInsert: CateringMenuCatalogInsert[] = []

    for (const catering of caterings) {
      const numItems = randomInt(
        CONFIG.MENU_ITEMS_PER_CATERING_MIN,
        CONFIG.MENU_ITEMS_PER_CATERING_MAX
      )

      const selectedTemplates = new Set<any>()
      while (selectedTemplates.size < numItems && selectedTemplates.size < CONFIG.MENU_TEMPLATES.length) {
        selectedTemplates.add(randomElement(CONFIG.MENU_TEMPLATES))
      }

      let index = 1
      for (const template of selectedTemplates) {
        const menuItem = generateMenuItem(catering as Catering, template, index)
        menuItemsToInsert.push(menuItem)
        stats.byCategory[menuItem.category] = (stats.byCategory[menuItem.category] || 0) + 1
        index++
      }
    }

    stats.totalMenuItems = menuItemsToInsert.length
    logger.success(`Generated ${menuItemsToInsert.length} menu items`)

    // STEP 3: INSERT MENU ITEMS
    logger.log('\nSTEP 3: Inserting menu items to database...')
    logger.log(`Batch size: ${CONFIG.BATCH_SIZE}`)

    for (let i = 0; i < menuItemsToInsert.length; i += CONFIG.BATCH_SIZE) {
      const batch = menuItemsToInsert.slice(i, i + CONFIG.BATCH_SIZE)

      try {
        const { error } = await supabase
          .from('catering_menu_catalog')
          .insert(batch)

        if (error) {
          logger.error(`Batch failed: ${error.message}`)
          stats.failedCount += batch.length
          stats.errors.push({ error: error.message })
        } else {
          stats.successCount += batch.length
          logger.progress(
            Math.min(i + CONFIG.BATCH_SIZE, menuItemsToInsert.length),
            menuItemsToInsert.length,
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
    logger.log(`Total menu items generated: ${stats.totalMenuItems}`)
    logger.log(`Successfully inserted: ${stats.successCount}`)
    logger.log(`Failed: ${stats.failedCount}`)

    if (stats.successCount > 0) {
      logger.log('\nMenu Items by Category:')
      Object.entries(stats.byCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          const percentage = ((count / stats.successCount) * 100).toFixed(1)
          logger.log(`  ${category}: ${count} (${percentage}%)`)
        })
    }

    const statsFilePath = path.join(__dirname, '../seeding-logs/39-catering-menu-catalog-stats.json')
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

seedCateringMenuCatalog()
