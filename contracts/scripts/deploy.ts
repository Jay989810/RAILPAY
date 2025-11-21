import { ethers } from "hardhat";

/**
 * Deployment script for RailPay contracts
 * 
 * Deployment Order:
 * 1. RailPayIdentity - No dependencies
 * 2. RailPayReceipt - No dependencies
 * 3. RailPayTicket - No dependencies
 * 4. RailPassSubscription - No dependencies
 * 5. RailPayPayments - Depends on RailPayReceipt
 * 
 * All contracts are deployed with the deployer as the initial owner.
 * The operator wallet for RailPayPayments is set to the deployer address
 * (can be changed later if needed).
 */

async function main() {
  console.log("Starting RailPay contract deployment...\n");

  // Check if we're deploying to Sepolia and validate environment variables
  const networkName = process.env.HARDHAT_NETWORK || "hardhat";
  
  if (networkName === "sepolia") {
    if (!process.env.RPC_URL) {
      console.error("❌ Error: RPC_URL environment variable is required for Sepolia deployment");
      console.error("\nPlease create a .env file in the contracts directory with:");
      console.error("  RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID");
      console.error("  PRIVATE_KEY=your_private_key_without_0x");
      console.error("\nOr use a public Sepolia RPC:");
      console.error("  RPC_URL=https://rpc.sepolia.org");
      console.error("  RPC_URL=https://ethereum-sepolia-rpc.publicnode.com");
      process.exit(1);
    }
    if (!process.env.PRIVATE_KEY) {
      console.error("❌ Error: PRIVATE_KEY environment variable is required for Sepolia deployment");
      process.exit(1);
    }

    // Validate chain ID before proceeding
    try {
      const network = await ethers.provider.getNetwork();
      const expectedChainId = BigInt(11155111); // Sepolia chain ID
      
      if (network.chainId !== expectedChainId) {
        console.error("❌ Error: Chain ID mismatch!");
        console.error(`   Expected: ${expectedChainId} (Sepolia)`);
        console.error(`   Got: ${network.chainId} (${network.chainId === BigInt(1) ? 'Mainnet' : 'Unknown'})`);
        console.error("\nYour RPC_URL is pointing to the wrong network.");
        console.error("\nPlease update your .env file with a valid Sepolia RPC URL:");
        console.error("  RPC_URL=https://rpc.sepolia.org");
        console.error("  RPC_URL=https://ethereum-sepolia-rpc.publicnode.com");
        console.error("  RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID");
        console.error("  RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY");
        process.exit(1);
      }
      console.log(`✓ Connected to Sepolia (Chain ID: ${network.chainId})\n`);
    } catch (error: any) {
      console.error("❌ Error connecting to network:", error.message);
      console.error("\nPlease check your RPC_URL in the .env file");
      process.exit(1);
    }
  }

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. Deploy RailPayIdentity
  console.log("1. Deploying RailPayIdentity...");
  const RailPayIdentity = await ethers.getContractFactory("RailPayIdentity");
  const identity = await RailPayIdentity.deploy(deployer.address);
  await identity.waitForDeployment();
  const identityAddress = await identity.getAddress();
  console.log("   RailPayIdentity deployed to:", identityAddress);

  // 2. Deploy RailPayReceipt
  console.log("\n2. Deploying RailPayReceipt...");
  const RailPayReceipt = await ethers.getContractFactory("RailPayReceipt");
  const receipt = await RailPayReceipt.deploy();
  await receipt.waitForDeployment();
  const receiptAddress = await receipt.getAddress();
  console.log("   RailPayReceipt deployed to:", receiptAddress);

  // 3. Deploy RailPayTicket
  console.log("\n3. Deploying RailPayTicket...");
  const RailPayTicket = await ethers.getContractFactory("RailPayTicket");
  const ticket = await RailPayTicket.deploy(deployer.address);
  await ticket.waitForDeployment();
  const ticketAddress = await ticket.getAddress();
  console.log("   RailPayTicket deployed to:", ticketAddress);

  // 4. Deploy RailPassSubscription
  console.log("\n4. Deploying RailPassSubscription...");
  const RailPassSubscription = await ethers.getContractFactory("RailPassSubscription");
  const subscription = await RailPassSubscription.deploy(deployer.address);
  await subscription.waitForDeployment();
  const subscriptionAddress = await subscription.getAddress();
  console.log("   RailPassSubscription deployed to:", subscriptionAddress);

  // 5. Deploy RailPayPayments (depends on RailPayReceipt)
  console.log("\n5. Deploying RailPayPayments...");
  const RailPayPayments = await ethers.getContractFactory("RailPayPayments");
  // Using deployer address as operator wallet (can be changed later)
  const payments = await RailPayPayments.deploy(deployer.address, receiptAddress);
  await payments.waitForDeployment();
  const paymentsAddress = await payments.getAddress();
  console.log("   RailPayPayments deployed to:", paymentsAddress);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer:", deployer.address);
  console.log("\nContract Addresses:");
  console.log("  RailPayIdentity:     ", identityAddress);
  console.log("  RailPayReceipt:      ", receiptAddress);
  console.log("  RailPayTicket:       ", ticketAddress);
  console.log("  RailPassSubscription:", subscriptionAddress);
  console.log("  RailPayPayments:     ", paymentsAddress);
  console.log("=".repeat(60));

  // Save deployment info (optional - can be extended to save to a file)
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      RailPayIdentity: identityAddress,
      RailPayReceipt: receiptAddress,
      RailPayTicket: ticketAddress,
      RailPassSubscription: subscriptionAddress,
      RailPayPayments: paymentsAddress,
    },
    timestamp: new Date().toISOString(),
  };

  console.log("\nDeployment info (JSON):");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

