import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

  // Deploy EscrowSystem
  console.log("📦 Deploying EscrowSystem...");
  const EscrowSystem = await ethers.getContractFactory("EscrowSystem");
  const escrowSystem = await EscrowSystem.deploy();
  await escrowSystem.deployed();

  console.log("✅ EscrowSystem deployed to:", escrowSystem.address);
  console.log("🔑 Admin address:", await escrowSystem.admin());
  
  console.log("\n📋 IMPORTANT: Save this to backend/.env:");
  console.log(`ESCROW_CONTRACT_ADDRESS=${escrowSystem.address}`);
  console.log(`SERVICE_WALLET_ADDRESS=${deployer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });