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
  TARGET_ANOMALIES: 45, // Target number of anomaly alerts
  BATCH_SIZE: 25,
};

// Anomaly types with their characteristics
const ANOMALY_TYPES = {
  collusion: {
    severity: ['medium', 'high', 'critical'],
    weights: [0.3, 0.5, 0.2],
    title: 'Potential Collusion Detected',
    patterns: [
      'Same verification time patterns across multiple schools',
      'Unusually high approval rate from specific schools',
      'Identical quality ratings from different schools',
      'Coordinated verification timestamps',
    ],
    recommendation: ['investigate', 'monitor'],
    confidence: [0.65, 0.85],
  },
  fake_verification: {
    severity: ['high', 'critical'],
    weights: [0.6, 0.4],
    title: 'Suspicious Verification Activity',
    patterns: [
      'Verification without photo evidence',
      'Verification timestamp inconsistent with delivery time',
      'IP address mismatch for verification',
      'Verification faster than physically possible',
      'GPS location mismatch',
    ],
    recommendation: ['investigate', 'block'],
    confidence: [0.70, 0.90],
  },
  late_delivery_pattern: {
    severity: ['low', 'medium', 'high'],
    weights: [0.2, 0.6, 0.2],
    title: 'Recurring Late Delivery Pattern',
    patterns: [
      'Consistent late deliveries over 2+ weeks',
      'Same catering showing pattern of delays',
      'Late delivery rate exceeds 30%',
      'Multiple complaints from different schools',
    ],
    recommendation: ['monitor', 'alert_admin'],
    confidence: [0.75, 0.95],
  },
  quality_degradation: {
    severity: ['medium', 'high'],
    weights: [0.7, 0.3],
    title: 'Food Quality Deterioration',
    patterns: [
      'Quality scores declining over time',
      'Multiple quality complaints in short period',
      'Hygiene score below threshold',
      'Consistent low ratings from AI analysis',
    ],
    recommendation: ['monitor', 'investigate'],
    confidence: [0.70, 0.88],
  },
  portion_manipulation: {
    severity: ['medium', 'high', 'critical'],
    weights: [0.3, 0.5, 0.2],
    title: 'Portion Count Discrepancy',
    patterns: [
      'AI detected portions differ from reported',
      'Consistent under-portioning across deliveries',
      'School reports fewer portions than delivered',
      'Pattern of portion mismatches',
    ],
    recommendation: ['investigate', 'alert_admin'],
    confidence: [0.60, 0.85],
  },
  suspicious_payment: {
    severity: ['high', 'critical'],
    weights: [0.5, 0.5],
    title: 'Unusual Payment Pattern',
    patterns: [
      'Payment released without proper verification',
      'Blockchain transaction timing suspicious',
      'Multiple rapid payments to same vendor',
      'Payment amount mismatch',
    ],
    recommendation: ['investigate', 'block'],
    confidence: [0.75, 0.92],
  },
  data_tampering: {
    severity: ['critical'],
    weights: [1.0],
    title: 'Possible Data Manipulation',
    patterns: [
      'Records modified after verification',
      'Audit trail inconsistencies',
      'Timestamp manipulation detected',
      'Unauthorized data access patterns',
    ],
    recommendation: ['investigate', 'block'],
    confidence: [0.80, 0.95],
  },
  geographic_anomaly: {
    severity: ['low', 'medium'],
    weights: [0.6, 0.4],
    title: 'Geographic Distribution Anomaly',
    patterns: [
      'Delivery locations exceed vendor radius',
      'Impossible delivery route detected',
      'GPS coordinates suspicious',
      'Multiple deliveries in short timeframe',
    ],
    recommendation: ['monitor', 'investigate'],
    confidence: [0.65, 0.82],
  },
};

const STATUS_DISTRIBUTION = {
  new: 0.30,
  investigating: 0.35,
  resolved: 0.25,
  dismissed: 0.10,
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

function selectStatus(): string {
  const statuses = Object.entries(STATUS_DISTRIBUTION).map(([status, weight]) => ({
    value: status,
    weight,
  }));
  return weightedRandom(statuses);
}

function generateAnomalyData(
  type: string,
  config: any,
  schools: any[],
  caterings: any[]
) {
  // Select severity
  const severity = weightedRandom(
    config.severity.map((sev: string, idx: number) => ({
      value: sev,
      weight: config.weights[idx],
    }))
  );

  // Select patterns (2-4 patterns per anomaly)
  const numPatterns = 2 + Math.floor(Math.random() * 3);
  const shuffledPatterns = [...config.patterns].sort(() => Math.random() - 0.5);
  const selectedPatterns = shuffledPatterns.slice(0, Math.min(numPatterns, config.patterns.length));

  // Generate description
  const description = `AI-detected anomaly: ${selectedPatterns.join('. ')}. Requires ${severity} priority investigation.`;

  // Select involved parties based on anomaly type
  let schoolId = null;
  let cateringId = null;

  if (['collusion', 'fake_verification', 'quality_degradation', 'portion_manipulation'].includes(type)) {
    // These involve both school and catering
    schoolId = schools[Math.floor(Math.random() * schools.length)]?.id;
    cateringId = caterings[Math.floor(Math.random() * caterings.length)]?.id;
  } else if (['late_delivery_pattern', 'suspicious_payment', 'geographic_anomaly'].includes(type)) {
    // These primarily involve catering
    cateringId = caterings[Math.floor(Math.random() * caterings.length)]?.id;
    if (Math.random() > 0.5) {
      schoolId = schools[Math.floor(Math.random() * schools.length)]?.id;
    }
  } else {
    // data_tampering could involve either
    if (Math.random() > 0.5) {
      schoolId = schools[Math.floor(Math.random() * schools.length)]?.id;
    } else {
      cateringId = caterings[Math.floor(Math.random() * caterings.length)]?.id;
    }
  }

  // Confidence score
  const [minConf, maxConf] = config.confidence;
  const confidence = parseFloat((minConf + Math.random() * (maxConf - minConf)).toFixed(2));

  // Recommendation
  const recommendation = config.recommendation[Math.floor(Math.random() * config.recommendation.length)];

  // Data points (flexible supporting data)
  const dataPoints = generateDataPoints(type, schoolId, cateringId);

  // Status and investigation
  const status = selectStatus();
  const investigatedBy = status !== 'new' ? Math.floor(Math.random() * 5) + 1 : null;

  // Timestamps
  const detectedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
  const investigatedAt = investigatedBy
    ? new Date(new Date(detectedAt).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Resolution notes
  const resolutionNotes = ['resolved', 'dismissed'].includes(status)
    ? generateResolutionNotes(type, status)
    : null;

  return {
    type,
    severity,
    title: config.title,
    description,
    suspicious_patterns: selectedPatterns,
    school_id: schoolId,
    catering_id: cateringId,
    confidence_score: confidence,
    recommendation,
    data_points: dataPoints,
    status,
    investigated_by: investigatedBy,
    investigated_at: investigatedAt,
    resolution_notes: resolutionNotes,
    detected_at: detectedAt,
  };
}

function generateDataPoints(type: string, schoolId: any, cateringId: any): any {
  const baseData: any = {
    detection_method: 'ml_model',
    model_version: '2.1.0',
    data_sources: ['delivery_records', 'verification_logs', 'payment_events'],
  };

  switch (type) {
    case 'collusion':
      return {
        ...baseData,
        affected_schools: Math.floor(Math.random() * 5) + 2,
        suspicious_correlation: (0.70 + Math.random() * 0.25).toFixed(2),
        time_window_days: Math.floor(Math.random() * 30) + 7,
      };

    case 'fake_verification':
      return {
        ...baseData,
        verification_speed_percentile: Math.floor(Math.random() * 5) + 1,
        missing_evidence_rate: (Math.random() * 0.40 + 0.20).toFixed(2),
        anomaly_score: (0.65 + Math.random() * 0.30).toFixed(2),
      };

    case 'late_delivery_pattern':
      return {
        ...baseData,
        late_delivery_count: Math.floor(Math.random() * 15) + 5,
        avg_delay_minutes: Math.floor(Math.random() * 120) + 30,
        affected_deliveries_rate: (0.30 + Math.random() * 0.50).toFixed(2),
      };

    case 'quality_degradation':
      return {
        ...baseData,
        quality_trend_slope: -(Math.random() * 2 + 0.5).toFixed(2),
        current_avg_quality: Math.floor(Math.random() * 20) + 50,
        complaints_count: Math.floor(Math.random() * 10) + 3,
      };

    case 'portion_manipulation':
      return {
        ...baseData,
        avg_discrepancy_portions: Math.floor(Math.random() * 5) + 2,
        affected_deliveries: Math.floor(Math.random() * 15) + 5,
        discrepancy_rate: (0.15 + Math.random() * 0.35).toFixed(2),
      };

    case 'suspicious_payment':
      return {
        ...baseData,
        payment_count: Math.floor(Math.random() * 8) + 3,
        total_amount: Math.floor(Math.random() * 50000000) + 10000000,
        time_window_hours: Math.floor(Math.random() * 48) + 12,
      };

    case 'data_tampering':
      return {
        ...baseData,
        modified_records: Math.floor(Math.random() * 20) + 5,
        unauthorized_access_attempts: Math.floor(Math.random() * 10) + 1,
        integrity_score: (0.30 + Math.random() * 0.40).toFixed(2),
      };

    case 'geographic_anomaly':
      return {
        ...baseData,
        max_distance_km: Math.floor(Math.random() * 100) + 50,
        impossible_routes: Math.floor(Math.random() * 5) + 1,
        avg_speed_kmh: Math.floor(Math.random() * 50) + 80,
      };

    default:
      return baseData;
  }
}

function generateResolutionNotes(type: string, status: string): string {
  if (status === 'dismissed') {
    const dismissReasons = [
      'False positive - pattern explained by legitimate business operations.',
      'Data anomaly caused by system migration, not actual fraud.',
      'Pattern within acceptable variance for this vendor.',
      'Initial detection was overly sensitive, adjusted thresholds.',
    ];
    return dismissReasons[Math.floor(Math.random() * dismissReasons.length)];
  }

  if (status === 'resolved') {
    const resolveNotes = [
      'Vendor acknowledged issue and implemented corrective measures.',
      'School and catering agreed on improved communication protocol.',
      'Technical issue identified and fixed in verification system.',
      'Training provided to staff, improvements observed.',
      'Process changes implemented, monitoring for compliance.',
    ];
    return resolveNotes[Math.floor(Math.random() * resolveNotes.length)];
  }

  return '';
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

async function seedAnomalyAlerts() {
  log('================================================================================');
  log('SEEDING SCRIPT 17: ANOMALY ALERTS');
  log('================================================================================');

  try {
    log('Initializing Supabase client...');
    const { data: testData, error: testError } = await supabase.from('anomaly_alerts').select('count').limit(1);
    if (testError) throw new Error(`Supabase connection failed: ${testError.message}`);
    log('✅ Supabase client initialized');

    // ============================================
    // STEP 1: FETCH SCHOOLS & CATERINGS
    // ============================================

    log('\n================================================================================');
    log('STEP 1: FETCHING SCHOOLS & CATERINGS');
    log('================================================================================');

    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id');

    if (schoolsError) throw schoolsError;
    log(`✅ Found ${schools?.length || 0} schools`);

    const { data: caterings, error: cateringsError } = await supabase
      .from('caterings')
      .select('id');

    if (cateringsError) throw cateringsError;
    log(`✅ Found ${caterings?.length || 0} caterings`);

    // ============================================
    // STEP 2: GENERATE ANOMALY ALERTS
    // ============================================

    log('\n================================================================================');
    log('STEP 2: GENERATING ANOMALY ALERTS');
    log('================================================================================');

    log(`Generating ${CONFIG.TARGET_ANOMALIES} anomaly alerts...`);

    const anomalyAlerts: any[] = [];

    // Distribute anomalies across types
    const typeEntries = Object.entries(ANOMALY_TYPES);
    const anomaliesPerType = Math.floor(CONFIG.TARGET_ANOMALIES / typeEntries.length);
    const remainder = CONFIG.TARGET_ANOMALIES % typeEntries.length;

    for (let i = 0; i < typeEntries.length; i++) {
      const [type, config] = typeEntries[i];
      const count = anomaliesPerType + (i < remainder ? 1 : 0);

      for (let j = 0; j < count; j++) {
        const anomaly = generateAnomalyData(type, config, schools || [], caterings || []);
        anomalyAlerts.push(anomaly);
      }
    }

    // Shuffle for randomness
    anomalyAlerts.sort(() => Math.random() - 0.5);

    log(`✅ Generated ${anomalyAlerts.length} anomaly alerts`);

    // ============================================
    // STEP 3: INSERT TO DATABASE
    // ============================================

    log('\n================================================================================');
    log('STEP 3: INSERTING ANOMALY ALERTS TO DATABASE');
    log('================================================================================');

    const totalBatches = Math.ceil(anomalyAlerts.length / CONFIG.BATCH_SIZE);
    log(`Inserting ${anomalyAlerts.length} records in ${totalBatches} batches...`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < anomalyAlerts.length; i += CONFIG.BATCH_SIZE) {
      const batch = anomalyAlerts.slice(i, i + CONFIG.BATCH_SIZE);
      showProgress(i + batch.length, anomalyAlerts.length, 'Inserting anomaly alerts');

      const { error } = await supabase.from('anomaly_alerts').insert(batch);

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

    const byType = anomalyAlerts.reduce((acc: any, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {});

    const bySeverity = anomalyAlerts.reduce((acc: any, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {});

    const byStatus = anomalyAlerts.reduce((acc: any, alert) => {
      acc[alert.status] = (acc[alert.status] || 0) + 1;
      return acc;
    }, {});

    const byRecommendation = anomalyAlerts.reduce((acc: any, alert) => {
      acc[alert.recommendation] = (acc[alert.recommendation] || 0) + 1;
      return acc;
    }, {});

    const avgConfidence = anomalyAlerts.reduce((sum, a) => sum + a.confidence_score, 0) / anomalyAlerts.length;

    const criticalAlerts = anomalyAlerts.filter(a => a.severity === 'critical').length;
    const unresolvedAlerts = anomalyAlerts.filter(a => ['new', 'investigating'].includes(a.status)).length;

    const stats = {
      summary: {
        total_alerts: anomalyAlerts.length,
        success_count: successCount,
        fail_count: failCount,
        success_rate: ((successCount / anomalyAlerts.length) * 100).toFixed(1),
        avg_confidence: avgConfidence.toFixed(2),
        critical_alerts: criticalAlerts,
        unresolved_alerts: unresolvedAlerts,
      },
      by_type: byType,
      by_severity: bySeverity,
      by_status: byStatus,
      by_recommendation: byRecommendation,
    };

    console.log('📊 ANOMALY ALERTS:');
    console.log(`   Total Alerts: ${stats.summary.total_alerts}`);
    console.log(`   ✅ Success: ${stats.summary.success_count}`);
    console.log(`   ❌ Failed: ${stats.summary.fail_count}`);
    console.log(`   Success Rate: ${stats.summary.success_rate}%`);
    console.log(`   Avg Confidence: ${stats.summary.avg_confidence}`);
    console.log(`   🚨 Critical Alerts: ${stats.summary.critical_alerts}`);
    console.log(`   ⏳ Unresolved: ${stats.summary.unresolved_alerts}\n`);

    console.log('📊 BY ANOMALY TYPE:');
    Object.entries(stats.by_type).forEach(([type, count]) => {
      const pct = ((count as number / anomalyAlerts.length) * 100).toFixed(1);
      console.log(`   ${type.padEnd(25)}: ${String(count).padStart(3)} (${pct}%)`);
    });

    console.log('\n📊 BY SEVERITY:');
    Object.entries(stats.by_severity).forEach(([severity, count]) => {
      const pct = ((count as number / anomalyAlerts.length) * 100).toFixed(1);
      console.log(`   ${severity.padEnd(15)}: ${String(count).padStart(3)} (${pct}%)`);
    });

    console.log('\n📊 BY STATUS:');
    Object.entries(stats.by_status).forEach(([status, count]) => {
      const pct = ((count as number / anomalyAlerts.length) * 100).toFixed(1);
      console.log(`   ${status.padEnd(15)}: ${String(count).padStart(3)} (${pct}%)`);
    });

    console.log('\n📊 BY RECOMMENDATION:');
    Object.entries(stats.by_recommendation).forEach(([rec, count]) => {
      const pct = ((count as number / anomalyAlerts.length) * 100).toFixed(1);
      console.log(`   ${rec.padEnd(15)}: ${String(count).padStart(3)} (${pct}%)`);
    });

    // Save statistics
    const statsFilePath = path.join(__dirname, '../seeding-logs/17-anomaly-alerts-stats.json');
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

seedAnomalyAlerts();
