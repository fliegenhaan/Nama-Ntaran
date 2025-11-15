import express, { type Request, type Response } from 'express';
import { pool } from '../config/database.js';
import blockchainService from '../services/blockchainService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/escrow/lock
 * Lock funds to escrow (Admin only)
 */
router.post('/lock', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { delivery_id, catering_wallet, school_npsn, amount } = req.body;

    // Validate role
    if ((req as any).user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can lock funds' });
    }

    // Validate input
    if (!delivery_id || !catering_wallet || !school_npsn || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get delivery and school info
    const deliveryResult = await pool.query(
      `SELECT d.*, s.id as school_id, c.id as catering_id
       FROM deliveries d
       JOIN schools s ON d.school_id = s.id
       JOIN caterings c ON d.catering_id = c.id
       WHERE d.id = $1`,
      [delivery_id]
    );

    if (deliveryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const delivery = deliveryResult.rows[0];

    // Generate escrow ID
    const escrowId = blockchainService.generateEscrowId(
      delivery_id,
      delivery.school_id,
      delivery.catering_id
    );

    console.log(`\n🔐 Admin locking escrow for delivery #${delivery_id}`);

    // Call blockchain service
    const result = await blockchainService.lockFundToEscrow(
      escrowId,
      catering_wallet,
      school_npsn,
      amount
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Insert escrow transaction record
    await pool.query(
      `INSERT INTO escrow_transactions
       (escrow_id, delivery_id, school_id, catering_id, amount, status, tx_hash, block_number, locked_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        escrowId,
        delivery_id,
        delivery.school_id,
        delivery.catering_id,
        amount,
        'locked',
        result.txHash,
        result.blockNumber
      ]
    );

    // Update delivery status
    await pool.query(
      'UPDATE deliveries SET status = $1, updated_at = NOW() WHERE id = $2',
      ['scheduled', delivery_id]
    );

    console.log('✅ Escrow locked successfully!\n');

    res.json({
      success: true,
      escrowId,
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      message: 'Fund locked to escrow successfully'
    });
  } catch (error: any) {
    console.error('Error locking escrow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/escrow/release
 * Release funds from escrow (triggered by verification)
 */
router.post('/release', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { escrow_id } = req.body;

    if (!escrow_id) {
      return res.status(400).json({ error: 'Missing escrow_id' });
    }

    // Verify escrow exists and not yet released
    const escrowResult = await pool.query(
      'SELECT * FROM escrow_transactions WHERE escrow_id = $1',
      [escrow_id]
    );

    if (escrowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    const escrow = escrowResult.rows[0];

    if (escrow.status === 'released') {
      return res.status(400).json({ error: 'Escrow already released' });
    }

    console.log(`\n🔓 Releasing escrow ${escrow_id}`);

    // Call blockchain service
    const result = await blockchainService.releaseFundFromEscrow(escrow_id);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    console.log('✅ Escrow released successfully!\n');

    res.json({
      success: true,
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      message: 'Fund released to catering successfully'
    });
  } catch (error: any) {
    console.error('Error releasing escrow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/escrow/cancel
 * Cancel escrow and refund (Admin only - emergency)
 */
router.post('/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { escrow_id, reason } = req.body;

    // Validate role
    if ((req as any).user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can cancel escrow' });
    }

    if (!escrow_id || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`\n❌ Admin cancelling escrow ${escrow_id}`);
    console.log(`   Reason: ${reason}`);

    // Call blockchain service
    const result = await blockchainService.cancelEscrow(escrow_id, reason);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    console.log('✅ Escrow cancelled successfully!\n');

    res.json({
      success: true,
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      message: 'Escrow cancelled and refunded'
    });
  } catch (error: any) {
    console.error('Error cancelling escrow:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/escrow/:escrowId
 * Get escrow details from blockchain
 */
router.get('/:escrowId', async (req: Request, res: Response) => {
  try {
    const { escrowId } = req.params;

    // Get from blockchain
    const blockchainData = await blockchainService.getEscrowDetails(escrowId);

    if (!blockchainData) {
      return res.status(404).json({ error: 'Escrow not found on blockchain' });
    }

    // Get from database
    const dbResult = await pool.query(
      `SELECT et.*, d.delivery_date, d.portions, s.name as school_name, c.name as catering_name
       FROM escrow_transactions et
       LEFT JOIN deliveries d ON et.delivery_id = d.id
       LEFT JOIN schools s ON et.school_id = s.id
       LEFT JOIN caterings c ON et.catering_id = c.id
       WHERE et.escrow_id = $1`,
      [escrowId]
    );

    const dbData = dbResult.rows[0] || null;

    res.json({
      escrowId,
      blockchain: blockchainData,
      database: dbData
    });
  } catch (error: any) {
    console.error('Error getting escrow details:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/escrow/health/check
 * Check blockchain service health
 */
router.get('/health/check', async (req: Request, res: Response) => {
  try {
    const health = await blockchainService.checkContractHealth();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({ healthy: false, error: error.message });
  }
});

export default router;
