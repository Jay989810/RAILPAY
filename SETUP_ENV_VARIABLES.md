# Setting Up Environment Variables for RailPay Edge Functions

This guide explains how to set environment variables for Supabase Edge Functions.

## Prerequisites

1. A Supabase project (create one at https://supabase.com)
2. Deployed smart contracts on Sepolia testnet
3. A Sepolia RPC endpoint (free options available)
4. A wallet private key with Sepolia ETH for gas fees

---

## Step-by-Step Guide

### Step 1: Get Your Sepolia RPC URL

You need an RPC endpoint to connect to Sepolia testnet. Free options:

**Option A: Infura**
1. Go to https://infura.io
2. Sign up for a free account
3. Create a new project
4. Copy your project ID
5. Use: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

**Option B: Alchemy**
1. Go to https://alchemy.com
2. Sign up for a free account
3. Create a new app (select Sepolia network)
4. Copy your API key
5. Use: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

**Option C: QuickNode**
1. Go to https://quicknode.com
2. Sign up and create a Sepolia endpoint
3. Copy the HTTP URL

### Step 2: Get Your Private Key

**⚠️ SECURITY WARNING:**
- Never share your private key
- Never commit it to version control
- Use a dedicated wallet for this project (not your main wallet)
- This wallet only needs Sepolia testnet ETH

**To get your private key:**
1. Use MetaMask or another wallet
2. Export the private key for a wallet you'll use for RailPay
3. Make sure this wallet has some Sepolia ETH (get free testnet ETH from faucets)

**Recommended: Create a new wallet specifically for RailPay**
```bash
# Using Node.js (if you have it installed)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Get Your Contract Addresses

After deploying your contracts (using Hardhat), you'll get addresses like:
```
RailPayIdentity:     0x1234...
RailPayTicket:       0x5678...
RailPassSubscription: 0x9abc...
RailPayReceipt:      0xdef0...
RailPayPayments:     0x2468...
```

Copy these addresses from your deployment output.

---

## Method 1: Using Supabase Dashboard (Easiest)

### Steps:

1. **Go to your Supabase project dashboard**
   - Visit https://supabase.com/dashboard
   - Select your RailPay project

2. **Navigate to Edge Functions settings**
   - Click on **Project Settings** (gear icon in sidebar)
   - Click on **Edge Functions** in the left menu
   - Scroll down to the **Secrets** section

3. **Add each environment variable**
   - Click **"Add new secret"** or **"New secret"**
   - Enter the name: `SEPOLIA_RPC_URL`
   - Enter the value: Your RPC URL (e.g., `https://sepolia.infura.io/v3/YOUR_KEY`)
   - Click **"Save"** or **"Add secret"**

4. **Repeat for all variables:**
   ```
   SEPOLIA_RPC_URL
   BLOCKCHAIN_PRIVATE_KEY
   CONTRACT_RAILPAY_IDENTITY
   CONTRACT_RAILPAY_TICKET
   CONTRACT_RAILPASS_SUBSCRIPTION
   CONTRACT_RAILPAY_RECEIPT
   CONTRACT_RAILPAY_PAYMENTS
   ```

5. **Verify your secrets**
   - You should see all 7 secrets listed
   - Note: The values are hidden for security (showing as `••••••••`)

---

## Method 2: Using Supabase CLI

If you prefer using the command line:

### Prerequisites:
- Install Supabase CLI: `npm install -g supabase`
- Login: `supabase login`
- Link your project: `supabase link --project-ref YOUR_PROJECT_REF`

### Steps:

1. **Create a `.env` file** (already created as `.env.example`)
   ```bash
   cp supabase/.env.example supabase/.env
   ```

2. **Edit `.env` file** with your actual values
   ```env
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   BLOCKCHAIN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
   CONTRACT_RAILPAY_IDENTITY=0x...
   CONTRACT_RAILPAY_TICKET=0x...
   CONTRACT_RAILPASS_SUBSCRIPTION=0x...
   CONTRACT_RAILPAY_RECEIPT=0x...
   CONTRACT_RAILPAY_PAYMENTS=0x...
   ```

3. **Set all secrets at once**
   ```bash
   supabase secrets set --env-file supabase/.env
   ```

   Or set them individually:
   ```bash
   supabase secrets set SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   supabase secrets set BLOCKCHAIN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
   # ... etc
   ```

4. **Verify secrets are set**
   ```bash
   supabase secrets list
   ```

---

## Method 3: Using Supabase Management API

For automation/CI/CD, you can use the Management API:

```bash
curl -X POST 'https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/secrets' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SEPOLIA_RPC_URL",
    "value": "https://sepolia.infura.io/v3/YOUR_KEY"
  }'
```

---

## Verification

After setting all variables, verify they're working:

1. **Deploy a test Edge Function** or redeploy an existing one
2. **Check the function logs** in Supabase Dashboard
3. **Test a function** that uses blockchain (e.g., `create-ticket`)
4. **Check for errors** - if variables are missing, you'll see errors in logs

---

## Troubleshooting

### Error: "Environment variable not set"
- Double-check the variable name (case-sensitive)
- Make sure you saved the secret in Supabase Dashboard
- Redeploy your Edge Functions after adding secrets

### Error: "Invalid RPC URL"
- Verify your RPC URL is correct
- Test the URL in a browser or with curl
- Make sure you're using Sepolia testnet URL

### Error: "Invalid private key"
- Make sure the private key starts with `0x`
- Verify it's 66 characters long (including `0x`)
- Don't include any spaces or newlines

### Error: "Contract not found"
- Verify contract addresses are correct
- Make sure contracts are deployed on Sepolia
- Check that addresses are in correct format (0x followed by 40 hex characters)

---

## Security Best Practices

1. ✅ **Never commit `.env` files** to version control
2. ✅ **Use different wallets** for development and production
3. ✅ **Rotate secrets** periodically
4. ✅ **Use Supabase's secret management** (don't hardcode in code)
5. ✅ **Limit access** to who can view/edit secrets
6. ✅ **Monitor usage** of your RPC endpoint

---

## Quick Reference

| Variable | Example | Description |
|----------|---------|-------------|
| `SEPOLIA_RPC_URL` | `https://sepolia.infura.io/v3/abc123` | RPC endpoint for Sepolia |
| `BLOCKCHAIN_PRIVATE_KEY` | `0x1234...` | Wallet private key (66 chars) |
| `CONTRACT_RAILPAY_IDENTITY` | `0x5678...` | Identity contract address |
| `CONTRACT_RAILPAY_TICKET` | `0x9abc...` | Ticket contract address |
| `CONTRACT_RAILPASS_SUBSCRIPTION` | `0xdef0...` | Pass contract address |
| `CONTRACT_RAILPAY_RECEIPT` | `0x2468...` | Receipt contract address |
| `CONTRACT_RAILPAY_PAYMENTS` | `0x1357...` | Payments contract address |

---

## Need Help?

- Supabase Docs: https://supabase.com/docs/guides/functions/secrets
- Supabase Discord: https://discord.supabase.com
- Check Edge Function logs in Supabase Dashboard for detailed error messages

