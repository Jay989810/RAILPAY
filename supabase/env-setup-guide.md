# Environment Variables Setup Guide

## Quick Setup (Supabase Dashboard)

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Project Settings** → **Edge Functions** → **Secrets**
4. Add each secret one by one:

### Required Secrets:

```
Name: SEPOLIA_RPC_URL
Value: https://sepolia.infura.io/v3/YOUR_INFURA_KEY
```

```
Name: BLOCKCHAIN_PRIVATE_KEY
Value: 0xYOUR_PRIVATE_KEY_HERE
```

```
Name: CONTRACT_RAILPAY_IDENTITY
Value: 0xYOUR_CONTRACT_ADDRESS
```

```
Name: CONTRACT_RAILPAY_TICKET
Value: 0xYOUR_CONTRACT_ADDRESS
```

```
Name: CONTRACT_RAILPASS_SUBSCRIPTION
Value: 0xYOUR_CONTRACT_ADDRESS
```

```
Name: CONTRACT_RAILPAY_RECEIPT
Value: 0xYOUR_CONTRACT_ADDRESS
```

```
Name: CONTRACT_RAILPAY_PAYMENTS
Value: 0xYOUR_CONTRACT_ADDRESS
```

## Getting Your Values

### 1. SEPOLIA_RPC_URL
- Sign up at https://infura.io (free)
- Create a project
- Copy your project ID
- Format: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

### 2. BLOCKCHAIN_PRIVATE_KEY
- Use a wallet you control (MetaMask, etc.)
- Export private key (keep it secret!)
- Must start with `0x` and be 66 characters
- Get Sepolia ETH from faucets for gas fees

### 3. Contract Addresses

**To get contract addresses, you need to deploy your smart contracts first:**

1. **Navigate to contracts folder:**
   ```bash
   cd contracts
   ```

2. **Deploy contracts to Sepolia:**
   ```bash
   npx hardhat run scripts/deploy.ts --network sepolia
   ```
   
   Or if you don't have a deploy script, use Hardhat console:
   ```bash
   npx hardhat console --network sepolia
   ```
   Then deploy each contract manually (see `HOW_TO_GET_CONTRACT_ADDRESSES.md` for details)

3. **Copy the addresses from deployment output:**
   ```
   RailPayIdentity deployed to: 0x1234...
   RailPayReceipt deployed to: 0x2345...
   RailPayTicket deployed to: 0x3456...
   RailPassSubscription deployed to: 0x4567...
   RailPayPayments deployed to: 0x5678...
   ```

4. **Use these addresses in Supabase secrets:**
   - `CONTRACT_RAILPAY_IDENTITY` = RailPayIdentity address
   - `CONTRACT_RAILPAY_RECEIPT` = RailPayReceipt address
   - `CONTRACT_RAILPAY_TICKET` = RailPayTicket address
   - `CONTRACT_RAILPASS_SUBSCRIPTION` = RailPassSubscription address
   - `CONTRACT_RAILPAY_PAYMENTS` = RailPayPayments address

**📖 For detailed deployment instructions, see: `HOW_TO_GET_CONTRACT_ADDRESSES.md`**

**Note:** All addresses must start with `0x` and be 42 characters long

## After Setting Secrets

1. Redeploy your Edge Functions (if already deployed)
2. Test with a simple function call
3. Check logs in Supabase Dashboard for any errors

