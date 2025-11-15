import { ethers } from 'ethers';
import blockchainService from './blockchainService.js';
import { pool } from '../config/database.js';
import { broadcast, emitToCatering, emitToSchool, emitToAdmins } from '../config/socket.js';

/**
 * Blockchain Event Listener Service
 * Listens to smart contract events and updates database accordingly
 */

const contract = blockchainService.contract;

/**
 * Start listening to all blockchain events
 */
export function startBlockchainListener() {
  console.log('🎧 Starting blockchain event listener...');

  // Listen to FundLocked event
  contract.on('FundLocked', async (escrowId: any, payer: any, payee: any, amount: any, schoolId: any, event: any) => {
    try {
      console.log('\n💰 FundLocked event detected!');
      console.log(`  Escrow ID: ${escrowId}`);
      console.log(`  Payer: ${payer}`);
      console.log(`  Payee: ${payee}`);
      console.log(`  Amount: ${ethers.utils.formatEther(amount)} ETH`);
      console.log(`  School: ${schoolId}`);
      console.log(`  Block: ${event.blockNumber}`);
      console.log(`  TX Hash: ${event.transactionHash}`);

      // Update database - escrow_transactions table
      await pool.query(
        `UPDATE escrow_transactions
         SET status = 'locked',
             tx_hash = $1,
             block_number = $2,
             locked_at = NOW(),
             updated_at = NOW()
         WHERE escrow_id = $3`,
        [event.transactionHash, event.blockNumber, escrowId]
      );

      // Broadcast to public dashboard (real-time feed)
      broadcast('blockchain:fundLocked', {
        type: 'FundLocked',
        escrowId,
        amount: ethers.utils.formatEther(amount),
        schoolId,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: new Date().toISOString()
      });

      // Notify admins
      emitToAdmins('escrow:locked', {
        escrowId,
        amount: ethers.utils.formatEther(amount),
        schoolId,
        txHash: event.transactionHash
      });

      console.log('✅ Database updated for FundLocked event');
    } catch (error: any) {
      console.error('❌ Error handling FundLocked event:', error.message);
    }
  });

  // Listen to FundReleased event
  contract.on('FundReleased', async (escrowId: any, payee: any, amount: any, event: any) => {
    try {
      console.log('\n🎉 FundReleased event detected!');
      console.log(`  Escrow ID: ${escrowId}`);
      console.log(`  Payee: ${payee}`);
      console.log(`  Amount: ${ethers.utils.formatEther(amount)} ETH`);
      console.log(`  Block: ${event.blockNumber}`);
      console.log(`  TX Hash: ${event.transactionHash}`);

      // Start a transaction
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // 1. Update escrow_transactions
        await client.query(
          `UPDATE escrow_transactions
           SET status = 'released',
               tx_hash = $1,
               block_number = $2,
               released_at = NOW(),
               updated_at = NOW()
           WHERE escrow_id = $3`,
          [event.transactionHash, event.blockNumber, escrowId]
        );

        // 2. Get delivery_id from escrow_transactions
        const escrowResult = await client.query(
          'SELECT delivery_id FROM escrow_transactions WHERE escrow_id = $1',
          [escrowId]
        );

        if (escrowResult.rows.length > 0) {
          const deliveryId = escrowResult.rows[0].delivery_id;

          // 3. Update delivery status to 'verified'
          await client.query(
            `UPDATE deliveries
             SET status = 'verified',
                 updated_at = NOW()
             WHERE id = $1`,
            [deliveryId]
          );

          console.log(`  Delivery #${deliveryId} marked as verified`);

          // Get school and catering info for notifications
          const deliveryInfo = await client.query(
            `SELECT d.school_id, d.catering_id, s.name as school_name, c.name as catering_name
             FROM deliveries d
             JOIN schools s ON d.school_id = s.id
             JOIN caterings c ON d.catering_id = c.id
             WHERE d.id = $1`,
            [deliveryId]
          );

          if (deliveryInfo.rows.length > 0) {
            const { school_id, catering_id, school_name, catering_name } = deliveryInfo.rows[0];

            // Broadcast to public dashboard (real-time feed)
            broadcast('blockchain:fundReleased', {
              type: 'FundReleased',
              escrowId,
              amount: ethers.utils.formatEther(amount),
              payee,
              schoolName: school_name,
              cateringName: catering_name,
              txHash: event.transactionHash,
              blockNumber: event.blockNumber,
              timestamp: new Date().toISOString()
            });

            // Notify catering (payment received!)
            emitToCatering(catering_id, 'payment:received', {
              deliveryId,
              amount: ethers.utils.formatEther(amount),
              txHash: event.transactionHash,
              message: `Pembayaran sebesar ${ethers.utils.formatEther(amount)} ETH telah diterima!`
            });

            // Notify school (confirmation)
            emitToSchool(school_id, 'verification:confirmed', {
              deliveryId,
              message: 'Verifikasi berhasil, dana telah dicairkan ke katering'
            });

            // Notify admins
            emitToAdmins('escrow:released', {
              escrowId,
              deliveryId,
              amount: ethers.utils.formatEther(amount),
              schoolName: school_name,
              cateringName: catering_name
            });
          }
        }

        await client.query('COMMIT');
        console.log('✅ Database updated for FundReleased event');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('❌ Error handling FundReleased event:', error.message);
    }
  });

  // Listen to FundCancelled event
  contract.on('FundCancelled', async (escrowId: any, payer: any, amount: any, reason: any, event: any) => {
    try {
      console.log('\n🚫 FundCancelled event detected!');
      console.log(`  Escrow ID: ${escrowId}`);
      console.log(`  Payer: ${payer}`);
      console.log(`  Amount: ${ethers.utils.formatEther(amount)} ETH`);
      console.log(`  Reason: ${reason}`);
      console.log(`  Block: ${event.blockNumber}`);
      console.log(`  TX Hash: ${event.transactionHash}`);

      // Start a transaction
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // 1. Update escrow_transactions
        await client.query(
          `UPDATE escrow_transactions
           SET status = 'failed',
               tx_hash = $1,
               block_number = $2,
               updated_at = NOW()
           WHERE escrow_id = $3`,
          [event.transactionHash, event.blockNumber, escrowId]
        );

        // 2. Get delivery_id and update to cancelled
        const escrowResult = await client.query(
          'SELECT delivery_id FROM escrow_transactions WHERE escrow_id = $1',
          [escrowId]
        );

        if (escrowResult.rows.length > 0) {
          const deliveryId = escrowResult.rows[0].delivery_id;

          await client.query(
            `UPDATE deliveries
             SET status = 'cancelled',
                 notes = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [reason, deliveryId]
          );

          console.log(`  Delivery #${deliveryId} marked as cancelled`);
        }

        await client.query('COMMIT');
        console.log('✅ Database updated for FundCancelled event');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('❌ Error handling FundCancelled event:', error.message);
    }
  });

  console.log('✅ Blockchain listener started successfully!');
  console.log('   Listening for: FundLocked, FundReleased, FundCancelled');
}

/**
 * Stop listening to blockchain events
 */
export function stopBlockchainListener() {
  console.log('🛑 Stopping blockchain listener...');
  contract.removeAllListeners();
  console.log('✅ Blockchain listener stopped');
}

/**
 * Sync past events from blockchain (for historical data)
 * @param fromBlock Starting block number
 */
export async function syncPastEvents(fromBlock: number = 0) {
  try {
    console.log(`🔄 Syncing past events from block ${fromBlock}...`);

    const currentBlock = await blockchainService.provider.getBlockNumber();
    console.log(`  Current block: ${currentBlock}`);

    // Get past FundLocked events
    const lockedFilter = contract.filters.FundLocked?.();
    const lockedEvents = lockedFilter ? await contract.queryFilter(lockedFilter, fromBlock, currentBlock) : [];
    console.log(`  Found ${lockedEvents.length} FundLocked events`);

    // Get past FundReleased events
    const releasedFilter = contract.filters.FundReleased?.();
    const releasedEvents = releasedFilter ? await contract.queryFilter(releasedFilter, fromBlock, currentBlock) : [];
    console.log(`  Found ${releasedEvents.length} FundReleased events`);

    // Get past FundCancelled events
    const cancelledFilter = contract.filters.FundCancelled?.();
    const cancelledEvents = cancelledFilter ? await contract.queryFilter(cancelledFilter, fromBlock, currentBlock) : [];
    console.log(`  Found ${cancelledEvents.length} FundCancelled events`);

    console.log('✅ Past events synced successfully!');

    return {
      locked: lockedEvents.length,
      released: releasedEvents.length,
      cancelled: cancelledEvents.length
    };
  } catch (error: any) {
    console.error('❌ Error syncing past events:', error.message);
    throw error;
  }
}

export default {
  startBlockchainListener,
  stopBlockchainListener,
  syncPastEvents
};
