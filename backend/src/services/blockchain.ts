import { ethers } from 'ethers';
import { escrowContract, wallet } from '../config/blockchain.js';
import { pool } from '../config/database.js';

/**
 * Release escrow funds to catering after school verification
 * @param deliveryId - Delivery ID yang sudah diverifikasi
 * @returns Transaction hash atau error
 */
export async function releaseEscrowForDelivery(deliveryId: number) {
  try {
    if (!escrowContract || !wallet) {
      throw new Error('Blockchain not configured. Check BLOCKCHAIN_RPC_URL and SERVICE_WALLET_PRIVATE_KEY in .env');
    }

    // Get escrow transaction for this delivery
    const escrowResult = await pool.query(
      `SELECT et.*, d.catering_id, c.wallet_address
       FROM escrow_transactions et
       JOIN deliveries d ON et.delivery_id = d.id
       JOIN caterings c ON d.catering_id = c.id
       WHERE et.delivery_id = $1 AND et.status = 'locked'
       ORDER BY et.created_at DESC
       LIMIT 1`,
      [deliveryId]
    );

    if (escrowResult.rows.length === 0) {
      throw new Error('No locked escrow found for this delivery');
    }

    const escrow = escrowResult.rows[0];

    // Generate escrow ID (same format as when locking)
    const escrowId = ethers.utils.id(`delivery-${deliveryId}-${escrow.id}`);

    console.log(`📤 Releasing escrow for delivery ${deliveryId}...`);
    console.log(`   Escrow ID: ${escrowId}`);
    console.log(`   Amount: ${escrow.amount}`);
    console.log(`   Payee: ${escrow.wallet_address}`);

    // Call releaseFund on smart contract
    const tx = await escrowContract.releaseFund(escrowId);
    console.log(`   Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Escrow released! Block: ${receipt.blockNumber}`);

    // Update escrow transaction in database
    await pool.query(
      `UPDATE escrow_transactions
       SET status = 'released',
           released_at = CURRENT_TIMESTAMP,
           tx_hash = $1,
           block_number = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [receipt.transactionHash, receipt.blockNumber, escrow.id]
    );

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      escrowId: escrowId,
      amount: escrow.amount
    };

  } catch (error) {
    console.error('❌ Release escrow error:', error);

    // Update escrow status to failed if there's an error
    await pool.query(
      `UPDATE escrow_transactions
       SET status = 'failed',
           updated_at = CURRENT_TIMESTAMP
       WHERE delivery_id = $1 AND status = 'locked'`,
      [deliveryId]
    ).catch(err => console.error('Failed to update escrow status:', err));

    throw error;
  }
}

/**
 * Lock escrow funds for a delivery
 * @param deliveryId - Delivery ID
 * @param cateringId - Catering ID
 * @param amount - Amount in IDR (will be converted to wei)
 * @returns Transaction hash
 */
export async function lockEscrowForDelivery(
  deliveryId: number,
  cateringId: number,
  schoolId: number,
  amount: number
) {
  try {
    if (!escrowContract || !wallet) {
      throw new Error('Blockchain not configured');
    }

    // Get catering wallet address and school NPSN
    const result = await pool.query(
      `SELECT c.wallet_address, s.npsn
       FROM caterings c, schools s
       WHERE c.id = $1 AND s.id = $2`,
      [cateringId, schoolId]
    );

    if (result.rows.length === 0) {
      throw new Error('Catering or school not found');
    }

    const { wallet_address: payee, npsn } = result.rows[0];

    // Create escrow transaction record first
    const escrowInsert = await pool.query(
      `INSERT INTO escrow_transactions (delivery_id, school_id, catering_id, amount, status, locked_at)
       VALUES ($1, $2, $3, $4, 'locked', CURRENT_TIMESTAMP)
       RETURNING id`,
      [deliveryId, schoolId, cateringId, amount]
    );

    const escrowRecordId = escrowInsert.rows[0].id;

    // Generate unique escrow ID
    const escrowId = ethers.utils.id(`delivery-${deliveryId}-${escrowRecordId}`);

    // Convert amount to wei (for demo, 1 IDR = 1 wei, adjust as needed)
    const amountInWei = ethers.utils.parseEther((amount / 1000000).toString()); // Convert to smaller unit

    console.log(`🔒 Locking escrow for delivery ${deliveryId}...`);
    console.log(`   Escrow ID: ${escrowId}`);
    console.log(`   Payee: ${payee}`);
    console.log(`   Amount: ${amount} IDR (${amountInWei} wei)`);
    console.log(`   School NPSN: ${npsn}`);

    // Call lockFund on smart contract
    const tx = await escrowContract.lockFund(escrowId, payee, npsn, {
      value: amountInWei
    });

    console.log(`   Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Escrow locked! Block: ${receipt.blockNumber}`);

    // Update escrow transaction with blockchain details
    await pool.query(
      `UPDATE escrow_transactions
       SET tx_hash = $1,
           block_number = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [receipt.transactionHash, receipt.blockNumber, escrowRecordId]
    );

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      escrowId: escrowId
    };

  } catch (error) {
    console.error('❌ Lock escrow error:', error);
    throw error;
  }
}

/**
 * Get escrow details from blockchain
 * @param escrowId - Escrow ID (bytes32)
 */
export async function getEscrowDetails(escrowId: string) {
  try {
    if (!escrowContract) {
      throw new Error('Blockchain not configured');
    }

    const escrow = await escrowContract.getEscrow(escrowId);

    return {
      payer: escrow[0],
      payee: escrow[1],
      amount: escrow[2].toString(),
      isLocked: escrow[3],
      isReleased: escrow[4],
      schoolId: escrow[5]
    };

  } catch (error) {
    console.error('Get escrow details error:', error);
    throw error;
  }
}
