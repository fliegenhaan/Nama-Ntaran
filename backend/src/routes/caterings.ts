import express from 'express';
import type { Response } from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/caterings - Create new catering (Admin only)
router.post('/', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { name, company_name, wallet_address, phone, email, address, user_id } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO caterings (name, company_name, wallet_address, phone, email, address, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, company_name || null, wallet_address || null, phone || null, email || null, address || null, user_id || null]
    );

    res.status(201).json({
      message: 'Catering created successfully',
      catering: result.rows[0]
    });
  } catch (error) {
    console.error('Create catering error:', error);
    res.status(500).json({
      error: 'Failed to create catering',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/caterings - Get caterings with filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      sort_by = 'created_at',
      order = 'DESC'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramCounter = 1;

    // Filter by user role
    if (req.user?.role === 'catering') {
      const cateringResult = await pool.query(
        'SELECT id FROM caterings WHERE user_id = $1',
        [req.user.id]
      );
      if (cateringResult.rows.length > 0) {
        conditions.push(`c.id = $${paramCounter}`);
        params.push(cateringResult.rows[0].id);
        paramCounter++;
      }
    }

    // Search filter
    if (search) {
      conditions.push(`(c.name ILIKE $${paramCounter} OR c.company_name ILIKE $${paramCounter})`);
      params.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM caterings c ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Validate sort_by to prevent SQL injection
    const allowedSortFields = ['name', 'rating', 'total_deliveries', 'created_at'];
    const sortField = allowedSortFields.includes(sort_by as string) ? sort_by : 'created_at';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    // Get caterings with delivery stats
    const query = `
      SELECT
        c.*,
        u.email as contact_email,
        COUNT(d.id) as active_deliveries,
        COUNT(d.id) FILTER (WHERE d.status = 'verified') as completed_deliveries
      FROM caterings c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN deliveries d ON c.id = d.catering_id
      ${whereClause}
      GROUP BY c.id, u.email
      ORDER BY c.${sortField} ${sortOrder}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    res.json({
      caterings: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get caterings error:', error);
    res.status(500).json({
      error: 'Failed to fetch caterings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/caterings/:id - Get single catering
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        c.*,
        u.email as contact_email,
        COUNT(d.id) as total_deliveries_count,
        COUNT(d.id) FILTER (WHERE d.status = 'verified') as verified_deliveries,
        ROUND(AVG(v.quality_rating), 2) as avg_quality_rating
      FROM caterings c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN deliveries d ON c.id = d.catering_id
      LEFT JOIN verifications v ON d.id = v.delivery_id
      WHERE c.id = $1
      GROUP BY c.id, u.email`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Catering not found' });
    }

    res.json({
      catering: result.rows[0]
    });
  } catch (error) {
    console.error('Get catering error:', error);
    res.status(500).json({
      error: 'Failed to fetch catering',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/caterings/:id - Update catering
router.patch('/:id', requireRole('admin', 'catering'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, company_name, wallet_address, phone, email, address } = req.body;

  try {
    // Check authorization for catering role
    if (req.user?.role === 'catering') {
      const cateringCheck = await pool.query(
        'SELECT id FROM caterings WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      if (cateringCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramCounter = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCounter}`);
      params.push(name);
      paramCounter++;
    }
    if (company_name !== undefined) {
      updates.push(`company_name = $${paramCounter}`);
      params.push(company_name);
      paramCounter++;
    }
    if (wallet_address !== undefined) {
      updates.push(`wallet_address = $${paramCounter}`);
      params.push(wallet_address);
      paramCounter++;
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCounter}`);
      params.push(phone);
      paramCounter++;
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCounter}`);
      params.push(email);
      paramCounter++;
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCounter}`);
      params.push(address);
      paramCounter++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const query = `
      UPDATE caterings
      SET ${updates.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Catering not found' });
    }

    res.json({
      message: 'Catering updated successfully',
      catering: result.rows[0]
    });
  } catch (error) {
    console.error('Update catering error:', error);
    res.status(500).json({
      error: 'Failed to update catering',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/caterings/:id/deliveries - Get catering's deliveries
router.get('/:id/deliveries', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status = '', limit = '20' } = req.query;

    const conditions = ['d.catering_id = $1'];
    const params: any[] = [id];
    let paramCounter = 2;

    if (status) {
      conditions.push(`d.status = $${paramCounter}`);
      params.push(status);
      paramCounter++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const query = `
      SELECT
        d.*,
        s.name as school_name,
        s.npsn,
        v.status as verification_status,
        v.verified_at
      FROM deliveries d
      LEFT JOIN schools s ON d.school_id = s.id
      LEFT JOIN verifications v ON d.id = v.delivery_id
      ${whereClause}
      ORDER BY d.delivery_date DESC
      LIMIT $${paramCounter}
    `;

    params.push(parseInt(limit as string));

    const result = await pool.query(query, params);

    res.json({
      deliveries: result.rows
    });
  } catch (error) {
    console.error('Get catering deliveries error:', error);
    res.status(500).json({
      error: 'Failed to fetch catering deliveries',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/caterings/:id/stats - Get catering statistics
router.get('/:id/stats', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const statsQuery = `
      SELECT
        COUNT(d.id) as total_deliveries,
        COUNT(d.id) FILTER (WHERE d.status = 'verified') as verified_deliveries,
        COUNT(d.id) FILTER (WHERE d.status = 'pending') as pending_deliveries,
        COUNT(d.id) FILTER (WHERE d.delivery_date >= CURRENT_DATE) as upcoming_deliveries,
        SUM(d.amount) as total_revenue,
        SUM(d.amount) FILTER (WHERE d.status = 'verified') as verified_revenue,
        ROUND(AVG(v.quality_rating), 2) as avg_quality_rating,
        COUNT(i.id) as total_issues
      FROM caterings c
      LEFT JOIN deliveries d ON c.id = d.catering_id
      LEFT JOIN verifications v ON d.id = v.delivery_id
      LEFT JOIN issues i ON d.id = i.delivery_id
      WHERE c.id = $1
      GROUP BY c.id
    `;

    const result = await pool.query(statsQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Catering not found' });
    }

    res.json({
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Get catering stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch catering stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
