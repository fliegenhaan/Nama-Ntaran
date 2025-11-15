import express from 'express';
import type { Response } from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { uploadSingle, getFileUrl } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/issues - Report an issue (with optional photo)
router.post('/', requireRole('school', 'admin'), uploadSingle('issue_photo'), async (req: AuthRequest, res: Response) => {
  const { delivery_id, issue_type, description, severity } = req.body;

  if (!delivery_id || !issue_type || !description) {
    return res.status(400).json({
      error: 'delivery_id, issue_type, and description are required'
    });
  }

  const validIssueTypes = ['late_delivery', 'wrong_portions', 'quality_issue', 'missing_delivery', 'other'];
  if (!validIssueTypes.includes(issue_type)) {
    return res.status(400).json({
      error: 'Invalid issue_type',
      valid_types: validIssueTypes
    });
  }

  try {
    // Get photo URL if file was uploaded
    let photoUrl = null;
    if (req.file) {
      photoUrl = getFileUrl(req.file.filename, 'issues');
    }

    const result = await pool.query(
      `INSERT INTO issues (delivery_id, reported_by, issue_type, description, severity, status, photo_url)
       VALUES ($1, $2, $3, $4, $5, 'open', $6)
       RETURNING *`,
      [delivery_id, req.user?.id, issue_type, description, severity || 'medium', photoUrl]
    );

    res.status(201).json({
      message: 'Issue reported successfully',
      issue: result.rows[0]
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({
      error: 'Failed to report issue',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/issues - Get issues with filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      status = '',
      issue_type = '',
      severity = '',
      delivery_id = ''
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramCounter = 1;

    // Filter by user role
    if (req.user?.role === 'school') {
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
      conditions.push(`i.status = $${paramCounter}`);
      params.push(status);
      paramCounter++;
    }

    if (issue_type) {
      conditions.push(`i.issue_type = $${paramCounter}`);
      params.push(issue_type);
      paramCounter++;
    }

    if (severity) {
      conditions.push(`i.severity = $${paramCounter}`);
      params.push(severity);
      paramCounter++;
    }

    if (delivery_id) {
      conditions.push(`i.delivery_id = $${paramCounter}`);
      params.push(delivery_id);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM issues i
      LEFT JOIN deliveries d ON i.delivery_id = d.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get issues with related data
    const query = `
      SELECT
        i.*,
        d.delivery_date,
        d.portions,
        d.amount,
        s.name as school_name,
        s.npsn,
        c.name as catering_name,
        u1.email as reported_by_email,
        u2.email as resolved_by_email
      FROM issues i
      LEFT JOIN deliveries d ON i.delivery_id = d.id
      LEFT JOIN schools s ON d.school_id = s.id
      LEFT JOIN caterings c ON d.catering_id = c.id
      LEFT JOIN users u1 ON i.reported_by = u1.id
      LEFT JOIN users u2 ON i.resolved_by = u2.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    res.json({
      issues: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      error: 'Failed to fetch issues',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/issues/:id - Get single issue
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        i.*,
        d.delivery_date,
        d.portions,
        d.amount,
        d.status as delivery_status,
        s.name as school_name,
        s.npsn,
        s.address as school_address,
        c.name as catering_name,
        c.company_name as catering_company,
        u1.email as reported_by_email,
        u2.email as resolved_by_email
      FROM issues i
      LEFT JOIN deliveries d ON i.delivery_id = d.id
      LEFT JOIN schools s ON d.school_id = s.id
      LEFT JOIN caterings c ON d.catering_id = c.id
      LEFT JOIN users u1 ON i.reported_by = u1.id
      LEFT JOIN users u2 ON i.resolved_by = u2.id
      WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json({
      issue: result.rows[0]
    });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({
      error: 'Failed to fetch issue',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/issues/:id/status - Update issue status (Admin only)
router.patch('/:id/status', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, resolution_notes } = req.body;

  const validStatuses = ['open', 'investigating', 'resolved', 'closed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status',
      valid_statuses: validStatuses
    });
  }

  try {
    const updates = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [status];
    let paramCounter = 2;

    if (resolution_notes) {
      updates.push(`resolution_notes = $${paramCounter}`);
      params.push(resolution_notes);
      paramCounter++;
    }

    if (status === 'resolved' || status === 'closed') {
      updates.push(`resolved_by = $${paramCounter}`, `resolved_at = CURRENT_TIMESTAMP`);
      params.push(req.user?.id);
      paramCounter++;
    }

    params.push(id);

    const result = await pool.query(
      `UPDATE issues
       SET ${updates.join(', ')}
       WHERE id = $${paramCounter}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json({
      message: 'Issue status updated',
      issue: result.rows[0]
    });
  } catch (error) {
    console.error('Update issue status error:', error);
    res.status(500).json({
      error: 'Failed to update issue status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/issues/stats/summary - Get issue statistics
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCounter = 1;

    // Filter by user role
    if (req.user?.role === 'school') {
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const statsQuery = `
      SELECT
        COUNT(*) as total_issues,
        COUNT(*) FILTER (WHERE i.status = 'open') as open_issues,
        COUNT(*) FILTER (WHERE i.status = 'investigating') as investigating,
        COUNT(*) FILTER (WHERE i.status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE i.status = 'closed') as closed,
        COUNT(*) FILTER (WHERE i.severity = 'critical') as critical,
        COUNT(*) FILTER (WHERE i.severity = 'high') as high,
        COUNT(*) FILTER (WHERE i.issue_type = 'late_delivery') as late_deliveries,
        COUNT(*) FILTER (WHERE i.issue_type = 'quality_issue') as quality_issues
      FROM issues i
      LEFT JOIN deliveries d ON i.delivery_id = d.id
      ${whereClause}
    `;

    const result = await pool.query(statsQuery, params);

    res.json({
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Get issue stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch issue stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
