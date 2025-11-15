import express from 'express';
import type { Response } from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/deliveries - Create new delivery
router.post('/', async (req: AuthRequest, res: Response) => {
  const { school_id, catering_id, delivery_date, portions, amount, notes } = req.body;

  // Validation
  if (!school_id || !catering_id || !delivery_date || !portions || !amount) {
    return res.status(400).json({
      error: 'school_id, catering_id, delivery_date, portions, and amount are required'
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO deliveries (school_id, catering_id, delivery_date, portions, amount, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [school_id, catering_id, delivery_date, portions, amount, notes || null]
    );

    res.status(201).json({
      message: 'Delivery created successfully',
      delivery: result.rows[0]
    });
  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json({
      error: 'Failed to create delivery',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/deliveries - Get deliveries with filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      status = '',
      school_id = '',
      catering_id = '',
      date_from = '',
      date_to = ''
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramCounter = 1;

    // Filter by user role
    if (req.user?.role === 'school') {
      // Get user's school_id
      const schoolResult = await pool.query(
        'SELECT id FROM schools WHERE user_id = $1',
        [req.user.id]
      );
      if (schoolResult.rows.length > 0) {
        conditions.push(`d.school_id = $${paramCounter}`);
        params.push(schoolResult.rows[0].id);
        paramCounter++;
      }
    } else if (req.user?.role === 'catering') {
      // Get user's catering_id
      const cateringResult = await pool.query(
        'SELECT id FROM caterings WHERE user_id = $1',
        [req.user.id]
      );
      if (cateringResult.rows.length > 0) {
        conditions.push(`d.catering_id = $${paramCounter}`);
        params.push(cateringResult.rows[0].id);
        paramCounter++;
      }
    }

    if (status) {
      conditions.push(`d.status = $${paramCounter}`);
      params.push(status);
      paramCounter++;
    }

    if (school_id) {
      conditions.push(`d.school_id = $${paramCounter}`);
      params.push(school_id);
      paramCounter++;
    }

    if (catering_id) {
      conditions.push(`d.catering_id = $${paramCounter}`);
      params.push(catering_id);
      paramCounter++;
    }

    if (date_from) {
      conditions.push(`d.delivery_date >= $${paramCounter}`);
      params.push(date_from);
      paramCounter++;
    }

    if (date_to) {
      conditions.push(`d.delivery_date <= $${paramCounter}`);
      params.push(date_to);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM deliveries d ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get deliveries with school and catering info
    const query = `
      SELECT
        d.*,
        s.name as school_name,
        s.npsn,
        s.province,
        s.city,
        c.company_name as catering_company,
        c.name as catering_name
      FROM deliveries d
      LEFT JOIN schools s ON d.school_id = s.id
      LEFT JOIN caterings c ON d.catering_id = c.id
      ${whereClause}
      ORDER BY d.delivery_date DESC, d.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    res.json({
      deliveries: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({
      error: 'Failed to fetch deliveries',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/deliveries/:id - Get single delivery
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        d.*,
        s.name as school_name,
        s.npsn,
        s.address as school_address,
        s.province,
        s.city,
        c.company_name as catering_company,
        c.name as catering_name,
        c.phone as catering_phone,
        c.email as catering_email
      FROM deliveries d
      LEFT JOIN schools s ON d.school_id = s.id
      LEFT JOIN caterings c ON d.catering_id = c.id
      WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    res.json({
      delivery: result.rows[0]
    });
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({
      error: 'Failed to fetch delivery',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/deliveries/:id/status - Update delivery status
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'scheduled', 'delivered', 'verified', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status',
      valid_statuses: validStatuses
    });
  }

  try {
    const result = await pool.query(
      `UPDATE deliveries
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    res.json({
      message: 'Delivery status updated',
      delivery: result.rows[0]
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      error: 'Failed to update delivery status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
