// @ts-nocheck
import express, { type Request, type Response } from 'express';
import { supabase } from '../config/database.js';
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
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select(`
        *,
        schools!inner(id),
        caterings!inner(id)
      `)
      .eq('id', delivery_id)
      .single();

    if (deliveryError || !delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const school_id = delivery.schools.id;
    const catering_id = delivery.caterings.id;

    // Generate escrow ID
    const escrowId = blockchainService.generateEscrowId(
      delivery_id,
      school_id,
      catering_id
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
    const { error: insertError } = await supabase
      .from('escrow_transactions')
      .insert({
        escrow_id: escrowId,
        delivery_id: delivery_id,
        school_id: school_id,
        catering_id: catering_id,
        amount: amount,
        status: 'locked',
        tx_hash: result.txHash,
        block_number: result.blockNumber,
        locked_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting escrow transaction:', insertError);
      return res.status(500).json({ error: 'Failed to record escrow transaction' });
    }

    // Update delivery status
    const { error: updateError } = await supabase
      .from('deliveries')
      .update({
        status: 'scheduled',
        updated_at: new Date().toISOString()
      })
      .eq('id', delivery_id);

    if (updateError) {
      console.error('Error updating delivery status:', updateError);
    }

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
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('escrow_id', escrow_id)
      .single();

    if (escrowError || !escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

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
 * GET /api/escrow
 * Get all escrow transactions (Admin only)
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Validate role
    if ((req as any).user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can view all escrows' });
    }

    // Get all escrow transactions from database with allocations join
    const { data: escrows, error } = await supabase
      .from('escrow_transactions')
      .select(`
        *,
        allocations!inner(
          id,
          school_id,
          catering_id,
          schools!inner(name),
          caterings!inner(name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching escrows:', error);
      return res.status(500).json({ error: 'Failed to fetch escrow transactions' });
    }

    // Format the data for frontend
    const formattedEscrows = escrows.map((escrow: any) => ({
      id: escrow.id,
      school: escrow.allocations?.schools?.name || 'Unknown School',
      catering: escrow.allocations?.caterings?.name || 'Unknown Catering',
      amount: escrow.amount,
      status: escrow.transaction_type === 'LOCK' && escrow.status === 'CONFIRMED' ? 'Terkunci' :
              escrow.transaction_type === 'RELEASE' && escrow.status === 'CONFIRMED' ? 'Tercairkan' :
              escrow.status === 'FAILED' ? 'Gagal' :
              escrow.status === 'PENDING' ? 'Menunggu Rilis' : 'Tertunda',
      lockedAt: escrow.executed_at || escrow.created_at,
      releaseDate: escrow.confirmed_at || escrow.executed_at || escrow.created_at,
      releasedAt: escrow.transaction_type === 'RELEASE' ? escrow.confirmed_at : null,
      txHash: escrow.blockchain_tx_hash || '0x0000000000000000000000000000000000000000'
    }));

    res.json({
      success: true,
      escrows: formattedEscrows
    });
  } catch (error: any) {
    console.error('Error getting escrows:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/escrow/stats
 * Get escrow statistics (Admin only)
 */
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Validate role
    if ((req as any).user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can view escrow stats' });
    }

    // Get statistics from database
    const { data: escrows, error } = await supabase
      .from('escrow_transactions')
      .select('amount, status, transaction_type');

    if (error) {
      console.error('Error fetching escrow stats:', error);
      return res.status(500).json({ error: 'Failed to fetch escrow statistics' });
    }

    // Calculate statistics based on real schema
    const stats = {
      totalTerkunci: 0,
      totalTercair: 0,
      pendingRelease: 0
    };

    escrows.forEach((escrow: any) => {
      const amount = parseFloat(escrow.amount);

      // Locked funds: LOCK transaction that is CONFIRMED
      if (escrow.transaction_type === 'LOCK' && escrow.status === 'CONFIRMED') {
        stats.totalTerkunci += amount;
      }
      // Released funds: RELEASE transaction that is CONFIRMED
      else if (escrow.transaction_type === 'RELEASE' && escrow.status === 'CONFIRMED') {
        stats.totalTercair += amount;
      }
      // Pending: PENDING status or FAILED
      else if (escrow.status === 'PENDING' || escrow.status === 'FAILED') {
        stats.pendingRelease += amount;
      }
    });

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Error getting escrow stats:', error);
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

    if (!escrowId) {
      return res.status(400).json({ error: 'Escrow ID is required' });
    }

    // Get from blockchain
    const blockchainData = await blockchainService.getEscrowDetails(escrowId);

    if (!blockchainData) {
      return res.status(404).json({ error: 'Escrow not found on blockchain' });
    }

    // Get from database
    const { data: dbData, error: dbError } = await supabase
      .from('escrow_transactions')
      .select(`
        *,
        deliveries(delivery_date, portions),
        schools(name),
        caterings(name)
      `)
      .eq('escrow_id', escrowId)
      .single();

    // Flatten the nested structure for consistency
    const flattenedData = dbData ? {
      ...dbData,
      delivery_date: dbData.deliveries?.delivery_date,
      portions: dbData.deliveries?.portions,
      school_name: dbData.schools?.name,
      catering_name: dbData.caterings?.name
    } : null;

    res.json({
      escrowId,
      blockchain: blockchainData,
      database: flattenedData
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
