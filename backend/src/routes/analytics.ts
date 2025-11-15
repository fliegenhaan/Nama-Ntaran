import express from 'express';
import type { Response } from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/analytics/dashboard - Get dashboard statistics
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    let stats = {};

    if (role === 'admin') {
      // Admin dashboard stats
      const [
        budgetStats,
        schoolStats,
        cateringStats,
        deliveryStats,
        verificationStats,
        issueStats
      ] = await Promise.all([
        // Budget statistics
        pool.query(`
          SELECT
            COALESCE(SUM(amount), 0) as total_allocated,
            COALESCE(SUM(amount) FILTER (WHERE status = 'verified'), 0) as total_disbursed,
            COALESCE(SUM(amount) FILTER (WHERE status IN ('scheduled', 'delivered')), 0) as locked_escrow
          FROM deliveries
        `),
        // School statistics
        pool.query(`
          SELECT
            COUNT(*) as total_schools,
            COUNT(*) FILTER (WHERE user_id IS NOT NULL) as registered_schools
          FROM schools
        `),
        // Catering statistics
        pool.query(`
          SELECT
            COUNT(*) as total_caterings,
            ROUND(AVG(rating), 2) as avg_rating
          FROM caterings
        `),
        // Delivery statistics
        pool.query(`
          SELECT
            COUNT(*) as total_deliveries,
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
            COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
            COUNT(*) FILTER (WHERE status = 'verified') as verified,
            COUNT(*) FILTER (WHERE delivery_date >= CURRENT_DATE) as upcoming
          FROM deliveries
        `),
        // Verification statistics
        pool.query(`
          SELECT
            COUNT(*) as total_verifications,
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE verified_at >= CURRENT_DATE) as today,
            ROUND(AVG(quality_rating), 2) as avg_quality_rating
          FROM verifications
        `),
        // Issue statistics
        pool.query(`
          SELECT
            COUNT(*) as total_issues,
            COUNT(*) FILTER (WHERE status = 'open') as open_issues,
            COUNT(*) FILTER (WHERE severity IN ('high', 'critical')) as critical_issues
          FROM issues
        `)
      ]);

      stats = {
        budget: budgetStats.rows[0],
        schools: schoolStats.rows[0],
        caterings: cateringStats.rows[0],
        deliveries: deliveryStats.rows[0],
        verifications: verificationStats.rows[0],
        issues: issueStats.rows[0]
      };

    } else if (role === 'school') {
      // School dashboard stats
      const schoolResult = await pool.query(
        'SELECT id FROM schools WHERE user_id = $1',
        [req.user?.id]
      );

      if (schoolResult.rows.length === 0) {
        return res.status(404).json({ error: 'School not found for this user' });
      }

      const school_id = schoolResult.rows[0].id;

      const [deliveryStats, verificationStats, issueStats] = await Promise.all([
        pool.query(`
          SELECT
            COUNT(*) as total_deliveries,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_verifications,
            COUNT(*) FILTER (WHERE status = 'verified') as verified,
            COUNT(*) FILTER (WHERE delivery_date >= CURRENT_DATE) as upcoming,
            COALESCE(SUM(portions), 0) as total_portions
          FROM deliveries
          WHERE school_id = $1
        `, [school_id]),
        pool.query(`
          SELECT
            COUNT(*) as total_verifications,
            COUNT(*) FILTER (WHERE verified_at >= CURRENT_DATE) as verified_today,
            COUNT(*) FILTER (WHERE verified_at >= DATE_TRUNC('month', CURRENT_DATE)) as verified_this_month,
            ROUND(AVG(quality_rating), 2) as avg_quality_rating
          FROM verifications
          WHERE school_id = $1
        `, [school_id]),
        pool.query(`
          SELECT
            COUNT(*) as total_issues,
            COUNT(*) FILTER (WHERE status IN ('open', 'investigating')) as active_issues
          FROM issues i
          JOIN deliveries d ON i.delivery_id = d.id
          WHERE d.school_id = $1
        `, [school_id])
      ]);

      stats = {
        deliveries: deliveryStats.rows[0],
        verifications: verificationStats.rows[0],
        issues: issueStats.rows[0]
      };

    } else if (role === 'catering') {
      // Catering dashboard stats
      const cateringResult = await pool.query(
        'SELECT id FROM caterings WHERE user_id = $1',
        [req.user?.id]
      );

      if (cateringResult.rows.length === 0) {
        return res.status(404).json({ error: 'Catering not found for this user' });
      }

      const catering_id = cateringResult.rows[0].id;

      const [deliveryStats, paymentStats, verificationStats, issueStats] = await Promise.all([
        pool.query(`
          SELECT
            COUNT(*) as total_deliveries,
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
            COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
            COUNT(*) FILTER (WHERE status = 'verified') as verified,
            COUNT(*) FILTER (WHERE delivery_date >= CURRENT_DATE) as today_deliveries
          FROM deliveries
          WHERE catering_id = $1
        `, [catering_id]),
        pool.query(`
          SELECT
            COALESCE(SUM(amount), 0) as total_revenue,
            COALESCE(SUM(amount) FILTER (WHERE status = 'verified'), 0) as disbursed,
            COALESCE(SUM(amount) FILTER (WHERE status IN ('scheduled', 'delivered')), 0) as locked_escrow,
            COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_payment
          FROM deliveries
          WHERE catering_id = $1
        `, [catering_id]),
        pool.query(`
          SELECT
            COUNT(*) as total_verifications,
            ROUND(AVG(quality_rating), 2) as avg_quality_rating,
            COUNT(*) FILTER (WHERE quality_rating >= 4) as high_ratings
          FROM verifications v
          JOIN deliveries d ON v.delivery_id = d.id
          WHERE d.catering_id = $1
        `, [catering_id]),
        pool.query(`
          SELECT
            COUNT(*) as total_issues,
            COUNT(*) FILTER (WHERE status IN ('open', 'investigating')) as active_issues,
            COUNT(*) FILTER (WHERE severity IN ('high', 'critical')) as critical_issues
          FROM issues i
          JOIN deliveries d ON i.delivery_id = d.id
          WHERE d.catering_id = $1
        `, [catering_id])
      ]);

      stats = {
        deliveries: deliveryStats.rows[0],
        payments: paymentStats.rows[0],
        verifications: verificationStats.rows[0],
        issues: issueStats.rows[0]
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/analytics/recent-activity - Get recent activities
router.get('/recent-activity', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    const role = req.user?.role;

    let query = '';
    let params: any[] = [];

    if (role === 'admin') {
      query = `
        (
          SELECT 'verification' as type, v.id, v.created_at as timestamp,
                 s.name as school_name, c.name as catering_name, v.status
          FROM verifications v
          JOIN deliveries d ON v.delivery_id = d.id
          JOIN schools s ON d.school_id = s.id
          JOIN caterings c ON d.catering_id = c.id
        )
        UNION ALL
        (
          SELECT 'issue' as type, i.id, i.created_at as timestamp,
                 s.name as school_name, c.name as catering_name, i.status
          FROM issues i
          JOIN deliveries d ON i.delivery_id = d.id
          JOIN schools s ON d.school_id = s.id
          JOIN caterings c ON d.catering_id = c.id
        )
        UNION ALL
        (
          SELECT 'delivery' as type, d.id, d.created_at as timestamp,
                 s.name as school_name, c.name as catering_name, d.status
          FROM deliveries d
          JOIN schools s ON d.school_id = s.id
          JOIN caterings c ON d.catering_id = c.id
        )
        ORDER BY timestamp DESC
        LIMIT $1
      `;
      params = [parseInt(limit as string)];
    } else if (role === 'school') {
      const schoolResult = await pool.query(
        'SELECT id FROM schools WHERE user_id = $1',
        [req.user?.id]
      );
      if (schoolResult.rows.length === 0) {
        return res.status(404).json({ error: 'School not found' });
      }
      const school_id = schoolResult.rows[0].id;

      query = `
        (
          SELECT 'verification' as type, v.id, v.created_at as timestamp,
                 'Verification' as title, v.status
          FROM verifications v
          WHERE v.school_id = $1
        )
        UNION ALL
        (
          SELECT 'delivery' as type, d.id, d.created_at as timestamp,
                 'Delivery' as title, d.status
          FROM deliveries d
          WHERE d.school_id = $1
        )
        ORDER BY timestamp DESC
        LIMIT $2
      `;
      params = [school_id, parseInt(limit as string)];
    } else if (role === 'catering') {
      const cateringResult = await pool.query(
        'SELECT id FROM caterings WHERE user_id = $1',
        [req.user?.id]
      );
      if (cateringResult.rows.length === 0) {
        return res.status(404).json({ error: 'Catering not found' });
      }
      const catering_id = cateringResult.rows[0].id;

      query = `
        (
          SELECT 'verification' as type, v.id, v.created_at as timestamp,
                 'Verification' as title, v.status
          FROM verifications v
          JOIN deliveries d ON v.delivery_id = d.id
          WHERE d.catering_id = $1
        )
        UNION ALL
        (
          SELECT 'delivery' as type, d.id, d.created_at as timestamp,
                 'Delivery' as title, d.status
          FROM deliveries d
          WHERE d.catering_id = $1
        )
        ORDER BY timestamp DESC
        LIMIT $2
      `;
      params = [catering_id, parseInt(limit as string)];
    }

    const result = await pool.query(query, params);

    res.json({
      activities: result.rows
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      error: 'Failed to fetch recent activity',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/analytics/trends - Get trend data
router.get('/trends', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'month' } = req.query;

    let dateFormat = 'YYYY-MM-DD';
    let dateInterval = '1 day';

    if (period === 'year') {
      dateFormat = 'YYYY-MM';
      dateInterval = '1 month';
    } else if (period === 'week') {
      dateFormat = 'YYYY-MM-DD';
      dateInterval = '1 day';
    }

    const trendsQuery = `
      SELECT
        TO_CHAR(date_series, '${dateFormat}') as period,
        COALESCE(COUNT(d.id), 0) as total_deliveries,
        COALESCE(SUM(d.amount), 0) as total_amount,
        COALESCE(COUNT(v.id), 0) as total_verifications
      FROM generate_series(
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE,
        INTERVAL '${dateInterval}'
      ) AS date_series
      LEFT JOIN deliveries d ON DATE(d.delivery_date) = DATE(date_series)
      LEFT JOIN verifications v ON DATE(v.verified_at) = DATE(date_series)
      GROUP BY period
      ORDER BY period
    `;

    const result = await pool.query(trendsQuery);

    res.json({
      trends: result.rows
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      error: 'Failed to fetch trends',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
