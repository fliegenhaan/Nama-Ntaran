import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/blockchain/feed
 * Get recent blockchain transactions (public endpoint)
 */
router.get('/feed', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(
      `SELECT
        et.id,
        et.escrow_id,
        et.amount,
        et.status,
        et.tx_hash,
        et.block_number,
        et.locked_at,
        et.released_at,
        et.created_at,
        s.name as school_name,
        s.npsn,
        s.province,
        s.city,
        c.name as catering_name,
        d.portions,
        d.delivery_date
       FROM escrow_transactions et
       LEFT JOIN deliveries d ON et.delivery_id = d.id
       LEFT JOIN schools s ON d.school_id = s.id
       LEFT JOIN caterings c ON et.catering_id = c.id
       WHERE et.status IN ('locked', 'released')
       ORDER BY et.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM escrow_transactions
       WHERE status IN ('locked', 'released')`
    );

    const transactions = result.rows.map((row: any) => ({
      id: row.id,
      escrowId: row.escrow_id,
      type: row.status === 'locked' ? 'FundLocked' : 'FundReleased',
      amount: parseFloat(row.amount),
      status: row.status,
      txHash: row.tx_hash,
      blockNumber: row.block_number,
      school: {
        name: row.school_name,
        npsn: row.npsn,
        province: row.province,
        city: row.city
      },
      catering: {
        name: row.catering_name
      },
      portions: row.portions,
      deliveryDate: row.delivery_date,
      timestamp: row.status === 'released' ? row.released_at : row.locked_at,
      createdAt: row.created_at
    }));

    res.json({
      success: true,
      data: transactions,
      pagination: {
        limit,
        offset,
        total: parseInt(countResult.rows[0].total)
      }
    });
  } catch (error: any) {
    console.error('Error fetching blockchain feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blockchain feed',
      details: error.message
    });
  }
});

/**
 * GET /api/blockchain/stats
 * Get blockchain statistics (public endpoint)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'locked') as total_locked,
        COUNT(*) FILTER (WHERE status = 'released') as total_released,
        SUM(amount) FILTER (WHERE status = 'locked') as total_amount_locked,
        SUM(amount) FILTER (WHERE status = 'released') as total_amount_released,
        COUNT(DISTINCT delivery_id) FILTER (WHERE status = 'released') as deliveries_completed
       FROM escrow_transactions`
    );

    res.json({
      success: true,
      data: {
        totalLocked: parseInt(stats.rows[0].total_locked) || 0,
        totalReleased: parseInt(stats.rows[0].total_released) || 0,
        totalAmountLocked: parseFloat(stats.rows[0].total_amount_locked) || 0,
        totalAmountReleased: parseFloat(stats.rows[0].total_amount_released) || 0,
        deliveriesCompleted: parseInt(stats.rows[0].deliveries_completed) || 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching blockchain stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blockchain stats',
      details: error.message
    });
  }
});

/**
 * GET /api/blockchain/transaction/:txHash
 * Get transaction details by hash (public endpoint)
 */
router.get('/transaction/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;

    const result = await pool.query(
      `SELECT
        et.*,
        s.name as school_name,
        s.npsn,
        s.address as school_address,
        c.name as catering_name,
        c.wallet_address as catering_wallet,
        d.portions,
        d.delivery_date
       FROM escrow_transactions et
       LEFT JOIN deliveries d ON et.delivery_id = d.id
       LEFT JOIN schools s ON d.school_id = s.id
       LEFT JOIN caterings c ON et.catering_id = c.id
       WHERE et.tx_hash = $1`,
      [txHash]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    const tx = result.rows[0];

    res.json({
      success: true,
      data: {
        escrowId: tx.escrow_id,
        amount: parseFloat(tx.amount),
        status: tx.status,
        txHash: tx.tx_hash,
        blockNumber: tx.block_number,
        lockedAt: tx.locked_at,
        releasedAt: tx.released_at,
        school: {
          name: tx.school_name,
          npsn: tx.npsn,
          address: tx.school_address
        },
        catering: {
          name: tx.catering_name,
          walletAddress: tx.catering_wallet
        },
        delivery: {
          portions: tx.portions,
          date: tx.delivery_date
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction',
      details: error.message
    });
  }
});

export default router;
