/**
 * ============================================================================
 * SEEDING SCRIPT 13: PAYMENT METHODS
 * ============================================================================
 *
 * Purpose: Seed payment_methods table with bank account & e-wallet info
 * Dependencies:
 *   - 01-seed-users.ts (caterings must exist)
 *
 * Run: npx ts-node database/seeders/13-seed-payment-methods.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CateringData {
  id: number
  name: string
  company_name: string | null
}

interface PaymentMethodInsert {
  catering_id: number
  method_type: string
  bank_code: string | null
  account_number: string | null
  account_holder_name: string | null
  ewallet_provider: string | null
  ewallet_identifier: string | null
  wallet_address: string | null
  is_active: boolean
  is_verified: boolean
}

interface SeedingStats {
  totalCaterings: number
  totalPaymentMethods: number
  successCount: number
  failedCount: number
  byMethodType: Record<string, number>
  byBankCode: Record<string, number>
  byEwalletProvider: Record<string, number>
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

  // Payment method type distribution
  METHOD_TYPE_DISTRIBUTION: {
    BANK_TRANSFER: 0.75,      // 75% bank transfer
    EWALLET: 0.20,            // 20% e-wallet
    CRYPTOCURRENCY: 0.05      // 5% crypto
  },

  // Indonesian bank codes
  BANK_CODES: [
    'BCA',     // Bank Central Asia
    'MANDIRI', // Bank Mandiri
    'BRI',     // Bank Rakyat Indonesia
    'BNI',     // Bank Negara Indonesia
    'CIMB',    // CIMB Niaga
    'DANAMON', // Bank Danamon
    'PERMATA', // Bank Permata
    'BTN',     // Bank Tabungan Negara
    'MEGA',    // Bank Mega
    'BSI'      // Bank Syariah Indonesia
  ],

  // E-wallet providers
  EWALLET_PROVIDERS: [
    'OVO',
    'DANA',
    'GOPAY',
    'LINKAJA',
    'SHOPEEPAY'
  ],

  // Verification rate
  VERIFICATION_RATE: 0.90  // 90% verified
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

function weightedRandom(distribution: Record<string, number>): string {
  const random = Math.random()
  let cumulative = 0

  for (const [key, probability] of Object.entries(distribution)) {
    cumulative += probability
    if (random <= cumulative) {
      return key
    }
  }

  return Object.keys(distribution)[0]
}

function generateAccountNumber(bankCode: string): string {
  // Generate realistic account numbers based on bank
  const prefixes: Record<string, string> = {
    BCA: '0',
    MANDIRI: '1',
    BRI: '0',
    BNI: '0',
    CIMB: '7',
    DANAMON: '0',
    PERMATA: '9',
    BTN: '0',
    MEGA: '0',
    BSI: '7'
  }

  const prefix = prefixes[bankCode] || '0'
  const length = randomInt(10, 16)
  const randomDigits = Array.from({ length: length - prefix.length }, () => randomInt(0, 9)).join('')

  return prefix + randomDigits
}

function generateEwalletIdentifier(provider: string): string {
  // Generate realistic e-wallet identifiers (phone numbers)
  const prefixes = ['08', '628'] // Indonesian phone prefixes
  const prefix = prefixes[randomInt(0, prefixes.length - 1)]
  const digits = Array.from({ length: 10 }, () => randomInt(0, 9)).join('')

  return prefix + digits
}

function generateWalletAddress(): string {
  // Generate Ethereum-like wallet address
  const randomHex = Array.from({ length: 40 }, () =>
    randomInt(0, 15).toString(16)
  ).join('')

  return `0x${randomHex}`
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchCaterings(supabase: any): Promise<CateringData[]> {
  logger.log('Fetching caterings...')

  const { data, error } = await supabase
    .from('caterings')
    .select('id, name, company_name')
    .order('id')

  if (error) {
    throw new Error(`Failed to fetch caterings: ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error('No caterings found. Please run 01-seed-users.ts first')
  }

  logger.success(`Found ${data.length} caterings`)
  return data
}

// ============================================================================
// DATA GENERATION
// ============================================================================

async function generatePaymentMethods(caterings: CateringData[]): Promise<PaymentMethodInsert[]> {
  logger.log(`Generating payment methods for ${caterings.length} caterings...`)

  const paymentMethods: PaymentMethodInsert[] = []

  for (const catering of caterings) {
    // Determine method type
    const methodType = weightedRandom(CONFIG.METHOD_TYPE_DISTRIBUTION)

    // Account holder name (use company name or catering name)
    const accountHolderName = catering.company_name || catering.name

    // Determine if verified
    const isVerified = Math.random() < CONFIG.VERIFICATION_RATE

    let paymentMethod: PaymentMethodInsert

    if (methodType === 'BANK_TRANSFER') {
      // Generate bank transfer details
      const bankCode = CONFIG.BANK_CODES[randomInt(0, CONFIG.BANK_CODES.length - 1)]
      const accountNumber = generateAccountNumber(bankCode)

      paymentMethod = {
        catering_id: catering.id,
        method_type: methodType,
        bank_code: bankCode,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        ewallet_provider: null,
        ewallet_identifier: null,
        wallet_address: null,
        is_active: true,
        is_verified: isVerified
      }
    } else if (methodType === 'EWALLET') {
      // Generate e-wallet details
      const ewalletProvider = CONFIG.EWALLET_PROVIDERS[randomInt(0, CONFIG.EWALLET_PROVIDERS.length - 1)]
      const ewalletIdentifier = generateEwalletIdentifier(ewalletProvider)

      paymentMethod = {
        catering_id: catering.id,
        method_type: methodType,
        bank_code: null,
        account_number: null,
        account_holder_name: accountHolderName,
        ewallet_provider: ewalletProvider,
        ewallet_identifier: ewalletIdentifier,
        wallet_address: null,
        is_active: true,
        is_verified: isVerified
      }
    } else {
      // CRYPTOCURRENCY
      const walletAddress = generateWalletAddress()

      paymentMethod = {
        catering_id: catering.id,
        method_type: methodType,
        bank_code: null,
        account_number: null,
        account_holder_name: accountHolderName,
        ewallet_provider: null,
        ewallet_identifier: null,
        wallet_address: walletAddress,
        is_active: true,
        is_verified: isVerified
      }
    }

    paymentMethods.push(paymentMethod)
  }

  logger.success(`Generated ${paymentMethods.length} payment methods`)

  return paymentMethods
}

// ============================================================================
// SUPABASE OPERATIONS
// ============================================================================

async function insertPaymentMethodsInBatches(
  supabase: any,
  paymentMethods: PaymentMethodInsert[],
  batchSize: number
): Promise<{ success: number; failed: number; errors: any[] }> {
  let success = 0
  let failed = 0
  const errors: any[] = []

  const totalBatches = Math.ceil(paymentMethods.length / batchSize)
  logger.log(`Inserting ${paymentMethods.length} payment methods in ${totalBatches} batches...`)

  for (let i = 0; i < paymentMethods.length; i += batchSize) {
    const batch = paymentMethods.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1

    try {
      const { data, error } = await supabase
        .from('payment_methods')
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
          Math.min(i + batchSize, paymentMethods.length),
          paymentMethods.length,
          'Inserting payment methods'
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

async function seedPaymentMethods() {
  logger.log('='.repeat(80))
  logger.log('SEEDING SCRIPT 13: PAYMENT METHODS')
  logger.log('='.repeat(80))

  const stats: SeedingStats = {
    totalCaterings: 0,
    totalPaymentMethods: 0,
    successCount: 0,
    failedCount: 0,
    byMethodType: {},
    byBankCode: {},
    byEwalletProvider: {},
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
    // Step 1: Fetch caterings
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 1: FETCHING CATERINGS')
    logger.log('='.repeat(80))

    const caterings = await fetchCaterings(supabase)
    stats.totalCaterings = caterings.length

    // Step 2: Generate payment methods
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 2: GENERATING PAYMENT METHODS')
    logger.log('='.repeat(80))

    const paymentMethods = await generatePaymentMethods(caterings)
    stats.totalPaymentMethods = paymentMethods.length

    // Calculate statistics
    paymentMethods.forEach((method) => {
      stats.byMethodType[method.method_type] = (stats.byMethodType[method.method_type] || 0) + 1

      if (method.bank_code) {
        stats.byBankCode[method.bank_code] = (stats.byBankCode[method.bank_code] || 0) + 1
      }

      if (method.ewallet_provider) {
        stats.byEwalletProvider[method.ewallet_provider] =
          (stats.byEwalletProvider[method.ewallet_provider] || 0) + 1
      }
    })

    // Step 3: Insert to database
    logger.log('\n' + '='.repeat(80))
    logger.log('STEP 3: INSERTING PAYMENT METHODS TO DATABASE')
    logger.log('='.repeat(80))

    const result = await insertPaymentMethodsInBatches(supabase, paymentMethods, CONFIG.BATCH_SIZE)
    stats.successCount = result.success
    stats.failedCount = result.failed
    stats.errors = result.errors

    // Print summary
    logger.log('\n' + '='.repeat(80))
    logger.log('SEEDING SUMMARY')
    logger.log('='.repeat(80))

    const verifiedCount = paymentMethods.filter(m => m.is_verified).length
    const verificationRate = ((verifiedCount / paymentMethods.length) * 100).toFixed(1)

    console.log(`
📊 PAYMENT METHODS:
   Total Caterings: ${stats.totalCaterings}
   Total Payment Methods: ${stats.totalPaymentMethods}
   ✅ Success: ${stats.successCount}
   ❌ Failed: ${stats.failedCount}
   Success Rate: ${((stats.successCount / stats.totalPaymentMethods) * 100).toFixed(1)}%

   ✅ Verified: ${verifiedCount} (${verificationRate}%)
   ⏳ Pending Verification: ${paymentMethods.length - verifiedCount}

📊 BY METHOD TYPE:`)

    Object.entries(stats.byMethodType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const percentage = ((count / stats.totalPaymentMethods) * 100).toFixed(1)
        console.log(`   ${type.padEnd(20)}: ${count.toString().padStart(4)} (${percentage}%)`)
      })

    if (Object.keys(stats.byBankCode).length > 0) {
      console.log(`\n📊 TOP BANKS:`)
      Object.entries(stats.byBankCode)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([bank, count], index) => {
          console.log(`   ${(index + 1).toString().padStart(2)}. ${bank.padEnd(15)}: ${count}`)
        })
    }

    if (Object.keys(stats.byEwalletProvider).length > 0) {
      console.log(`\n📊 E-WALLET PROVIDERS:`)
      Object.entries(stats.byEwalletProvider)
        .sort((a, b) => b[1] - a[1])
        .forEach(([provider, count]) => {
          console.log(`   ${provider.padEnd(15)}: ${count}`)
        })
    }

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
    const statsPath = path.join(logsDir, '13-payment-methods-stats.json')
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
  seedPaymentMethods()
    .then(() => {
      logger.success('Script execution completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Script execution failed', error)
      process.exit(1)
    })
}

export { seedPaymentMethods }
