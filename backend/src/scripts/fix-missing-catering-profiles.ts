import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fix missing catering profiles for users with role='catering'
 *
 * Problem: Users registered as 'catering' but caterings table record was not created
 * due to silent error (error not caught in registration flow)
 *
 * Solution: Find all catering users without caterings record and create them
 */
async function fixMissingCateringProfiles() {
  console.log('🔧 Starting fix for missing catering profiles...\n');

  try {
    // 1. Find all users with role='catering'
    const { data: cateringUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'catering');

    if (usersError) {
      throw new Error(`Failed to fetch catering users: ${usersError.message}`);
    }

    if (!cateringUsers || cateringUsers.length === 0) {
      console.log('✅ No catering users found.');
      return;
    }

    console.log(`📊 Found ${cateringUsers.length} catering user(s)\n`);

    // 2. Check which ones are missing catering profiles
    let fixedCount = 0;
    let alreadyExistCount = 0;

    for (const user of cateringUsers) {
      console.log(`\n🔍 Checking user: ${user.email} (ID: ${user.id})`);

      // Check if catering profile exists
      const { data: existingCatering, error: checkError } = await supabase
        .from('caterings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingCatering) {
        console.log(`   ✅ Catering profile already exists (ID: ${existingCatering.id})`);
        alreadyExistCount++;
        continue;
      }

      // Profile doesn't exist, create it
      console.log('   ⚠️  Missing catering profile! Creating...');

      const { data: newCatering, error: createError } = await supabase
        .from('caterings')
        .insert({
          name: user.email.split('@')[0], // Use email prefix as name
          company_name: user.email.split('@')[0], // Placeholder
          email: user.email,
          user_id: user.id
        })
        .select('id')
        .single();

      if (createError) {
        console.error(`   ❌ Error creating profile: ${createError.message}`);
        console.error(`   Details:`, createError);
        continue;
      }

      console.log(`   ✅ Created catering profile (ID: ${newCatering.id})`);
      fixedCount++;
    }

    // 3. Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total catering users: ${cateringUsers.length}`);
    console.log(`Already had profiles: ${alreadyExistCount}`);
    console.log(`Fixed (created): ${fixedCount}`);
    console.log('='.repeat(50));

    if (fixedCount > 0) {
      console.log('\n✅ Fix completed! Users can now access their dashboard.');
      console.log('\n⚠️  NOTE: Created profiles use email prefix as placeholder name.');
      console.log('   Users should update their profile via /catering/settings\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

fixMissingCateringProfiles();
