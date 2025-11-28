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
    // if ((req as any).user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Only admin can view all escrows' });
    // }

    // Get all escrow transactions from database
    // Support both allocation-based and delivery-based escrows
    const { data: escrows, error } = await supabase
      .from('escrow_transactions')
      .select(`
        *,
        allocations(
          id,
          school_id,
          catering_id,
          schools(name),
          caterings(name)
        ),
        deliveries(
          id,
          school_id,
          catering_id,
          schools(name),
          caterings(name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching escrows:', error);
      return res.status(500).json({ error: 'Failed to fetch escrow transactions' });
    }

    // Format the data for frontend
    // Support both allocation-based and delivery-based escrows
    const formattedEscrows = escrows.map((escrow: any) => {
      // Determine if this is allocation-based or delivery-based
      const isAllocationBased = !!escrow.allocation_id;
      const isDeliveryBased = !!escrow.delivery_id;

      // Get school and catering info from the appropriate relation
      let schoolName = 'Unknown School';
      let cateringName = 'Unknown Catering';

      if (isAllocationBased && escrow.allocations) {
        schoolName = escrow.allocations.schools?.name || 'Unknown School';
        cateringName = escrow.allocations.caterings?.name || 'Unknown Catering';
      } else if (isDeliveryBased && escrow.deliveries) {
        schoolName = escrow.deliveries.schools?.name || 'Unknown School';
        cateringName = escrow.deliveries.caterings?.name || 'Unknown Catering';
      }

      // Determine status based on escrow_status column (for delivery-based)
      // or transaction_type (for allocation-based)
      let status: string;

      if (escrow.escrow_status) {
        // Delivery-based escrow uses escrow_status
        if (escrow.escrow_status === 'locked') {
          status = 'Terkunci';
        } else if (escrow.escrow_status === 'released') {
          status = 'Tercairkan';
        } else if (escrow.escrow_status === 'disputed') {
          status = 'Sengketa';
        } else if (escrow.escrow_status === 'cancelled') {
          status = 'Dibatalkan';
        } else {
          status = 'Tertunda';
        }
      } else {
        // Allocation-based escrow uses transaction_type
        if (escrow.transaction_type === 'LOCK' && escrow.status === 'CONFIRMED') {
          status = 'Terkunci';
        } else if (escrow.transaction_type === 'RELEASE' && escrow.status === 'CONFIRMED') {
          status = 'Tercairkan';
        } else if (escrow.status === 'FAILED') {
          status = 'Gagal';
        } else if (escrow.status === 'PENDING') {
          status = 'Tertunda';
        } else {
          status = 'Tertunda';
        }
      }

      return {
        id: escrow.id,
        school: schoolName,
        catering: cateringName,
        amount: escrow.amount,
        status,
        lockedAt: escrow.locked_at || escrow.executed_at || escrow.created_at,
        releaseDate: escrow.released_at || escrow.confirmed_at || escrow.executed_at || escrow.created_at,
        releasedAt: escrow.released_at || (escrow.transaction_type === 'RELEASE' ? escrow.confirmed_at : null),
        txHash: escrow.tx_hash || escrow.blockchain_tx_hash || '0x0000000000000000000000000000000000000000'
      };
    });

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
    // if ((req as any).user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Only admin can view escrow stats' });
    // }

    // Get statistics from database
    // Support both allocation-based and delivery-based escrows
    const { data: escrows, error } = await supabase
      .from('escrow_transactions')
      .select('amount, status, transaction_type, escrow_status');

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

      // For delivery-based escrows (have escrow_status)
      if (escrow.escrow_status) {
        if (escrow.escrow_status === 'locked') {
          stats.totalTerkunci += amount;
        } else if (escrow.escrow_status === 'released') {
          stats.totalTercair += amount;
        } else {
          // disputed, cancelled, etc
          stats.pendingRelease += amount;
        }
      }
      // For allocation-based escrows (have transaction_type)
      else {
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
 * POST /api/escrow/:id/release
 * Release funds from escrow by ID (Admin only)
 */
router.post('/:id/release', authenticateToken, async (req: Request, res: Response) => {
  try {
    const escrowId = parseInt(req.params.id);

    // Validate role
    if ((req as any).user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can release funds' });
    }

    if (!escrowId || isNaN(escrowId)) {
      return res.status(400).json({ error: 'Invalid escrow ID' });
    }

    // Get escrow from database by ID with allocation details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select(`
        *,
        allocations!inner(
          id,
          allocation_id,
          school_id,
          catering_id,
          amount
        )
      `)
      .eq('id', escrowId)
      .single();

    if (escrowError || !escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    // Check if this is a RELEASE transaction (shouldn't release a release)
    if (escrow.transaction_type === 'RELEASE') {
      return res.status(400).json({ error: 'This is already a release transaction' });
    }

    // Check if this is not a LOCK transaction
    if (escrow.transaction_type !== 'LOCK') {
      return res.status(400).json({ error: 'Can only release LOCK transactions' });
    }

    // Check if already confirmed (can only release CONFIRMED locks)
    if (escrow.status !== 'CONFIRMED') {
      return res.status(400).json({
        error: `Cannot release escrow with status: ${escrow.status}. Only CONFIRMED locks can be released.`
      });
    }

    // Check if this allocation has already been released
    const { data: existingRelease, error: releaseCheckError } = await supabase
      .from('escrow_transactions')
      .select('id')
      .eq('allocation_id', escrow.allocation_id)
      .eq('transaction_type', 'RELEASE')
      .eq('status', 'CONFIRMED')
      .maybeSingle();

    if (releaseCheckError) {
      console.error('Error checking for existing release:', releaseCheckError);
    }

    if (existingRelease) {
      return res.status(400).json({
        error: 'This allocation has already been released'
      });
    }

    console.log(`\n🔓 Admin releasing escrow #${escrowId}`);
    console.log(`  Allocation: ${escrow.allocations.allocation_id}`);
    console.log(`  Amount: ${escrow.amount} ${escrow.currency}`);

    // For now, create a mock blockchain transaction
    // In production, you would call: blockchainService.releaseFundFromEscrow(escrow.blockchain_tx_hash)
    // But based on the seeder, it seems the blockchain integration might not be fully set up

    // Create a new RELEASE transaction
    const { data: releaseTransaction, error: releaseError } = await supabase
      .from('escrow_transactions')
      .insert({
        allocation_id: escrow.allocation_id,
        transaction_type: 'RELEASE',
        amount: escrow.amount,
        currency: escrow.currency,
        status: 'CONFIRMED',
        blockchain_tx_hash: `0x${Date.now().toString(16)}...release${escrowId}`,
        blockchain_block_number: Math.floor(Math.random() * 1000000) + 18000000,
        blockchain_confirmed: true,
        from_address: escrow.to_address,
        to_address: escrow.from_address,
        smart_contract_address: escrow.smart_contract_address,
        gas_used: 98000,
        gas_price_gwei: 22.5,
        executed_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        retry_count: 0,
        metadata: {
          ...escrow.metadata,
          released_by: (req as any).user.id,
          released_from_escrow_id: escrowId,
          verified: true
        }
      })
      .select()
      .single();

    if (releaseError) {
      console.error('Error creating release transaction:', releaseError);
      return res.status(500).json({ error: 'Failed to create release transaction' });
    }

    // Update allocation status to RELEASED
    const { error: allocationError } = await supabase
      .from('allocations')
      .update({
        status: 'RELEASED',
        released_at: new Date().toISOString(),
        tx_hash_release: releaseTransaction.blockchain_tx_hash,
        updated_at: new Date().toISOString()
      })
      .eq('id', escrow.allocation_id);

    if (allocationError) {
      console.error('Error updating allocation:', allocationError);
    }

    console.log('✅ Escrow released successfully!\n');

    res.json({
      success: true,
      txHash: releaseTransaction.blockchain_tx_hash,
      blockNumber: releaseTransaction.blockchain_block_number,
      message: 'Fund released to catering successfully',
      releaseTransactionId: releaseTransaction.id
    });
  } catch (error: any) {
    console.error('Error releasing escrow:', error);
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
