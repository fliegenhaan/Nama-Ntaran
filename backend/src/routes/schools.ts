import express from 'express';
import type { Response } from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// GET /api/schools - Get schools with search, filter, pagination
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      province = '',
      city = '',
      jenjang = '',
      status = '',
      sort_by = 'priority_score',
      order = 'DESC'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCounter = 1;

    if (search) {
      conditions.push(`(name ILIKE $${paramCounter} OR npsn ILIKE $${paramCounter} OR address ILIKE $${paramCounter})`);
      params.push(`%${search}%`);
      paramCounter++;
    }

    if (province) {
      conditions.push(`province = $${paramCounter}`);
      params.push(province);
      paramCounter++;
    }

    if (city) {
      conditions.push(`city = $${paramCounter}`);
      params.push(city);
      paramCounter++;
    }

    if (jenjang) {
      conditions.push(`jenjang = $${paramCounter}`);
      params.push(jenjang);
      paramCounter++;
    }

    if (status) {
      conditions.push(`status = $${paramCounter}`);
      params.push(status);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort_by to prevent SQL injection
    const allowedSortFields = ['priority_score', 'name', 'created_at', 'province', 'city'];
    const sortField = allowedSortFields.includes(sort_by as string) ? sort_by : 'priority_score';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM schools ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get schools
    const query = `
      SELECT
        id,
        npsn,
        name,
        address,
        kelurahan,
        status,
        province,
        city,
        district,
        jenjang,
        priority_score,
        created_at
      FROM schools
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    res.json({
      schools: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum)
      },
      filters: {
        search,
        province,
        city,
        jenjang,
        status
      }
    });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({
      error: 'Failed to fetch schools',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/schools/stats - Get statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    // Total schools
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM schools');
    const total = parseInt(totalResult.rows[0].total);

    // By jenjang
    const jenjangResult = await pool.query(`
      SELECT jenjang, COUNT(*) as count
      FROM schools
      GROUP BY jenjang
      ORDER BY count DESC
    `);

    // By status
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM schools
      GROUP BY status
      ORDER BY count DESC
    `);

    // By province (top 10)
    const provinceResult = await pool.query(`
      SELECT province, COUNT(*) as count
      FROM schools
      GROUP BY province
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      total,
      by_jenjang: jenjangResult.rows,
      by_status: statusResult.rows,
      top_provinces: provinceResult.rows
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/schools/:id - Get single school
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM schools WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.json({
      school: result.rows[0]
    });
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({
      error: 'Failed to fetch school',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/schools/provinces - Get list of provinces
router.get('/filters/provinces', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT province
      FROM schools
      WHERE province IS NOT NULL
      ORDER BY province
    `);

    res.json({
      provinces: result.rows.map(row => row.province)
    });
  } catch (error) {
    console.error('Get provinces error:', error);
    res.status(500).json({
      error: 'Failed to fetch provinces',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/schools/cities/:province - Get cities in a province
router.get('/filters/cities/:province', async (req: AuthRequest, res: Response) => {
  try {
    const { province } = req.params;

    const result = await pool.query(`
      SELECT DISTINCT city
      FROM schools
      WHERE province = $1 AND city IS NOT NULL
      ORDER BY city
    `, [province]);

    res.json({
      cities: result.rows.map(row => row.city)
    });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      error: 'Failed to fetch cities',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
