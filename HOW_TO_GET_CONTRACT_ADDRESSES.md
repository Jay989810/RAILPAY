# How to Get Contract Addresses for RailPay

This guide explains how to deploy your smart contracts and get the addresses needed for environment variables.

## Prerequisites

1. **Node.js and npm** installed
2. **Hardhat** set up in your contracts folder
3. **Sepolia testnet ETH** in your wallet (for gas fees)
4. **Private key** of your deployment wallet

---

## Step 1: Navigate to Contracts Folder

```bash
cd contracts
```

---

## Step 2: Install Dependencies (if not already done)

```bash
npm install
```

---

## Step 3: Set Up Environment Variables for Hardhat

Create a `.env` file in the `contracts` folder:

```env
# Your wallet private key (the one with Sepolia ETH)
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Sepolia RPC URL (same one you'll use in Supabase)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Etherscan API key (optional, for verification)
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

---

## Step 4: Deploy Contracts to Sepolia

### Option A: Using Hardhat Deploy Script

If you have a deployment script:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### Option B: Manual Deployment

If you need to deploy manually, you can use Hardhat console:

```bash
npx hardhat console --network sepolia
```

Then deploy each contract:

```javascript
// Deploy RailPayIdentity
const RailPayIdentity = await ethers.getContractFactory("RailPayIdentity");
const identity = await RailPayIdentity.deploy("YOUR_OPERATOR_ADDRESS");
await identity.waitForDeployment();
const identityAddress = await identity.getAddress();
console.log("RailPayIdentity deployed to:", identityAddress);

// Deploy RailPayReceipt
const RailPayReceipt = await ethers.getContractFactory("RailPayReceipt");
const receipt = await RailPayReceipt.deploy();
await receipt.waitForDeployment();
const receiptAddress = await receipt.getAddress();
console.log("RailPayReceipt deployed to:", receiptAddress);

// Deploy RailPayTicket
const RailPayTicket = await ethers.getContractFactory("RailPayTicket");
const ticket = await RailPayTicket.deploy("YOUR_OPERATOR_ADDRESS");
await ticket.waitForDeployment();
const ticketAddress = await ticket.getAddress();
console.log("RailPayTicket deployed to:", ticketAddress);

// Deploy RailPassSubscription
const RailPassSubscription = await ethers.getContractFactory("RailPassSubscription");
const pass = await RailPassSubscription.deploy("YOUR_OPERATOR_ADDRESS");
await pass.waitForDeployment();
const passAddress = await pass.getAddress();
console.log("RailPassSubscription deployed to:", passAddress);

// Deploy RailPayPayments
const RailPayPayments = await ethers.getContractFactory("RailPayPayments");
const payments = await RailPayPayments.deploy("YOUR_OPERATOR_ADDRESS", receiptAddress);
await payments.waitForDeployment();
const paymentsAddress = await payments.getAddress();
console.log("RailPayPayments deployed to:", paymentsAddress);
```

---

## Step 5: Copy the Contract Addresses

After deployment, you'll see output like this:

```
RailPayIdentity deployed to: 0x1234567890123456789012345678901234567890
RailPayReceipt deployed to: 0x2345678901234567890123456789012345678901
RailPayTicket deployed to: 0x3456789012345678901234567890123456789012
RailPassSubscription deployed to: 0x4567890123456789012345678901234567890123
RailPayPayments deployed to: 0x5678901234567890123456789012345678901234
```

**Copy these addresses!** You'll need them for your Supabase environment variables.

---

## Step 6: Set Up Supabase Environment Variables

Go to your Supabase Dashboard → Project Settings → Edge Functions → Secrets

Add these secrets:

```
SEPOLIA_RPC_URL = https://sepolia.infura.io/v3/YOUR_INFURA_KEY
BLOCKCHAIN_PRIVATE_KEY = 0xYOUR_PRIVATE_KEY
CONTRACT_RAILPAY_IDENTITY = 0x1234567890123456789012345678901234567890
CONTRACT_RAILPAY_TICKET = 0x3456789012345678901234567890123456789012
CONTRACT_RAILPASS_SUBSCRIPTION = 0x4567890123456789012345678901234567890123
CONTRACT_RAILPAY_RECEIPT = 0x2345678901234567890123456789012345678901
CONTRACT_RAILPAY_PAYMENTS = 0x5678901234567890123456789012345678901234
```

---

## Step 7: Verify Contracts (Optional but Recommended)

Verify your contracts on Etherscan so others can read the source code:

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS "CONSTRUCTOR_ARG1" "CONSTRUCTOR_ARG2"
```

Example:
```bash
npx hardhat verify --network sepolia 0x1234567890123456789012345678901234567890 "0xYOUR_OPERATOR_ADDRESS"
```

---

## Quick Reference: Contract Deployment Order

1. **RailPayIdentity** - No dependencies
2. **RailPayReceipt** - No dependencies
3. **RailPayTicket** - No dependencies
4. **RailPassSubscription** - No dependencies
5. **RailPayPayments** - Depends on RailPayReceipt (needs receipt address)

---

## Troubleshooting

### Error: "Insufficient funds"
- Make sure your wallet has Sepolia ETH
- Get free testnet ETH from: https://sepoliafaucet.com

### Error: "Contract not found"
- Make sure you're deploying to Sepolia network
- Check your `hardhat.config.ts` network configuration

### Error: "Nonce too high"
- Wait a few seconds and try again
- Or manually set a higher nonce

### Can't find deployment script?
- Check if `scripts/deploy.ts` exists
- If not, use the manual deployment method above

---

## Save Your Addresses

**IMPORTANT:** Save all contract addresses in a safe place! You'll need them for:
- Supabase environment variables
- Frontend configuration
- Future contract interactions

Create a file like `deployment-addresses.json`:

```json
{
  "network": "sepolia",
  "deployedAt": "2024-01-02",
  "contracts": {
    "RailPayIdentity": "0x1234...",
    "RailPayReceipt": "0x2345...",
    "RailPayTicket": "0x3456...",
    "RailPassSubscription": "0x4567...",
    "RailPayPayments": "0x5678..."
  }
}
```

---

## Need Help?

- Check your `contracts/README.md` for specific deployment instructions
- Review Hardhat documentation: https://hardhat.org/docs
- Check Sepolia network status: https://sepolia.etherscan.io

