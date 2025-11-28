// @ts-nocheck
import { ethers } from 'ethers';
import { escrowContract, wallet } from '../config/blockchain.js';
import { supabase } from '../config/database.js';

/**
 * Release escrow funds to catering after school verification
 * @param deliveryId - Delivery ID yang sudah diverifikasi
 * @returns Transaction hash atau error
 */
export async function releaseEscrowForDelivery(deliveryId: number) {
  console.log('\n📤 ====== RELEASE ESCROW FUNCTION START ======');
  console.log('Input params:', { deliveryId });

  try {
    // Check blockchain configuration
    console.log('\n📡 Checking blockchain configuration...');
    if (!escrowContract || !wallet) {
      console.error('❌ Blockchain not configured!');
      console.log('   escrowContract:', !!escrowContract);
      console.log('   wallet:', !!wallet);
      throw new Error('Blockchain not configured. Check BLOCKCHAIN_RPC_URL and SERVICE_WALLET_PRIVATE_KEY in .env');
    }
    console.log('✅ Blockchain configured');
    console.log('   Wallet address:', wallet.address);

    // Get escrow transaction for this delivery
    console.log('\n🔍 Searching for locked escrow...');
    console.log('   delivery_id:', deliveryId);
    console.log('   escrow_status: locked');

    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select(`
        *,
        deliveries!inner(catering_id),
        caterings!inner(wallet_address)
      `)
      .eq('delivery_id', deliveryId)
      .eq('escrow_status', 'locked')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (escrowError || !escrow) {
      console.error('❌ No locked escrow found!');
      console.log('   Query error:', escrowError);
      console.log('   Query result:', escrow);
      throw new Error('No locked escrow found for this delivery');
    }

    console.log('✅ Locked escrow found:');
    console.log('   Escrow ID (DB):', escrow.id);
    console.log('   Amount:', escrow.amount);
    console.log('   Catering wallet:', escrow.caterings.wallet_address);
    console.log('   Locked at:', escrow.locked_at);

    // Generate escrow ID (same format as when locking)
    console.log('\n🔑 Generating escrow ID hash...');
    const escrowId = ethers.utils.id(`delivery-${deliveryId}-${escrow.id}`);
    console.log('   Escrow ID (hash):', escrowId);

    console.log('\n📤 ====== BLOCKCHAIN TRANSACTION ======');
    console.log('   Escrow ID:', escrowId);
    console.log('   Amount:', escrow.amount, 'IDR');
    console.log('   Payee (Catering Wallet):', escrow.caterings.wallet_address);

    // Call releaseFund on smart contract with gas configuration
    console.log('\n📤 Sending release transaction to blockchain...');
    const tx = await escrowContract.releaseFund(escrowId, {
      gasLimit: 200000 // Set reasonable gas limit for release transactions
    });
    console.log('✅ Transaction sent!');
    console.log('   Transaction Hash:', tx.hash);
    console.log('   Waiting for confirmation...');

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!');
    console.log('   Block Number:', receipt.blockNumber);
    console.log('   Gas Used:', receipt.gasUsed?.toString());

    // Update escrow transaction in database
    console.log('\n💾 Updating escrow record...');
    const updateData = {
      escrow_status: 'released',
      released_at: new Date().toISOString(),
      tx_hash: receipt.transactionHash,
      blockchain_block_number: receipt.blockNumber
    };
    console.log('   Update data:', updateData);

    const { error: updateError } = await supabase
      .from('escrow_transactions')
      .update(updateData)
      .eq('id', escrow.id);

    if (updateError) {
      console.error('❌ Failed to update escrow record:', updateError);
      throw updateError;
    }
    console.log('✅ Escrow record updated');

    const result = {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      escrowId: escrowId,
      amount: escrow.amount
    };

    console.log('\n✅ ====== RELEASE ESCROW COMPLETE ======');
    console.log('Result:', result);
    console.log('💰 Funds released to catering wallet!');
    console.log('========================================\n');

    return result;

  } catch (error) {
    console.log('\n❌ ====== RELEASE ESCROW FAILED ======');
    console.error('Error details:', error);

    // Update escrow status to failed if there's an error
    console.log('\n⚠️  Marking escrow as cancelled...');
    await supabase
      .from('escrow_transactions')
      .update({
        escrow_status: 'cancelled'
      })
      .eq('delivery_id', deliveryId)
      .eq('escrow_status', 'locked')
      .then(({ error: err }) => {
        if (err) {
          console.error('❌ Failed to update escrow status:', err);
        } else {
          console.log('✅ Escrow marked as cancelled');
        }
      });

    console.log('====================================\n');
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
  console.log('\n🔐 ====== LOCK ESCROW FUNCTION START ======');
  console.log('Input params:', { deliveryId, cateringId, schoolId, amount });

  let escrowRecordId: number | null = null; // Track for rollback

  try {
    // Check blockchain configuration
    console.log('\n📡 Checking blockchain configuration...');
    if (!escrowContract || !wallet) {
      console.error('❌ Blockchain not configured!');
      console.log('   escrowContract:', !!escrowContract);
      console.log('   wallet:', !!wallet);
      throw new Error('Blockchain not configured');
    }
    console.log('✅ Blockchain configured');
    console.log('   Wallet address:', wallet.address);

    // Get catering wallet address
    console.log('\n👨‍🍳 Fetching catering wallet address...');
    const { data: catering, error: cateringError } = await supabase
      .from('caterings')
      .select('wallet_address')
      .eq('id', cateringId)
      .single();

    if (cateringError || !catering) {
      console.error('❌ Catering not found:', cateringError);
      throw new Error('Catering not found');
    }
    console.log('✅ Catering found:', { id: cateringId, wallet_address: catering.wallet_address });

    // Get school NPSN
    console.log('\n🏫 Fetching school NPSN...');
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('npsn')
      .eq('id', schoolId)
      .single();

    if (schoolError || !school) {
      console.error('❌ School not found:', schoolError);
      throw new Error('School not found');
    }
    console.log('✅ School found:', { id: schoolId, npsn: school.npsn });

    const { wallet_address: payee } = catering;
    const { npsn } = school;

    // Check for duplicate escrow
    console.log('\n🔍 Checking for duplicate escrow...');
    const { data: existingEscrow, error: duplicateCheckError } = await supabase
      .from('escrow_transactions')
      .select('id, escrow_status')
      .eq('delivery_id', deliveryId)
      .eq('escrow_status', 'locked')
      .maybeSingle();

    if (duplicateCheckError) {
      console.error('❌ Error checking for duplicate escrow:', duplicateCheckError);
      throw new Error('Failed to check for duplicate escrow');
    }

    if (existingEscrow) {
      console.error('❌ Duplicate escrow found! Escrow already exists for this delivery');
      throw new Error(`Escrow already exists for delivery ${deliveryId} (escrow_id: ${existingEscrow.id})`);
    }
    console.log('✅ No duplicate escrow found');

    // Create escrow transaction record first
    console.log('\n💾 Creating escrow transaction record in database...');
    const escrowData = {
      delivery_id: deliveryId,
      school_id: schoolId,
      catering_id: cateringId,
      amount: amount,
      escrow_status: 'locked',
      locked_at: new Date().toISOString(),
      transaction_type: 'LOCK',
      status: 'PENDING',
      executed_at: new Date().toISOString()
    };
    console.log('   Escrow data:', escrowData);

    const { data: escrowRecord, error: insertError } = await supabase
      .from('escrow_transactions')
      .insert(escrowData)
      .select('id')
      .single();

    if (insertError || !escrowRecord) {
      console.error('❌ Failed to create escrow record:', insertError);
      throw new Error('Failed to create escrow transaction record');
    }
    console.log('✅ Escrow record created:', { escrow_id: escrowRecord.id });

    escrowRecordId = escrowRecord.id;

    // Generate unique escrow ID
    console.log('\n🔑 Generating unique escrow ID...');
    const escrowId = ethers.utils.id(`delivery-${deliveryId}-${escrowRecordId}`);
    console.log('   Escrow ID (hash):', escrowId);

    // Convert amount to wei with precision
    // Using fixed conversion: 1 IDR = 10^12 wei (to avoid floating point precision loss)
    const IDR_TO_WEI_MULTIPLIER = ethers.BigNumber.from(10).pow(12);
    const amountInWei = ethers.BigNumber.from(Math.floor(amount)).mul(IDR_TO_WEI_MULTIPLIER);

    console.log('\n💰 Amount conversion:');
    console.log('   Original amount:', amount, 'IDR');
    console.log('   Conversion rate: 1 IDR = 10^12 wei');
    console.log('   Amount in Wei:', amountInWei.toString());
    console.log('   Verification: Wei / 10^12 =', amountInWei.div(IDR_TO_WEI_MULTIPLIER).toString(), 'IDR');

    console.log('\n🔒 ====== BLOCKCHAIN TRANSACTION ======');
    console.log('   Escrow ID:', escrowId);
    console.log('   Payee (Catering Wallet):', payee);
    console.log('   School NPSN:', npsn);
    console.log('   Amount in Wei:', amountInWei.toString());

    // Call lockFund on smart contract with gas configuration
    console.log('\n📤 Sending transaction to blockchain...');
    const tx = await escrowContract.lockFund(escrowId, payee, npsn, {
      value: amountInWei,
      gasLimit: 300000 // Set reasonable gas limit to prevent out-of-gas errors
    });
    console.log('✅ Transaction sent!');
    console.log('   Transaction Hash:', tx.hash);
    console.log('   Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!');
    console.log('   Block Number:', receipt.blockNumber);
    console.log('   Gas Used:', receipt.gasUsed?.toString());

    // Update escrow transaction with blockchain details
    console.log('\n💾 Updating escrow record with blockchain details...');
    const updateData = {
      tx_hash: receipt.transactionHash,
      blockchain_block_number: receipt.blockNumber,
      blockchain_confirmed: true,
      status: 'CONFIRMED'
    };
    console.log('   Update data:', updateData);

    const { error: updateError } = await supabase
      .from('escrow_transactions')
      .update(updateData)
      .eq('id', escrowRecordId);

    if (updateError) {
      console.error('❌ Failed to update escrow record:', updateError);
      throw updateError;
    }
    console.log('✅ Escrow record updated');

    const result = {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      escrowId: escrowId
    };

    console.log('\n✅ ====== LOCK ESCROW COMPLETE ======');
    console.log('Result:', result);
    console.log('======================================\n');

    return result;

  } catch (error) {
    console.log('\n❌ ====== LOCK ESCROW FAILED ======');
    console.error('Error details:', error);

    // Rollback: Delete escrow record if blockchain transaction failed
    if (escrowRecordId) {
      console.log('\n⏪ Rolling back database changes...');
      console.log(`   Deleting escrow record ${escrowRecordId}...`);

      const { error: deleteError } = await supabase
        .from('escrow_transactions')
        .delete()
        .eq('id', escrowRecordId);

      if (deleteError) {
        console.error('❌ Failed to rollback escrow record:', deleteError);
        console.error('⚠️  WARNING: Database may be out of sync! Manual cleanup required.');
      } else {
        console.log('✅ Escrow record rolled back successfully');
      }
    }

    console.log('====================================\n');
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
