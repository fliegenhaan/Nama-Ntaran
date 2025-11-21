/**
 * ============================================================================
 * SEEDING SCRIPT 38: SCHOOL STUDENT COUNTS
 * ============================================================================
 *
 * Purpose: Generate historical student enrollment data per school
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *   - Requires: schools
 *
 * Run: npm run seed:school-student-counts
 * Estimated records: 100-300 student count records
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface School {
  id: number
  name: string
  total_students: number
}

interface SchoolStudentCountInsert {
  school_id: number
  academic_year: string
  semester: number
  total_students: number
  male_students: number
  female_students: number
  eligible_students: number
  special_needs_students: number
  grade_breakdown: any
  data_source: string
  verified_by: number | null
  verified_at: string | null
}

interface SeedingStats {
  totalSchools: number
  totalCounts: number
  successCount: number
  failedCount: number
  byAcademicYear: Record<string, number>
  errors: Array<{ error: string }>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  BATCH_SIZE: 100,

  // Generate for current and previous academic years
  ACADEMIC_YEARS: [
    '2024/2025',
    '2023/2024',
    '2022/2023',
  ],

  SEMESTERS: [1, 2],

  DATA_SOURCES: ['dapodik', 'manual', 'survey'],
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

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function generateGradeBreakdown(totalStudents: number): any {
  const grades = ['grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5', 'grade_6']
  const breakdown: any = {}

  let remaining = totalStudents

  for (let i = 0; i < grades.length - 1; i++) {
    const avgPerGrade = remaining / (grades.length - i)
    const variance = avgPerGrade * 0.2
    const count = Math.min(
      remaining,
      Math.max(0, Math.floor(avgPerGrade + (Math.random() - 0.5) * 2 * variance))
    )

    breakdown[grades[i]] = count
    remaining -= count
  }

  // Last grade gets remaining students
  breakdown[grades[grades.length - 1]] = remaining

  return breakdown
}

function generateStudentCount(
  school: School,
  academicYear: string,
  semester: number,
  verifierId: number | null
): SchoolStudentCountInsert {
  // Base on school's total_students with some variance
  const baseCount = school.total_students || randomInt(100, 500)
  const variance = Math.floor(baseCount * randomFloat(-0.10, 0.10))
  const totalStudents = Math.max(50, baseCount + variance)

  // Gender distribution (roughly 50/50 with some variance)
  const malePercentage = randomFloat(0.45, 0.55)
  const maleStudents = Math.floor(totalStudents * malePercentage)
  const femaleStudents = totalStudents - maleStudents

  // Eligible students (85-95% of total)
  const eligibleStudents = Math.floor(totalStudents * randomFloat(0.85, 0.95))

  // Special needs students (1-5% of total)
  const specialNeedsStudents = Math.floor(totalStudents * randomFloat(0.01, 0.05))

  const gradeBreakdown = generateGradeBreakdown(totalStudents)

  const dataSource = randomElement(CONFIG.DATA_SOURCES)
  const isVerified = dataSource === 'dapodik' || Math.random() < 0.80

  return {
    school_id: school.id,
    academic_year: academicYear,
    semester: semester,
    total_students: totalStudents,
    male_students: maleStudents,
    female_students: femaleStudents,
    eligible_students: eligibleStudents,
    special_needs_students: specialNeedsStudents,
    grade_breakdown: gradeBreakdown,
    data_source: dataSource,
    verified_by: isVerified ? verifierId : null,
    verified_at: isVerified ? new Date().toISOString() : null,
  }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedSchoolStudentCounts() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalSchools: 0,
    totalCounts: 0,
    successCount: 0,
    failedCount: 0,
    byAcademicYear: {},
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 38: SCHOOL STUDENT COUNTS')
  logger.log('================================================================================')

  try {
    // STEP 1: FETCH SCHOOLS
    logger.log('\nSTEP 1: Fetching schools...')

    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name, total_students')

    if (schoolsError) {
      throw new Error(`Failed to fetch schools: ${schoolsError.message}`)
    }

    if (!schools || schools.length === 0) {
      logger.error('No schools found.')
      return
    }

    stats.totalSchools = schools.length
    logger.success(`Found ${schools.length} schools`)

    // STEP 2: GET VERIFIER
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'ADMIN')
      .limit(1)

    const verifierId = admins && admins.length > 0 ? admins[0].id : null

    // STEP 3: GENERATE STUDENT COUNTS
    logger.log('\nSTEP 2: Generating student counts...')

    const countsToInsert: SchoolStudentCountInsert[] = []

    for (const school of schools) {
      for (const academicYear of CONFIG.ACADEMIC_YEARS) {
        for (const semester of CONFIG.SEMESTERS) {
          // Skip future semesters
          if (academicYear === '2024/2025' && semester === 2) {
            const currentMonth = new Date().getMonth() + 1
            if (currentMonth < 7) continue // Semester 2 starts in July
          }

          const count = generateStudentCount(school as School, academicYear, semester, verifierId)
          countsToInsert.push(count)
          stats.byAcademicYear[academicYear] = (stats.byAcademicYear[academicYear] || 0) + 1
        }
      }
    }

    stats.totalCounts = countsToInsert.length
    logger.success(`Generated ${countsToInsert.length} student count records`)

    // STEP 4: INSERT STUDENT COUNTS
    logger.log('\nSTEP 3: Inserting student counts to database...')
    logger.log(`Batch size: ${CONFIG.BATCH_SIZE}`)

    for (let i = 0; i < countsToInsert.length; i += CONFIG.BATCH_SIZE) {
      const batch = countsToInsert.slice(i, i + CONFIG.BATCH_SIZE)

      try {
        const { error } = await supabase
          .from('school_student_counts')
          .insert(batch)

        if (error) {
          logger.error(`Batch failed: ${error.message}`)
          stats.failedCount += batch.length
          stats.errors.push({ error: error.message })
        } else {
          stats.successCount += batch.length
          logger.progress(
            Math.min(i + CONFIG.BATCH_SIZE, countsToInsert.length),
            countsToInsert.length,
            'Progress'
          )
        }
      } catch (error: any) {
        logger.error(`Batch exception:`, error)
        stats.failedCount += batch.length
        stats.errors.push({ error: error.message || 'Unknown error' })
      }
    }

    // STEP 5: SUMMARY
    logger.log('\n================================================================================')
    logger.log('SEEDING SUMMARY')
    logger.log('================================================================================')
    logger.log(`Total schools: ${stats.totalSchools}`)
    logger.log(`Total student counts generated: ${stats.totalCounts}`)
    logger.log(`Successfully inserted: ${stats.successCount}`)
    logger.log(`Failed: ${stats.failedCount}`)

    if (stats.successCount > 0) {
      logger.log('\nStudent Counts by Academic Year:')
      Object.entries(stats.byAcademicYear).forEach(([year, count]) => {
        logger.log(`  ${year}: ${count}`)
      })
    }

    const statsFilePath = path.join(__dirname, '../seeding-logs/38-school-student-counts-stats.json')
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

seedSchoolStudentCounts()
