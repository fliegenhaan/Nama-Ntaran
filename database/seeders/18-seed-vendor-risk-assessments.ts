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
  ASSESSMENTS_PER_CATERING: 1, // Latest assessment for each catering
  ASSESSMENT_PERIOD_DAYS: 90, // 90-day assessment window
  BATCH_SIZE: 50,
};

// Risk level distributions (realistic)
const RISK_LEVEL_DISTRIBUTION = {
  low: 0.60,      // 60% low risk
  medium: 0.30,   // 30% medium risk
  high: 0.08,     // 8% high risk
  critical: 0.02, // 2% critical risk
};

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

function selectRiskLevel(): string {
  const levels = Object.entries(RISK_LEVEL_DISTRIBUTION).map(([level, weight]) => ({
    value: level,
    weight,
  }));
  return weightedRandom(levels);
}

function calculateRiskScore(riskLevel: string): number {
  // Risk score 0-100 (higher = worse)
  switch (riskLevel) {
    case 'low':
      return Math.floor(Math.random() * 30) + 0; // 0-29
    case 'medium':
      return Math.floor(Math.random() * 25) + 30; // 30-54
    case 'high':
      return Math.floor(Math.random() * 25) + 55; // 55-79
    case 'critical':
      return Math.floor(Math.random() * 21) + 80; // 80-100
    default:
      return 15;
  }
}

function generatePerformanceMetrics(riskLevel: string, totalDeliveries: number) {
  let baseLateness: number, baseQuality: number, baseCompliance: number, baseAvgQuality: number;

  // Set base values based on risk level
  switch (riskLevel) {
    case 'low':
      baseLateness = 0.02; // 2% late
      baseQuality = 0.01; // 1% quality issues
      baseCompliance = 0.98; // 98% compliant
      baseAvgQuality = 85;
      break;
    case 'medium':
      baseLateness = 0.12; // 12% late
      baseQuality = 0.08; // 8% quality issues
      baseCompliance = 0.85; // 85% compliant
      baseAvgQuality = 72;
      break;
    case 'high':
      baseLateness = 0.28; // 28% late
      baseQuality = 0.18; // 18% quality issues
      baseCompliance = 0.68; // 68% compliant
      baseAvgQuality = 58;
      break;
    case 'critical':
      baseLateness = 0.45; // 45% late
      baseQuality = 0.35; // 35% quality issues
      baseCompliance = 0.45; // 45% compliant
      baseAvgQuality = 42;
      break;
    default:
      baseLateness = 0.05;
      baseQuality = 0.03;
      baseCompliance = 0.95;
      baseAvgQuality = 80;
  }

  // Add small random variance
  const variance = () => (Math.random() - 0.5) * 0.05;

  const lateDeliveryRate = Math.max(0, Math.min(1, baseLateness + variance()));
  const qualityIssueRate = Math.max(0, Math.min(1, baseQuality + variance()));
  const complianceRate = Math.max(0, Math.min(1, baseCompliance + variance()));
  const avgQualityScore = Math.max(20, Math.min(100, baseAvgQuality + (Math.random() - 0.5) * 10));

  // Calculate actual counts
  const successfulDeliveries = Math.floor(totalDeliveries * (1 - lateDeliveryRate - qualityIssueRate));
  const issuesReported = Math.floor(totalDeliveries * qualityIssueRate);

  return {
    late_delivery_rate: parseFloat(lateDeliveryRate.toFixed(4)),
    quality_issue_rate: parseFloat(qualityIssueRate.toFixed(4)),
    compliance_rate: parseFloat(complianceRate.toFixed(4)),
    avg_quality_score: parseFloat(avgQualityScore.toFixed(2)),
    total_deliveries: totalDeliveries,
    successful_deliveries: successfulDeliveries,
    issues_reported: issuesReported,
  };
}

function calculateDefaultProbability(riskLevel: string, metrics: any): number {
  let baseProbability: number;

  switch (riskLevel) {
    case 'low':
      baseProbability = 0.02; // 2% chance
      break;
    case 'medium':
      baseProbability = 0.12; // 12% chance
      break;
    case 'high':
      baseProbability = 0.35; // 35% chance
      break;
    case 'critical':
      baseProbability = 0.65; // 65% chance
      break;
    default:
      baseProbability = 0.05;
  }

  // Adjust based on metrics
  if (metrics.late_delivery_rate > 0.30) baseProbability += 0.10;
  if (metrics.quality_issue_rate > 0.25) baseProbability += 0.10;
  if (metrics.compliance_rate < 0.70) baseProbability += 0.08;
  if (metrics.avg_quality_score < 60) baseProbability += 0.12;

  return parseFloat(Math.max(0, Math.min(1, baseProbability)).toFixed(2));
}

function generateRecommendedAction(riskLevel: string, likelyToDefault: number): string {
  if (riskLevel === 'critical' || likelyToDefault > 0.60) {
    const actions = [
      'Immediate suspension recommended. Conduct thorough investigation.',
      'Block future assignments. Review all pending payments.',
      'Escalate to compliance team. Consider contract termination.',
      'Require immediate corrective action plan with 7-day deadline.',
    ];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  if (riskLevel === 'high' || likelyToDefault > 0.30) {
    const actions = [
      'Increase monitoring frequency. Require weekly quality reports.',
      'Schedule performance review meeting. Implement improvement plan.',
      'Reduce delivery allocation by 50% until performance improves.',
      'Mandatory quality training. Weekly check-ins required.',
    ];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  if (riskLevel === 'medium') {
    const actions = [
      'Continue monitoring. Monthly performance reviews recommended.',
      'Provide support and resources to improve compliance rates.',
      'Set clear improvement targets. Review progress in 30 days.',
      'Maintain current assignment level with enhanced oversight.',
    ];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  // low risk
  const actions = [
    'Continue standard monitoring. No immediate action needed.',
    'Maintain performance excellence. Consider for preferred vendor status.',
    'Regular quarterly reviews sufficient.',
    'Eligible for increased assignment allocation.',
  ];
  return actions[Math.floor(Math.random() * actions.length)];
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

async function seedVendorRiskAssessments() {
  log('================================================================================');
  log('SEEDING SCRIPT 18: VENDOR RISK ASSESSMENTS');
  log('================================================================================');

  try {
    log('Initializing Supabase client...');
    const { data: testData, error: testError } = await supabase.from('vendor_risk_assessments').select('count').limit(1);
    if (testError) throw new Error(`Supabase connection failed: ${testError.message}`);
    log('✅ Supabase client initialized');

    // ============================================
    // STEP 1: FETCH CATERINGS
    // ============================================

    log('\n================================================================================');
    log('STEP 1: FETCHING CATERINGS');
    log('================================================================================');

    const { data: caterings, error: cateringsError } = await supabase
      .from('caterings')
      .select('id, total_deliveries');

    if (cateringsError) throw cateringsError;
    log(`✅ Found ${caterings?.length || 0} caterings`);

    // ============================================
    // STEP 2: GENERATE RISK ASSESSMENTS
    // ============================================

    log('\n================================================================================');
    log('STEP 2: GENERATING VENDOR RISK ASSESSMENTS');
    log('================================================================================');

    log(`Generating risk assessments for ${caterings?.length || 0} caterings...`);

    const riskAssessments: any[] = [];

    for (const catering of caterings || []) {
      // Select risk level
      const riskLevel = selectRiskLevel();

      // Calculate risk score
      const riskScore = calculateRiskScore(riskLevel);

      // Use actual delivery count from catering, or generate if zero
      const totalDeliveries = catering.total_deliveries || Math.floor(Math.random() * 50) + 10;

      // Generate performance metrics
      const performanceMetrics = generatePerformanceMetrics(riskLevel, totalDeliveries);

      // Calculate default probability
      const likelyToDefault = calculateDefaultProbability(riskLevel, performanceMetrics);

      // Generate recommended action
      const recommendedAction = generateRecommendedAction(riskLevel, likelyToDefault);

      // Assessment period
      const assessmentEnd = new Date();
      const assessmentStart = new Date(assessmentEnd.getTime() - CONFIG.ASSESSMENT_PERIOD_DAYS * 24 * 60 * 60 * 1000);

      // Assessment timestamp
      const assessedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();

      riskAssessments.push({
        catering_id: catering.id,
        risk_score: riskScore,
        risk_level: riskLevel,
        ...performanceMetrics,
        likely_to_default: likelyToDefault,
        recommended_action: recommendedAction,
        assessment_period_start: assessmentStart.toISOString().split('T')[0],
        assessment_period_end: assessmentEnd.toISOString().split('T')[0],
        assessed_at: assessedAt,
      });
    }

    log(`✅ Generated ${riskAssessments.length} risk assessments`);

    // ============================================
    // STEP 3: INSERT TO DATABASE
    // ============================================

    log('\n================================================================================');
    log('STEP 3: INSERTING RISK ASSESSMENTS TO DATABASE');
    log('================================================================================');

    const totalBatches = Math.ceil(riskAssessments.length / CONFIG.BATCH_SIZE);
    log(`Inserting ${riskAssessments.length} records in ${totalBatches} batches...`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < riskAssessments.length; i += CONFIG.BATCH_SIZE) {
      const batch = riskAssessments.slice(i, i + CONFIG.BATCH_SIZE);
      showProgress(i + batch.length, riskAssessments.length, 'Inserting risk assessments');

      const { error } = await supabase.from('vendor_risk_assessments').insert(batch);

      if (error) {
        console.error(`\n❌ Error in batch:`, error.message);
        failCount += batch.length;
      } else {
        successCount += batch.length;
      }
    }

    // ============================================
    // STEP 4: UPDATE CATERINGS TABLE
    // ============================================

    log('\n================================================================================');
    log('STEP 4: UPDATING CATERINGS WITH RISK LEVELS');
    log('================================================================================');

    // The migration adds latest_risk_assessment_id and risk_level columns
    // We should update caterings with their risk levels
    let cateringsUpdated = 0;

    for (const assessment of riskAssessments) {
      const { error } = await supabase
        .from('caterings')
        .update({ risk_level: assessment.risk_level })
        .eq('id', assessment.catering_id);

      if (!error) cateringsUpdated++;
    }

    log(`✅ Updated ${cateringsUpdated} caterings with risk levels`);

    // ============================================
    // GENERATE STATISTICS
    // ============================================

    log('\n================================================================================');
    log('SEEDING SUMMARY');
    log('================================================================================\n');

    const byRiskLevel = riskAssessments.reduce((acc: any, assessment) => {
      acc[assessment.risk_level] = (acc[assessment.risk_level] || 0) + 1;
      return acc;
    }, {});

    const avgRiskScore = riskAssessments.reduce((sum, a) => sum + a.risk_score, 0) / riskAssessments.length;
    const avgLateDeliveryRate = riskAssessments.reduce((sum, a) => sum + a.late_delivery_rate, 0) / riskAssessments.length;
    const avgQualityIssueRate = riskAssessments.reduce((sum, a) => sum + a.quality_issue_rate, 0) / riskAssessments.length;
    const avgComplianceRate = riskAssessments.reduce((sum, a) => sum + a.compliance_rate, 0) / riskAssessments.length;
    const avgQualityScore = riskAssessments.reduce((sum, a) => sum + a.avg_quality_score, 0) / riskAssessments.length;
    const avgDefaultProb = riskAssessments.reduce((sum, a) => sum + a.likely_to_default, 0) / riskAssessments.length;

    const totalDeliveriesAssessed = riskAssessments.reduce((sum, a) => sum + a.total_deliveries, 0);
    const totalSuccessful = riskAssessments.reduce((sum, a) => sum + a.successful_deliveries, 0);
    const totalIssues = riskAssessments.reduce((sum, a) => sum + a.issues_reported, 0);

    const highRiskVendors = riskAssessments
      .filter(a => ['high', 'critical'].includes(a.risk_level))
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 5);

    const stats = {
      summary: {
        total_assessments: riskAssessments.length,
        total_caterings: caterings?.length || 0,
        success_count: successCount,
        fail_count: failCount,
        success_rate: ((successCount / riskAssessments.length) * 100).toFixed(1),
        caterings_updated: cateringsUpdated,
      },
      risk_distribution: byRiskLevel,
      averages: {
        risk_score: avgRiskScore.toFixed(1),
        late_delivery_rate: (avgLateDeliveryRate * 100).toFixed(2) + '%',
        quality_issue_rate: (avgQualityIssueRate * 100).toFixed(2) + '%',
        compliance_rate: (avgComplianceRate * 100).toFixed(2) + '%',
        quality_score: avgQualityScore.toFixed(1),
        default_probability: (avgDefaultProb * 100).toFixed(1) + '%',
      },
      aggregates: {
        total_deliveries_assessed: totalDeliveriesAssessed,
        total_successful_deliveries: totalSuccessful,
        total_issues_reported: totalIssues,
        success_rate: ((totalSuccessful / totalDeliveriesAssessed) * 100).toFixed(1) + '%',
      },
      high_risk_count: highRiskVendors.length,
    };

    console.log('📊 VENDOR RISK ASSESSMENTS:');
    console.log(`   Total Assessments: ${stats.summary.total_assessments}`);
    console.log(`   Total Caterings: ${stats.summary.total_caterings}`);
    console.log(`   ✅ Success: ${stats.summary.success_count}`);
    console.log(`   ❌ Failed: ${stats.summary.fail_count}`);
    console.log(`   Success Rate: ${stats.summary.success_rate}%`);
    console.log(`   Caterings Updated: ${stats.summary.caterings_updated}\n`);

    console.log('📊 RISK DISTRIBUTION:');
    Object.entries(stats.risk_distribution).forEach(([level, count]) => {
      const pct = ((count as number / riskAssessments.length) * 100).toFixed(1);
      console.log(`   ${level.padEnd(12)}: ${String(count).padStart(3)} (${pct}%)`);
    });

    console.log('\n📊 AVERAGE METRICS:');
    console.log(`   Risk Score: ${stats.averages.risk_score}/100`);
    console.log(`   Late Delivery Rate: ${stats.averages.late_delivery_rate}`);
    console.log(`   Quality Issue Rate: ${stats.averages.quality_issue_rate}`);
    console.log(`   Compliance Rate: ${stats.averages.compliance_rate}`);
    console.log(`   Quality Score: ${stats.averages.quality_score}/100`);
    console.log(`   Default Probability: ${stats.averages.default_probability}\n`);

    console.log('📊 AGGREGATE PERFORMANCE:');
    console.log(`   Total Deliveries Assessed: ${stats.aggregates.total_deliveries_assessed}`);
    console.log(`   Successful Deliveries: ${stats.aggregates.total_successful_deliveries}`);
    console.log(`   Issues Reported: ${stats.aggregates.total_issues_reported}`);
    console.log(`   Overall Success Rate: ${stats.aggregates.success_rate}\n`);

    console.log('⚠️  HIGH RISK VENDORS:');
    console.log(`   Count: ${stats.high_risk_count} vendors require immediate attention`);

    // Save statistics
    const statsFilePath = path.join(__dirname, '../seeding-logs/18-vendor-risk-assessments-stats.json');
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

seedVendorRiskAssessments();
