import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  ANALYSIS_RATE: 0.90, // 90% of deliveries get AI analysis
  BATCH_SIZE: 50,
};

// Food items that can be detected by Computer Vision
const DETECTED_FOOD_ITEMS = [
  'Nasi Putih', 'Ayam Goreng', 'Ikan Goreng', 'Tempe Goreng', 'Tahu Goreng',
  'Sayur Bayam', 'Sayur Sop', 'Sayur Kangkung', 'Sayur Lodeh', 'Sayur Asem',
  'Telur Dadar', 'Telur Rebus', 'Telur Balado', 'Sambal', 'Kerupuk',
  'Buah Pisang', 'Buah Jeruk', 'Buah Apel', 'Pepaya', 'Semangka'
];

const QUALITY_SCORE_DISTRIBUTION = {
  EXCELLENT: { range: [85, 100], weight: 0.45 },
  GOOD: { range: [70, 84], weight: 0.35 },
  ACCEPTABLE: { range: [60, 69], weight: 0.15 },
  POOR: { range: [40, 59], weight: 0.04 },
  VERY_POOR: { range: [20, 39], weight: 0.01 },
};

const ISSUE_TYPES = [
  'Portion size smaller than expected',
  'Food presentation not appealing',
  'Missing vegetable component',
  'Hygiene concerns detected',
  'Food temperature not optimal',
  'Packaging damaged',
  'Menu item mismatch',
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function weightedRandom<T>(items: { value: T; weight: number }[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item.value;
  }

  return items[items.length - 1].value;
}

function selectQualityTier(): keyof typeof QUALITY_SCORE_DISTRIBUTION {
  const tiers = Object.entries(QUALITY_SCORE_DISTRIBUTION).map(([tier, config]) => ({
    value: tier as keyof typeof QUALITY_SCORE_DISTRIBUTION,
    weight: config.weight,
  }));
  return weightedRandom(tiers);
}

function generateQualityScore(tier: keyof typeof QUALITY_SCORE_DISTRIBUTION): number {
  const [min, max] = QUALITY_SCORE_DISTRIBUTION[tier].range;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDetectedItems(portionCount: number): string[] {
  const numItems = Math.min(3 + Math.floor(Math.random() * 4), 7); // 3-7 items
  const shuffled = [...DETECTED_FOOD_ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numItems);
}

function estimateNutrition(items: string[], portionCount: number) {
  // Base calories per portion
  let calories = 400 + Math.floor(Math.random() * 200); // 400-600 cal
  let protein = 15 + Math.floor(Math.random() * 15); // 15-30g
  let carbs = 60 + Math.floor(Math.random() * 30); // 60-90g

  // Adjust based on items
  if (items.some(item => item.includes('Ayam') || item.includes('Ikan'))) {
    protein += 10;
    calories += 50;
  }
  if (items.some(item => item.includes('Sayur'))) {
    carbs += 5;
    protein += 2;
  }

  return {
    estimated_calories: Math.round(calories * portionCount),
    estimated_protein: Math.round(protein * portionCount),
    estimated_carbs: Math.round(carbs * portionCount),
    has_vegetables: items.some(item => item.includes('Sayur')),
  };
}

function generatePortionEstimate(actualPortions: number): {
  estimate: number;
  confidence: number;
  match: boolean;
} {
  const variance = Math.random() < 0.85 ? 0 : Math.floor(Math.random() * 3) - 1;
  const estimate = Math.max(1, actualPortions + variance);
  const confidence = variance === 0 ? 0.90 + Math.random() * 0.09 : 0.70 + Math.random() * 0.15;

  return {
    estimate,
    confidence: parseFloat(confidence.toFixed(2)),
    match: Math.abs(estimate - actualPortions) <= 2,
  };
}

function generateComplianceChecks(qualityScore: number, portionMatch: boolean, hasVegetables: boolean) {
  const qualityAcceptable = qualityScore >= 60;
  const meetsBGN = qualityScore >= 70 && hasVegetables && portionMatch;

  return {
    menu_match: Math.random() > 0.10, // 90% menu matches
    portion_match: portionMatch,
    quality_acceptable: qualityAcceptable,
    meets_bgn_standards: meetsBGN,
  };
}

function generateIssuesAndWarnings(
  qualityScore: number,
  compliance: any,
  hasVegetables: boolean
): { issues: string[]; warnings: string[]; recommendations: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (qualityScore < 60) {
    issues.push('Overall quality below acceptable threshold');
    recommendations.push('Review food preparation and presentation standards');
  }

  if (!compliance.portion_match) {
    issues.push('Portion size mismatch detected');
    recommendations.push('Verify portion counting accuracy');
  }

  if (!hasVegetables) {
    warnings.push('Vegetable component not detected');
    recommendations.push('Ensure vegetable component is included in meal');
  }

  if (!compliance.menu_match) {
    issues.push('Detected items do not match planned menu');
    recommendations.push('Investigate menu substitution');
  }

  if (qualityScore < 70 && qualityScore >= 60) {
    warnings.push('Quality score approaching minimum threshold');
    recommendations.push('Monitor this vendor for quality consistency');
  }

  // Random additional issues for realism
  if (Math.random() < 0.08) {
    const randomIssue = ISSUE_TYPES[Math.floor(Math.random() * ISSUE_TYPES.length)];
    warnings.push(randomIssue);
  }

  return { issues, warnings, recommendations };
}

function generateReasoning(qualityScore: number, compliance: any, items: string[]): string {
  const reasons: string[] = [];

  reasons.push(`Detected ${items.length} food items in the image.`);

  if (qualityScore >= 85) {
    reasons.push('Food presentation is excellent with good color and arrangement.');
  } else if (qualityScore >= 70) {
    reasons.push('Food quality meets standards with minor presentation issues.');
  } else if (qualityScore >= 60) {
    reasons.push('Food quality is acceptable but below optimal standards.');
  } else {
    reasons.push('Significant quality concerns detected requiring review.');
  }

  if (compliance.meets_bgn_standards) {
    reasons.push('All BGN (Belanja Gizi Nasional) nutritional standards are met.');
  } else {
    reasons.push('Some BGN standards need attention.');
  }

  return reasons.join(' ');
}

function shouldNeedManualReview(qualityScore: number, compliance: any): boolean {
  if (qualityScore < 60) return true;
  if (!compliance.quality_acceptable) return true;
  if (!compliance.menu_match) return Math.random() > 0.3;
  return Math.random() < 0.05; // 5% random review
}

function getManualReviewStatus(needsReview: boolean): string {
  if (!needsReview) return 'approved';

  const rand = Math.random();
  if (rand > 0.80) return 'approved';
  if (rand > 0.60) return 'rejected';
  return 'pending';
}

// ============================================
// PROGRESS BAR
// ============================================

function showProgress(current: number, total: number, message: string) {
  const percentage = (current / total) * 100;
  const barLength = 30;
  const filledLength = Math.floor((barLength * current) / total);
  const bar = '█'.repeat(filledLength) + ' '.repeat(barLength - filledLength);
  process.stdout.write(`\r[${bar}] ${percentage.toFixed(1)}% - ${message} (${current}/${total})`);
  if (current === total) process.stdout.write('\n');
}

// ============================================
// TIME TRACKING
// ============================================

const startTime = Date.now();
function getElapsedTime() {
  return ((Date.now() - startTime) / 1000).toFixed(2);
}

function log(message: string) {
  console.log(`[${getElapsedTime()}s] ${message}`);
}

// ============================================
// MAIN SEEDING FUNCTION
// ============================================

async function seedAIFoodAnalyses() {
  log('================================================================================');
  log('SEEDING SCRIPT 16: AI FOOD ANALYSES');
  log('================================================================================');

  try {
    log('Initializing Supabase client...');
    const { data: testData, error: testError } = await supabase.from('ai_food_analyses').select('count').limit(1);
    if (testError) throw new Error(`Supabase connection failed: ${testError.message}`);
    log('✅ Supabase client initialized');

    // ============================================
    // STEP 1: FETCH DELIVERIES & VERIFICATIONS
    // ============================================

    log('\n================================================================================');
    log('STEP 1: FETCHING DELIVERIES & VERIFICATIONS');
    log('================================================================================');

    const { data: deliveries, error: deliveriesError } = await supabase
      .from('deliveries')
      .select('id, portions, status')
      .in('status', ['delivered', 'verified']);

    if (deliveriesError) throw deliveriesError;
    log(`✅ Found ${deliveries?.length || 0} deliveries`);

    const { data: verifications, error: verificationsError } = await supabase
      .from('verifications')
      .select('id, delivery_id, portions_received, quality_rating')
      .eq('status', 'approved');

    if (verificationsError) throw verificationsError;
    log(`✅ Found ${verifications?.length || 0} verifications`);

    // Create verification map
    const verificationMap = new Map(verifications?.map(v => [v.delivery_id, v]) || []);

    // ============================================
    // STEP 2: FETCH USERS FOR REVIEWERS
    // ============================================

    log('\n================================================================================');
    log('STEP 2: FETCHING ADMIN USERS FOR REVIEWERS');
    log('================================================================================');

    const { data: admins, error: adminsError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (adminsError) throw adminsError;
    log(`✅ Found ${admins?.length || 0} admin users`);

    // ============================================
    // STEP 3: GENERATE AI ANALYSES
    // ============================================

    log('\n================================================================================');
    log('STEP 3: GENERATING AI FOOD ANALYSES');
    log('================================================================================');

    const analysesToGenerate = Math.floor((deliveries?.length || 0) * CONFIG.ANALYSIS_RATE);
    log(`Generating ${analysesToGenerate} AI analyses (${(CONFIG.ANALYSIS_RATE * 100).toFixed(0)}% of deliveries)...`);

    const aiAnalyses: any[] = [];

    // Shuffle deliveries for random sampling
    const shuffledDeliveries = [...(deliveries || [])].sort(() => Math.random() - 0.5);
    const selectedDeliveries = shuffledDeliveries.slice(0, analysesToGenerate);

    for (const delivery of selectedDeliveries) {
      const verification = verificationMap.get(delivery.id);
      const portions = delivery.portions;

      // Generate detected items
      const detectedItems = generateDetectedItems(portions);

      // Generate portion estimate
      const portionData = generatePortionEstimate(portions);

      // Generate quality scores
      const qualityTier = selectQualityTier();
      const qualityScore = generateQualityScore(qualityTier);
      const freshnessScore = qualityScore + Math.floor(Math.random() * 11) - 5;
      const presentationScore = qualityScore + Math.floor(Math.random() * 11) - 5;
      const hygieneScore = qualityScore + Math.floor(Math.random() * 11) - 5;

      // Estimate nutrition
      const nutrition = estimateNutrition(detectedItems, portions);

      // Generate compliance checks
      const compliance = generateComplianceChecks(
        qualityScore,
        portionData.match,
        nutrition.has_vegetables
      );

      // Generate issues, warnings, recommendations
      const { issues, warnings, recommendations } = generateIssuesAndWarnings(
        qualityScore,
        compliance,
        nutrition.has_vegetables
      );

      // Generate reasoning
      const reasoning = generateReasoning(qualityScore, compliance, detectedItems);

      // Overall confidence
      const confidence = portionData.confidence * (qualityScore / 100);

      // Manual review
      const needsManualReview = shouldNeedManualReview(qualityScore, compliance);
      const manualReviewStatus = getManualReviewStatus(needsManualReview);
      const reviewedBy = manualReviewStatus !== 'pending' && admins && admins.length > 0
        ? admins[Math.floor(Math.random() * admins.length)].id
        : null;

      // Timestamps
      const analyzedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
      const reviewedAt = reviewedBy
        ? new Date(new Date(analyzedAt).getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString()
        : null;

      aiAnalyses.push({
        verification_id: verification?.id || null,
        delivery_id: delivery.id,
        detected_items: detectedItems,
        portion_estimate: portionData.estimate,
        portion_confidence: portionData.confidence,
        quality_score: qualityScore,
        freshness_score: Math.max(20, Math.min(100, freshnessScore)),
        presentation_score: Math.max(20, Math.min(100, presentationScore)),
        hygiene_score: Math.max(20, Math.min(100, hygieneScore)),
        ...nutrition,
        ...compliance,
        confidence: parseFloat(confidence.toFixed(2)),
        reasoning,
        issues: issues.length > 0 ? issues : null,
        warnings: warnings.length > 0 ? warnings : null,
        recommendations: recommendations.length > 0 ? recommendations : null,
        needs_manual_review: needsManualReview,
        manual_review_status: manualReviewStatus,
        reviewed_by: reviewedBy,
        reviewed_at: reviewedAt,
        analyzed_at: analyzedAt,
      });
    }

    log(`✅ Generated ${aiAnalyses.length} AI food analyses`);

    // ============================================
    // STEP 4: INSERT TO DATABASE
    // ============================================

    log('\n================================================================================');
    log('STEP 4: INSERTING AI ANALYSES TO DATABASE');
    log('================================================================================');

    const totalBatches = Math.ceil(aiAnalyses.length / CONFIG.BATCH_SIZE);
    log(`Inserting ${aiAnalyses.length} records in ${totalBatches} batches...`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < aiAnalyses.length; i += CONFIG.BATCH_SIZE) {
      const batch = aiAnalyses.slice(i, i + CONFIG.BATCH_SIZE);
      showProgress(i + batch.length, aiAnalyses.length, 'Inserting AI analyses');

      const { error } = await supabase.from('ai_food_analyses').insert(batch);

      if (error) {
        console.error(`\n❌ Error in batch:`, error.message);
        failCount += batch.length;
      } else {
        successCount += batch.length;
      }
    }

    // ============================================
    // GENERATE STATISTICS
    // ============================================

    log('\n================================================================================');
    log('SEEDING SUMMARY');
    log('================================================================================\n');

    const avgQuality = aiAnalyses.reduce((sum, a) => sum + a.quality_score, 0) / aiAnalyses.length;
    const avgConfidence = aiAnalyses.reduce((sum, a) => sum + a.confidence, 0) / aiAnalyses.length;

    const qualityDistribution = aiAnalyses.reduce((acc: any, a) => {
      if (a.quality_score >= 85) acc.excellent++;
      else if (a.quality_score >= 70) acc.good++;
      else if (a.quality_score >= 60) acc.acceptable++;
      else acc.poor++;
      return acc;
    }, { excellent: 0, good: 0, acceptable: 0, poor: 0 });

    const reviewStatusDistribution = aiAnalyses.reduce((acc: any, a) => {
      acc[a.manual_review_status] = (acc[a.manual_review_status] || 0) + 1;
      return acc;
    }, {});

    const complianceStats = {
      meets_bgn: aiAnalyses.filter(a => a.meets_bgn_standards).length,
      has_vegetables: aiAnalyses.filter(a => a.has_vegetables).length,
      portion_match: aiAnalyses.filter(a => a.portion_match).length,
      menu_match: aiAnalyses.filter(a => a.menu_match).length,
    };

    const needsReviewCount = aiAnalyses.filter(a => a.needs_manual_review).length;

    const stats = {
      summary: {
        total_analyses: aiAnalyses.length,
        total_deliveries: deliveries?.length || 0,
        analysis_rate: ((aiAnalyses.length / (deliveries?.length || 1)) * 100).toFixed(1),
        success_count: successCount,
        fail_count: failCount,
        success_rate: ((successCount / aiAnalyses.length) * 100).toFixed(1),
      },
      quality: {
        avg_quality_score: avgQuality.toFixed(1),
        avg_confidence: avgConfidence.toFixed(2),
        distribution: qualityDistribution,
      },
      compliance: {
        meets_bgn_standards: `${complianceStats.meets_bgn} (${((complianceStats.meets_bgn / aiAnalyses.length) * 100).toFixed(1)}%)`,
        has_vegetables: `${complianceStats.has_vegetables} (${((complianceStats.has_vegetables / aiAnalyses.length) * 100).toFixed(1)}%)`,
        portion_match: `${complianceStats.portion_match} (${((complianceStats.portion_match / aiAnalyses.length) * 100).toFixed(1)}%)`,
        menu_match: `${complianceStats.menu_match} (${((complianceStats.menu_match / aiAnalyses.length) * 100).toFixed(1)}%)`,
      },
      review: {
        needs_manual_review: `${needsReviewCount} (${((needsReviewCount / aiAnalyses.length) * 100).toFixed(1)}%)`,
        status_distribution: reviewStatusDistribution,
      },
    };

    console.log('📊 AI FOOD ANALYSES:');
    console.log(`   Total Analyses: ${stats.summary.total_analyses}`);
    console.log(`   Analysis Coverage: ${stats.summary.analysis_rate}% of deliveries`);
    console.log(`   ✅ Success: ${stats.summary.success_count}`);
    console.log(`   ❌ Failed: ${stats.summary.fail_count}`);
    console.log(`   Success Rate: ${stats.summary.success_rate}%\n`);

    console.log('📊 QUALITY METRICS:');
    console.log(`   Avg Quality Score: ${stats.quality.avg_quality_score}/100`);
    console.log(`   Avg AI Confidence: ${stats.quality.avg_confidence}`);
    console.log(`   Quality Distribution:`);
    console.log(`     - Excellent (85-100): ${stats.quality.distribution.excellent}`);
    console.log(`     - Good (70-84): ${stats.quality.distribution.good}`);
    console.log(`     - Acceptable (60-69): ${stats.quality.distribution.acceptable}`);
    console.log(`     - Poor (<60): ${stats.quality.distribution.poor}\n`);

    console.log('📊 COMPLIANCE CHECKS:');
    console.log(`   Meets BGN Standards: ${stats.compliance.meets_bgn_standards}`);
    console.log(`   Has Vegetables: ${stats.compliance.has_vegetables}`);
    console.log(`   Portion Match: ${stats.compliance.portion_match}`);
    console.log(`   Menu Match: ${stats.compliance.menu_match}\n`);

    console.log('📊 MANUAL REVIEW:');
    console.log(`   Needs Review: ${stats.review.needs_manual_review}`);
    console.log(`   Review Status:`);
    Object.entries(stats.review.status_distribution).forEach(([status, count]) => {
      const pct = ((count as number / aiAnalyses.length) * 100).toFixed(1);
      console.log(`     - ${status}: ${count} (${pct}%)`);
    });

    // Save statistics
    const statsFilePath = path.join(__dirname, '../seeding-logs/16-ai-food-analyses-stats.json');
    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2));

    log('\n================================================================================');
    log('✅ SEEDING COMPLETED!');
    log('================================================================================');
    log(`\nStats saved to: ${statsFilePath}`);
    log('✅ Script execution completed');

  } catch (error: any) {
    console.error('\n❌ SEEDING FAILED:', error.message);
    process.exit(1);
  }
}

// ============================================
// RUN SEEDING
// ============================================

seedAIFoodAnalyses();
