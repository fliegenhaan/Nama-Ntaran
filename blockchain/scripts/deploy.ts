import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

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

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    contractAddress: escrowSystem.address,
    adminAddress: deployer.address,
    network: network.name,
    chainId: network.chainId,
    deployedAt: new Date().toISOString(),
    transactionHash: escrowSystem.deployTransaction.hash
  };

  // Create deployments directory
  const deploymentDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  // Save deployment info
  const networkName = network.chainId === 31337 ? "localhost" : network.name;
  const deploymentPath = path.join(deploymentDir, `${networkName}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📄 Deployment info saved to: ${deploymentPath}`);

  // Save ABI
  const abiPath = path.join(deploymentDir, "EscrowSystem.abi.json");
  fs.writeFileSync(abiPath, JSON.stringify(EscrowSystem.interface.format("json"), null, 2));
  console.log(`📋 ABI saved to: ${abiPath}`);

  console.log("\n📋 IMPORTANT: Add this to backend/.env:");
  console.log(`ESCROW_CONTRACT_ADDRESS=${escrowSystem.address}`);
  console.log(`SERVICE_WALLET_ADDRESS=${deployer.address}`);
  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });