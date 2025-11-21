/**
 * ============================================================================
 * SEEDING SCRIPT 29: SYSTEM CONFIGURATION
 * ============================================================================
 *
 * Purpose: Seed system configuration settings for admin panel
 * Dependencies:
 *   - @supabase/supabase-js
 *   - dotenv
 *
 * Run: npm run seed:system-config
 * Estimated records: 20-30 configuration entries
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SystemConfigInsert {
  key: string
  value: any
  description: string
  category: string
  is_public: boolean
  updated_by: number | null
}

interface SeedingStats {
  totalConfigs: number
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
}

// System configuration data
const SYSTEM_CONFIGS: SystemConfigInsert[] = [
  // AI Configuration
  {
    key: 'ai.scoring.weights',
    value: {
      poverty: 0.4,
      stunting: 0.3,
      dapodik: 0.3,
    },
    description: 'Weights for AI priority scoring algorithm',
    category: 'ai',
    is_public: false,
    updated_by: null,
  },
  {
    key: 'ai.cohere.model',
    value: {
      model_name: 'command-r-plus',
      temperature: 0.7,
      max_tokens: 1000,
    },
    description: 'Cohere AI model configuration',
    category: 'ai',
    is_public: false,
    updated_by: null,
  },
  {
    key: 'ai.claude.model',
    value: {
      model_name: 'claude-3-5-sonnet-20241022',
      temperature: 0.5,
      max_tokens: 2000,
    },
    description: 'Claude AI model configuration',
    category: 'ai',
    is_public: false,
    updated_by: null,
  },
  {
    key: 'ai.food_analysis.enabled',
    value: { enabled: true, confidence_threshold: 0.75 },
    description: 'Enable AI food image analysis',
    category: 'ai',
    is_public: false,
    updated_by: null,
  },

  // Blockchain Configuration
  {
    key: 'blockchain.network',
    value: {
      chain_id: 11155111, // Sepolia testnet
      name: 'Sepolia',
      rpc_url: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
      explorer_url: 'https://sepolia.etherscan.io',
    },
    description: 'Blockchain network settings',
    category: 'blockchain',
    is_public: true,
    updated_by: null,
  },
  {
    key: 'blockchain.contracts',
    value: {
      escrow_contract: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      payment_contract: '0x9876543210abcdef9876543210abcdef98765432',
    },
    description: 'Smart contract addresses',
    category: 'blockchain',
    is_public: true,
    updated_by: null,
  },
  {
    key: 'blockchain.gas_settings',
    value: {
      max_priority_fee: '2.0',
      max_fee: '50.0',
      gas_limit: 300000,
    },
    description: 'Gas price settings for transactions',
    category: 'blockchain',
    is_public: false,
    updated_by: null,
  },

  // Payment Configuration
  {
    key: 'payment.escrow.thresholds',
    value: {
      min_amount: 100000, // Rp 100,000
      max_amount: 100000000, // Rp 100,000,000
      auto_release_days: 7,
    },
    description: 'Escrow payment thresholds and timing',
    category: 'payment',
    is_public: false,
    updated_by: null,
  },
  {
    key: 'payment.xendit.enabled',
    value: {
      enabled: false,
      webhook_url: 'https://api.nutrichain.id/webhooks/xendit',
    },
    description: 'Xendit payment gateway integration',
    category: 'payment',
    is_public: false,
    updated_by: null,
  },
  {
    key: 'payment.price_per_portion',
    value: {
      default: 15000, // Rp 15,000
      premium: 25000, // Rp 25,000
      budget: 10000, // Rp 10,000
    },
    description: 'Default price per portion configurations',
    category: 'payment',
    is_public: true,
    updated_by: null,
  },

  // Notification Configuration
  {
    key: 'notification.email.enabled',
    value: {
      enabled: true,
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      from_email: 'noreply@nutrichain.id',
      from_name: 'NutriChain - MBG',
    },
    description: 'Email notification settings',
    category: 'notification',
    is_public: false,
    updated_by: null,
  },
  {
    key: 'notification.delivery_reminder',
    value: {
      enabled: true,
      hours_before: 2,
      notification_types: ['email', 'in_app'],
    },
    description: 'Delivery reminder notification settings',
    category: 'notification',
    is_public: false,
    updated_by: null,
  },
  {
    key: 'notification.payment_alerts',
    value: {
      enabled: true,
      notify_on: ['locked', 'released', 'failed'],
      notification_types: ['email', 'in_app'],
    },
    description: 'Payment alert notification settings',
    category: 'notification',
    is_public: false,
    updated_by: null,
  },

  // General Application Settings
  {
    key: 'app.maintenance_mode',
    value: {
      enabled: false,
      message: 'Sistem sedang dalam pemeliharaan. Mohon coba beberapa saat lagi.',
      allowed_ips: ['127.0.0.1'],
    },
    description: 'Application maintenance mode',
    category: 'general',
    is_public: true,
    updated_by: null,
  },
  {
    key: 'app.feature_flags',
    value: {
      ai_food_analysis: true,
      blockchain_payments: true,
      public_feedback: true,
      menu_planning: false,
      delivery_routes: false,
    },
    description: 'Feature flag toggles',
    category: 'general',
    is_public: false,
    updated_by: null,
  },
  {
    key: 'app.timezone',
    value: {
      timezone: 'Asia/Jakarta',
      locale: 'id-ID',
      currency: 'IDR',
    },
    description: 'Application timezone and locale settings',
    category: 'general',
    is_public: true,
    updated_by: null,
  },
  {
    key: 'app.pagination',
    value: {
      default_page_size: 20,
      max_page_size: 100,
      allow_infinite_scroll: true,
    },
    description: 'Pagination settings for lists',
    category: 'general',
    is_public: true,
    updated_by: null,
  },

  // Security Settings
  {
    key: 'security.session.timeout',
    value: {
      idle_timeout_minutes: 30,
      absolute_timeout_hours: 8,
      remember_me_days: 30,
    },
    description: 'User session timeout settings',
    category: 'security',
    is_public: false,
    updated_by: null,
  },
  {
    key: 'security.password.policy',
    value: {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_special: true,
      expiry_days: 90,
    },
    description: 'Password policy requirements',
    category: 'security',
    is_public: false,
    updated_by: null,
  },
  {
    key: 'security.rate_limiting',
    value: {
      enabled: true,
      requests_per_minute: 60,
      requests_per_hour: 1000,
    },
    description: 'API rate limiting configuration',
    category: 'security',
    is_public: false,
    updated_by: null,
  },

  // Reporting Settings
  {
    key: 'reporting.transparency.enabled',
    value: {
      enabled: true,
      update_frequency_hours: 24,
      public_access: true,
    },
    description: 'Transparency reporting settings',
    category: 'reporting',
    is_public: true,
    updated_by: null,
  },
  {
    key: 'reporting.analytics.retention',
    value: {
      raw_data_days: 90,
      aggregated_data_years: 5,
      audit_logs_years: 7,
    },
    description: 'Data retention policy for analytics',
    category: 'reporting',
    is_public: false,
    updated_by: null,
  },
  {
    key: 'reporting.export.formats',
    value: {
      allowed_formats: ['csv', 'excel', 'pdf'],
      max_export_rows: 10000,
      include_charts: true,
    },
    description: 'Report export format settings',
    category: 'reporting',
    is_public: false,
    updated_by: null,
  },

  // Delivery Settings
  {
    key: 'delivery.verification.window',
    value: {
      hours_before_delivery: 2,
      hours_after_delivery: 24,
      require_photo: true,
      require_signature: false,
    },
    description: 'Delivery verification time window',
    category: 'delivery',
    is_public: false,
    updated_by: null,
  },
  {
    key: 'delivery.schedule.constraints',
    value: {
      earliest_time: '06:00',
      latest_time: '10:00',
      allowed_days: [1, 2, 3, 4, 5], // Monday-Friday
      exclude_holidays: true,
    },
    description: 'Delivery scheduling constraints',
    category: 'delivery',
    is_public: true,
    updated_by: null,
  },
]

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
    console.error(`❌ ERROR: ${message}`)
    if (error) console.error(error)
  }

  success(message: string) {
    console.log(`✅ ${message}`)
  }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedSystemConfig() {
  const logger = new Logger()
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

  const stats: SeedingStats = {
    totalConfigs: SYSTEM_CONFIGS.length,
    successCount: 0,
    failedCount: 0,
    byCategory: {},
    errors: [],
  }

  logger.log('================================================================================')
  logger.log('SEEDING SCRIPT 29: SYSTEM CONFIGURATION')
  logger.log('================================================================================')

  try {
    logger.log(`\nTotal configurations to seed: ${SYSTEM_CONFIGS.length}`)

    // Check existing configs
    const { data: existingConfigs } = await supabase
      .from('system_config')
      .select('key')

    const existingKeys = new Set(existingConfigs?.map((c: any) => c.key) || [])

    const configsToInsert = SYSTEM_CONFIGS.filter(c => !existingKeys.has(c.key))

    if (configsToInsert.length === 0) {
      logger.success('All system configurations already exist!')
      logger.log('\nSeeding completed - nothing to add.')
      return
    }

    logger.log(`\nInserting ${configsToInsert.length} new configurations...`)

    // Insert each config individually to handle errors better
    for (const config of configsToInsert) {
      try {
        const { error } = await supabase
          .from('system_config')
          .insert(config)

        if (error) {
          logger.error(`Failed to insert ${config.key}: ${error.message}`)
          stats.failedCount++
          stats.errors.push({ error: `${config.key}: ${error.message}` })
        } else {
          stats.successCount++
          stats.byCategory[config.category] = (stats.byCategory[config.category] || 0) + 1
          logger.log(`  ✓ ${config.key}`)
        }
      } catch (error: any) {
        logger.error(`Exception inserting ${config.key}:`, error)
        stats.failedCount++
        stats.errors.push({ error: `${config.key}: ${error.message || 'Unknown error'}` })
      }
    }

    // Summary
    logger.log('\n================================================================================')
    logger.log('SEEDING SUMMARY')
    logger.log('================================================================================')
    logger.log(`Total configurations: ${stats.totalConfigs}`)
    logger.log(`Successfully inserted: ${stats.successCount}`)
    logger.log(`Failed: ${stats.failedCount}`)

    if (stats.successCount > 0) {
      logger.log('\nConfigurations by Category:')
      Object.entries(stats.byCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          logger.log(`  ${category}: ${count}`)
        })
    }

    if (stats.errors.length > 0) {
      logger.log('\n⚠️  Errors:')
      stats.errors.forEach((err, idx) => {
        logger.log(`  ${idx + 1}. ${err.error}`)
      })
    }

    const statsFilePath = path.join(__dirname, '../seeding-logs/29-system-config-stats.json')
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

seedSystemConfig()
