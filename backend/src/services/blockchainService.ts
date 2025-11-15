import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load ABI
const abiPath = path.join(__dirname, '../contracts/EscrowSystem.abi.json');
const contractABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

// Configuration
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
const PRIVATE_KEY = process.env.SERVICE_WALLET_PRIVATE_KEY || '';
const CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS || '';

if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error('Missing blockchain configuration in .env file');
}

// Setup provider and signer
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const escrowContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

/**
 * Generate unique escrow ID from delivery data
 */
export function generateEscrowId(deliveryId: number, schoolId: number, cateringId: number): string {
  const data = ethers.utils.defaultAbiCoder.encode(
    ['uint256', 'uint256', 'uint256', 'uint256'],
    [deliveryId, schoolId, cateringId, Date.now()]
  );
  return ethers.utils.keccak256(data);
}

/**
 * Lock funds into escrow
 * @param escrowId Unique identifier for the escrow
 * @param cateringWalletAddress Wallet address of the catering service
 * @param schoolNPSN NPSN of the school
 * @param amountInRupiah Amount in Rupiah (will be converted to Wei)
 */
export async function lockFundToEscrow(
  escrowId: string,
  cateringWalletAddress: string,
  schoolNPSN: string,
  amountInRupiah: number
): Promise<{
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  error?: string;
}> {
  try {
    console.log(`🔒 Locking fund to escrow...`);
    console.log(`  Escrow ID: ${escrowId}`);
    console.log(`  Catering: ${cateringWalletAddress}`);
    console.log(`  School NPSN: ${schoolNPSN}`);
    console.log(`  Amount: Rp ${amountInRupiah.toLocaleString()}`);

    // Convert Rupiah to Wei (simplified - 1 Rupiah = 1 Wei for testing)
    // In production, you'd use a proper conversion rate
    const amountInWei = ethers.utils.parseEther((amountInRupiah / 1000000).toString());

    // Call smart contract
    const tx = await escrowContract.lockFund(
      escrowId,
      cateringWalletAddress,
      schoolNPSN,
      { value: amountInWei }
    );

    console.log(`  Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log(`✅ Fund locked successfully!`);
    console.log(`  Block: ${receipt.blockNumber}`);
    console.log(`  Gas used: ${receipt.gasUsed.toString()}`);

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    };
  } catch (error: any) {
    console.error('❌ Error locking fund:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Release funds from escrow to catering
 * @param escrowId Unique identifier for the escrow
 */
export async function releaseFundFromEscrow(
  escrowId: string
): Promise<{
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  error?: string;
}> {
  try {
    console.log(`🔓 Releasing fund from escrow...`);
    console.log(`  Escrow ID: ${escrowId}`);

    // Call smart contract
    const tx = await escrowContract.releaseFund(escrowId);

    console.log(`  Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log(`✅ Fund released successfully!`);
    console.log(`  Block: ${receipt.blockNumber}`);
    console.log(`  Gas used: ${receipt.gasUsed.toString()}`);

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    };
  } catch (error: any) {
    console.error('❌ Error releasing fund:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Cancel escrow and refund to payer
 * @param escrowId Unique identifier for the escrow
 * @param reason Reason for cancellation
 */
export async function cancelEscrow(
  escrowId: string,
  reason: string
): Promise<{
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  error?: string;
}> {
  try {
    console.log(`❌ Cancelling escrow...`);
    console.log(`  Escrow ID: ${escrowId}`);
    console.log(`  Reason: ${reason}`);

    // Call smart contract
    const tx = await escrowContract.cancelEscrow(escrowId, reason);

    console.log(`  Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log(`✅ Escrow cancelled successfully!`);
    console.log(`  Block: ${receipt.blockNumber}`);

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    };
  } catch (error: any) {
    console.error('❌ Error cancelling escrow:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get escrow details from blockchain
 * @param escrowId Unique identifier for the escrow
 */
export async function getEscrowDetails(escrowId: string): Promise<{
  payer: string;
  payee: string;
  amount: string;
  isLocked: boolean;
  isReleased: boolean;
  schoolId: string;
} | null> {
  try {
    const escrow = await escrowContract.getEscrow(escrowId);

    return {
      payer: escrow.payer,
      payee: escrow.payee,
      amount: ethers.utils.formatEther(escrow.amount),
      isLocked: escrow.isLocked,
      isReleased: escrow.isReleased,
      schoolId: escrow.schoolId
    };
  } catch (error: any) {
    console.error('Error getting escrow details:', error.message);
    return null;
  }
}

/**
 * Get wallet balance
 * @param address Wallet address
 */
export async function getWalletBalance(address: string): Promise<string> {
  try {
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  } catch (error: any) {
    console.error('Error getting balance:', error.message);
    return '0';
  }
}

/**
 * Check if contract is deployed and accessible
 */
export async function checkContractHealth(): Promise<{
  healthy: boolean;
  contractAddress: string;
  adminAddress?: string;
  error?: string;
}> {
  try {
    const admin = await escrowContract.admin();
    return {
      healthy: true,
      contractAddress: CONTRACT_ADDRESS,
      adminAddress: admin
    };
  } catch (error: any) {
    return {
      healthy: false,
      contractAddress: CONTRACT_ADDRESS,
      error: error.message
    };
  }
}

export default {
  generateEscrowId,
  lockFundToEscrow,
  releaseFundFromEscrow,
  cancelEscrow,
  getEscrowDetails,
  getWalletBalance,
  checkContractHealth,
  contract: escrowContract,
  provider,
  signer
};
