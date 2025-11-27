/**
 * ============================================================================
 * CLEAR TEST DATA SCRIPT
 * ============================================================================
 *
 * Purpose: Clear all test data created by 23-seed-admin-test-data.ts
 * This is useful when you want to re-run the seeder with fresh data
 *
 * Run: npx ts-node database/seeders/00-clear-test-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}

async function clearTestData() {
  console.log('============================================================================')
  console.log('CLEARING TEST DATA')
  console.log('============================================================================\n')

  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    console.log('⚠️  This will delete the following data:')
    console.log('   - Verifications')
    console.log('   - AI Food Analyses')
    console.log('   - Escrow Transactions')
    console.log('   - Anomaly Alerts')
    console.log('   - Deliveries')
    console.log('   - Allocations')
    console.log('   - Budget Allocations')
    console.log('\n⏳ Deleting in reverse order to respect foreign keys...\n')

    // Delete in reverse order to respect foreign key constraints

    // 1. Verifications
    console.log('Deleting verifications...')
    const { error: verError } = await supabase
      .from('verifications')
      .delete()
      .neq('id', 0) // Delete all
    if (verError) console.error('⚠️  Verifications:', verError.message)
    else console.log('✅ Verifications deleted')

    // 2. AI Food Analyses
    console.log('Deleting AI food analyses...')
    const { error: aiError } = await supabase
      .from('ai_food_analyses')
      .delete()
      .neq('id', 0)
    if (aiError) console.error('⚠️  AI Analyses:', aiError.message)
    else console.log('✅ AI food analyses deleted')

    // 3. Escrow Transactions
    console.log('Deleting escrow transactions...')
    const { error: escrowError } = await supabase
      .from('escrow_transactions')
      .delete()
      .neq('id', 0)
    if (escrowError) console.error('⚠️  Escrow Transactions:', escrowError.message)
    else console.log('✅ Escrow transactions deleted')

    // 4. Anomaly Alerts
    console.log('Deleting anomaly alerts...')
    const { error: anomalyError } = await supabase
      .from('anomaly_alerts')
      .delete()
      .neq('id', 0)
    if (anomalyError) console.error('⚠️  Anomaly Alerts:', anomalyError.message)
    else console.log('✅ Anomaly alerts deleted')

    // 5. Deliveries
    console.log('Deleting deliveries...')
    const { error: deliveryError } = await supabase
      .from('deliveries')
      .delete()
      .neq('id', 0)
    if (deliveryError) console.error('⚠️  Deliveries:', deliveryError.message)
    else console.log('✅ Deliveries deleted')

    // 6. Allocations
    console.log('Deleting allocations...')
    const { error: allocError } = await supabase
      .from('allocations')
      .delete()
      .neq('id', 0)
    if (allocError) console.error('⚠️  Allocations:', allocError.message)
    else console.log('✅ Allocations deleted')

    // 7. Budget Allocations
    console.log('Deleting budget allocations...')
    const { error: budgetError } = await supabase
      .from('budget_allocations')
      .delete()
      .neq('id', 0)
    if (budgetError) console.error('⚠️  Budget Allocations:', budgetError.message)
    else console.log('✅ Budget allocations deleted')

    console.log('\n============================================================================')
    console.log('✅ TEST DATA CLEARED SUCCESSFULLY!')
    console.log('============================================================================')
    console.log('\nYou can now run: npx ts-node 23-seed-admin-test-data.ts')

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  clearTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}

export { clearTestData }
