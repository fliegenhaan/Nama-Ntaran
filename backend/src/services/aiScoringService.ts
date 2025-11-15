import pool from '../config/database';
import axios from 'axios';

/**
 * AI Scoring Service untuk menentukan prioritas sekolah
 *
 * Formula Scoring:
 * Priority Score = (Poverty Index * 0.4) + (Stunting Rate * 0.4) + (Geographic Access * 0.2)
 *
 * Score Range: 0-100 (semakin tinggi = semakin prioritas)
 */

interface School {
  id: number;
  npsn: string;
  name: string;
  province: string;
  city: string;
  district: string;
  kecamatan_url?: string;
}

interface PovertyData {
  provinsi: string;
  percentage: number;
}

interface StuntingData {
  provinsi: string;
  rate: number;
}

/**
 * Get poverty data from BPS API
 */
async function getPovertyDataByProvince(province: string): Promise<number> {
  try {
    // BPS API untuk data kemiskinan
    // Untuk MVP, kita gunakan data simulasi
    // Dalam produksi, call ke BPS API yang sebenarnya

    const povertySimulation: { [key: string]: number } = {
      'Jawa Barat': 7.88,
      'DKI Jakarta': 4.69,
      'Jawa Timur': 10.85,
      'Jawa Tengah': 11.35,
      'Sumatera Utara': 8.75,
      'Sulawesi Selatan': 8.54,
      'Banten': 5.42,
      'Nusa Tenggara Timur': 19.96,
      'Papua': 26.55,
      'Maluku': 15.47,
      // Default untuk provinsi lainnya
      'default': 10.0
    };

    return povertySimulation[province] || povertySimulation['default'];
  } catch (error) {
    console.error('Error fetching poverty data:', error);
    return 10.0; // Default moderate poverty rate
  }
}

/**
 * Get stunting data from SatuSehat API / Simulation
 */
async function getStuntingDataByProvince(province: string): Promise<number> {
  try {
    // SatuSehat API untuk data stunting
    // Untuk MVP, kita gunakan data simulasi

    const stuntingSimulation: { [key: string]: number } = {
      'Jawa Barat': 20.2,
      'DKI Jakarta': 15.6,
      'Jawa Timur': 19.2,
      'Jawa Tengah': 20.8,
      'Sumatera Utara': 21.1,
      'Sulawesi Selatan': 22.3,
      'Banten': 17.8,
      'Nusa Tenggara Timur': 35.3,
      'Papua': 31.8,
      'Maluku': 27.5,
      'default': 21.6 // National average
    };

    return stuntingSimulation[province] || stuntingSimulation['default'];
  } catch (error) {
    console.error('Error fetching stunting data:', error);
    return 21.6; // National average
  }
}

/**
 * Calculate geographic access score based on location
 * Higher score = more remote/harder access
 */
function calculateGeographicScore(school: School): number {
  let score = 0;

  // Faktor 1: Provinsi terpencil
  const remoterProvinces = [
    'Papua', 'Papua Barat', 'Maluku', 'Maluku Utara',
    'Nusa Tenggara Timur', 'Nusa Tenggara Barat',
    'Kalimantan Utara', 'Sulawesi Barat'
  ];

  if (remoterProvinces.some(p => school.province.includes(p))) {
    score += 40;
  }

  // Faktor 2: Kota vs Kabupaten
  // Kabupaten biasanya lebih sulit akses
  if (school.city.toLowerCase().includes('kabupaten')) {
    score += 30;
  }

  // Faktor 3: Kata kunci desa/terpencil di nama kecamatan
  const remoteKeywords = ['pegunungan', 'kepulauan', 'pedalaman', 'terpencil'];
  if (school.district && remoteKeywords.some(k => school.district.toLowerCase().includes(k))) {
    score += 30;
  }

  // Normalize to 0-100
  return Math.min(score, 100);
}

/**
 * Normalize value to 0-100 scale
 */
function normalize(value: number, min: number, max: number): number {
  return ((value - min) / (max - min)) * 100;
}

/**
 * Calculate priority score for a single school
 */
async function calculateSchoolPriority(school: School): Promise<number> {
  try {
    // Get external data
    const povertyRate = await getPovertyDataByProvince(school.province);
    const stuntingRate = await getStuntingDataByProvince(school.province);
    const geographicScore = calculateGeographicScore(school);

    // Normalize scores
    // Poverty: 0-30% → 0-100
    const normalizedPoverty = normalize(povertyRate, 0, 30);

    // Stunting: 0-40% → 0-100
    const normalizedStunting = normalize(stuntingRate, 0, 40);

    // Geographic already 0-100

    // Weighted average
    // Poverty: 40%, Stunting: 40%, Geographic: 20%
    const priorityScore =
      (normalizedPoverty * 0.4) +
      (normalizedStunting * 0.4) +
      (geographicScore * 0.2);

    return Math.round(priorityScore * 100) / 100; // Round to 2 decimals
  } catch (error) {
    console.error(`Error calculating priority for school ${school.npsn}:`, error);
    return 0;
  }
}

/**
 * Calculate and update priority scores for all schools
 */
export async function calculateAllSchoolPriorities(): Promise<{
  success: boolean;
  updated: number;
  error?: string;
}> {
  try {
    console.log('🤖 Starting AI priority scoring for all schools...');

    // Get all schools from database
    const result = await pool.query(
      'SELECT id, npsn, name, province, city, district FROM schools'
    );

    const schools: School[] = result.rows;
    console.log(`  Found ${schools.length} schools to process`);

    let updated = 0;

    // Process in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < schools.length; i += batchSize) {
      const batch = schools.slice(i, i + batchSize);

      await Promise.all(batch.map(async (school) => {
        const priorityScore = await calculateSchoolPriority(school);

        await pool.query(
          'UPDATE schools SET priority_score = $1, updated_at = NOW() WHERE id = $2',
          [priorityScore, school.id]
        );

        updated++;

        if (updated % 100 === 0) {
          console.log(`  Processed ${updated}/${schools.length} schools...`);
        }
      }));
    }

    console.log(`✅ Priority scoring complete! Updated ${updated} schools`);

    return {
      success: true,
      updated
    };
  } catch (error: any) {
    console.error('❌ Error in AI scoring:', error.message);
    return {
      success: false,
      updated: 0,
      error: error.message
    };
  }
}

/**
 * Get top priority schools (for admin dashboard)
 */
export async function getTopPrioritySchools(limit: number = 100): Promise<School[]> {
  try {
    const result = await pool.query(
      `SELECT id, npsn, name, province, city, district, priority_score
       FROM schools
       WHERE priority_score > 0
       ORDER BY priority_score DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting top priority schools:', error);
    return [];
  }
}

/**
 * Get priority schools by province
 */
export async function getPrioritySchoolsByProvince(province: string, limit: number = 50): Promise<School[]> {
  try {
    const result = await pool.query(
      `SELECT id, npsn, name, province, city, district, priority_score
       FROM schools
       WHERE province = $1 AND priority_score > 0
       ORDER BY priority_score DESC
       LIMIT $2`,
      [province, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting priority schools by province:', error);
    return [];
  }
}

/**
 * Get priority statistics
 */
export async function getPriorityStatistics(): Promise<{
  totalSchools: number;
  scoredSchools: number;
  averageScore: number;
  highPriority: number; // score > 70
  mediumPriority: number; // score 40-70
  lowPriority: number; // score < 40
}> {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_schools,
        COUNT(CASE WHEN priority_score > 0 THEN 1 END) as scored_schools,
        AVG(priority_score) as average_score,
        COUNT(CASE WHEN priority_score > 70 THEN 1 END) as high_priority,
        COUNT(CASE WHEN priority_score BETWEEN 40 AND 70 THEN 1 END) as medium_priority,
        COUNT(CASE WHEN priority_score > 0 AND priority_score < 40 THEN 1 END) as low_priority
      FROM schools
    `);

    const row = result.rows[0];

    return {
      totalSchools: parseInt(row.total_schools),
      scoredSchools: parseInt(row.scored_schools),
      averageScore: parseFloat(row.average_score) || 0,
      highPriority: parseInt(row.high_priority),
      mediumPriority: parseInt(row.medium_priority),
      lowPriority: parseInt(row.low_priority)
    };
  } catch (error) {
    console.error('Error getting priority statistics:', error);
    return {
      totalSchools: 0,
      scoredSchools: 0,
      averageScore: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0
    };
  }
}

/**
 * Get heatmap data for map visualization
 */
export async function getHeatmapData(): Promise<Array<{
  province: string;
  avgScore: number;
  schoolCount: number;
  highPriorityCount: number;
}>> {
  try {
    const result = await pool.query(`
      SELECT
        province,
        AVG(priority_score) as avg_score,
        COUNT(*) as school_count,
        COUNT(CASE WHEN priority_score > 70 THEN 1 END) as high_priority_count
      FROM schools
      WHERE priority_score > 0
      GROUP BY province
      ORDER BY avg_score DESC
    `);

    return result.rows.map(row => ({
      province: row.province,
      avgScore: parseFloat(row.avg_score),
      schoolCount: parseInt(row.school_count),
      highPriorityCount: parseInt(row.high_priority_count)
    }));
  } catch (error) {
    console.error('Error getting heatmap data:', error);
    return [];
  }
}

export default {
  calculateAllSchoolPriorities,
  getTopPrioritySchools,
  getPrioritySchoolsByProvince,
  getPriorityStatistics,
  getHeatmapData
};
