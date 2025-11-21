# Complete Environment Variables Guide for RailPay

This document lists **ALL** environment variables needed to run RailPay in production.

---

## 📋 Overview

RailPay requires environment variables in **3 different places**:

1. **Next.js Frontend** (`.env.local` file in project root)
2. **Supabase Edge Functions** (Set in Supabase Dashboard)
3. **Smart Contract Deployment** (`.env` file in `contracts/` folder - optional, only for deployment)

---

## 1️⃣ Next.js Frontend Environment Variables

**Location:** Create `.env.local` file in the project root (`C:\Users\DELL\Desktop\NEW VERSION RAILPAY\.env.local`)

### Required Variables:

```env
# Supabase Configuration (Required)
# Get these from: https://supabase.com/dashboard → Your Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# WalletConnect Configuration (Required for wallet connections)
# Get this from: https://cloud.walletconnect.com → Create a project
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

### How to Get These Values:

#### NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY
1. Go to https://supabase.com/dashboard
2. Select your RailPay project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
1. Go to https://cloud.walletconnect.com
2. Sign up / Log in
3. Create a new project (or use existing)
4. Copy the **Project ID**
5. Paste it as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

---

## 2️⃣ Supabase Edge Functions Environment Variables

**Location:** Set in Supabase Dashboard → Project Settings → Edge Functions → Secrets

### Required Variables:

```env
# Supabase Internal (Auto-provided by Supabase, but verify they exist)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Blockchain Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
BLOCKCHAIN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Smart Contract Addresses (After deploying contracts)
CONTRACT_RAILPAY_IDENTITY=0x1234567890123456789012345678901234567890
CONTRACT_RAILPAY_TICKET=0x2345678901234567890123456789012345678901
CONTRACT_RAILPASS_SUBSCRIPTION=0x3456789012345678901234567890123456789012
CONTRACT_RAILPAY_RECEIPT=0x4567890123456789012345678901234567890123
CONTRACT_RAILPAY_PAYMENTS=0x5678901234567890123456789012345678901234
```

### How to Get These Values:

#### SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY
1. Go to https://supabase.com/dashboard
2. Select your RailPay project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (⚠️ Keep this secret!) → `SUPABASE_SERVICE_ROLE_KEY`

#### SEPOLIA_RPC_URL
1. Sign up at https://infura.io (free)
2. Create a new project
3. Select "Sepolia" network
4. Copy your **Project ID**
5. Format: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

**Alternative RPC Providers:**
- Alchemy: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
- QuickNode: Use your QuickNode Sepolia endpoint URL

#### BLOCKCHAIN_PRIVATE_KEY
1. Use a wallet you control (MetaMask, etc.)
2. Export the private key (⚠️ Keep this secret!)
3. Must start with `0x` and be 66 characters
4. Make sure this wallet has Sepolia ETH for gas fees
5. Get free testnet ETH from: https://sepoliafaucet.com

#### Contract Addresses
1. Deploy your contracts to Sepolia (see `HOW_TO_GET_CONTRACT_ADDRESSES.md`)
2. Copy addresses from deployment output
3. Each address must start with `0x` and be 42 characters

---

## 3️⃣ Smart Contract Deployment Environment Variables (Optional)

**Location:** Create `.env` file in `contracts/` folder (only needed for deploying contracts)

```env
# Wallet for deployment
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# RPC URL for deployment
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Etherscan API Key (optional, for contract verification)
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

**Note:** This is only needed when deploying contracts. Once deployed, you don't need this file for running the app.

---

## 📝 Quick Setup Checklist

### Frontend (.env.local)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

### Supabase Edge Functions (Dashboard Secrets)
- [ ] `SUPABASE_URL` (usually auto-set)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (usually auto-set)
- [ ] `SEPOLIA_RPC_URL`
- [ ] `BLOCKCHAIN_PRIVATE_KEY`
- [ ] `CONTRACT_RAILPAY_IDENTITY`
- [ ] `CONTRACT_RAILPAY_TICKET`
- [ ] `CONTRACT_RAILPASS_SUBSCRIPTION`
- [ ] `CONTRACT_RAILPAY_RECEIPT`
- [ ] `CONTRACT_RAILPAY_PAYMENTS`

---

## 🔒 Security Best Practices

1. **Never commit `.env.local` to version control**
   - Add `.env.local` to `.gitignore`
   - Use `.env.example` as a template (without real values)

2. **Keep private keys secure**
   - Never share `BLOCKCHAIN_PRIVATE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
   - Use different wallets for development and production
   - Rotate keys periodically

3. **Use environment-specific values**
   - Development: Use testnet contracts and test wallets
   - Production: Use mainnet contracts and production wallets

4. **Verify Supabase secrets are set**
   - Check Supabase Dashboard → Edge Functions → Secrets
   - All 7 blockchain-related secrets should be visible (values hidden)

---

## 🚀 Deployment Steps

### Step 1: Set Up Frontend Environment Variables
1. Create `.env.local` in project root
2. Add all `NEXT_PUBLIC_*` variables
3. Restart Next.js dev server: `npm run dev`

### Step 2: Set Up Supabase Edge Functions Secrets
1. Go to Supabase Dashboard
2. Navigate to Project Settings → Edge Functions → Secrets
3. Add all 7 blockchain-related secrets
4. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (usually auto-set)

### Step 3: Deploy Contracts (If Not Already Deployed)
1. Navigate to `contracts/` folder
2. Create `.env` file with deployment variables
3. Run: `npx hardhat run scripts/deploy.ts --network sepolia`
4. Copy contract addresses to Supabase secrets

### Step 4: Deploy Edge Functions
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Deploy functions: `supabase functions deploy <function-name>`

### Step 5: Test Everything
1. Test frontend connection to Supabase
2. Test wallet connection
3. Test Edge Functions (verify they can access blockchain)
4. Check Edge Function logs in Supabase Dashboard

---

## 🐛 Troubleshooting

### Error: "Supabase environment variables are not set"
- Check `.env.local` file exists in project root
- Verify variable names start with `NEXT_PUBLIC_`
- Restart Next.js dev server after adding variables

### Error: "SEPOLIA_RPC_URL environment variable is not set"
- Check Supabase Dashboard → Edge Functions → Secrets
- Verify the secret name is exactly `SEPOLIA_RPC_URL`
- Redeploy Edge Functions after adding secrets

### Error: "Contract not found"
- Verify contract addresses are correct (42 characters, starts with `0x`)
- Check contracts are deployed to Sepolia
- Verify addresses in Supabase secrets match deployment output

### Error: "Invalid private key"
- Private key must start with `0x`
- Must be 66 characters total (including `0x`)
- No spaces or newlines

### WalletConnect not working
- Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
- Check WalletConnect project is active
- Clear browser cache and try again

---

## 📚 Additional Resources

- **Supabase Setup:** See `supabase/env-setup-guide.md`
- **Contract Deployment:** See `HOW_TO_GET_CONTRACT_ADDRESSES.md`
- **Supabase Docs:** https://supabase.com/docs
- **WalletConnect Docs:** https://docs.walletconnect.com
- **Infura Docs:** https://docs.infura.io

---

## 📋 Summary Table

| Variable | Location | Required | Where to Get |
|----------|----------|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | ✅ Yes | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | ✅ Yes | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | `.env.local` | ✅ Yes | WalletConnect Cloud |
| `SUPABASE_URL` | Supabase Secrets | ✅ Yes | Supabase Dashboard (auto-set) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secrets | ✅ Yes | Supabase Dashboard (auto-set) |
| `SEPOLIA_RPC_URL` | Supabase Secrets | ✅ Yes | Infura/Alchemy/QuickNode |
| `BLOCKCHAIN_PRIVATE_KEY` | Supabase Secrets | ✅ Yes | Your wallet (export private key) |
| `CONTRACT_RAILPAY_IDENTITY` | Supabase Secrets | ✅ Yes | After deploying contracts |
| `CONTRACT_RAILPAY_TICKET` | Supabase Secrets | ✅ Yes | After deploying contracts |
| `CONTRACT_RAILPASS_SUBSCRIPTION` | Supabase Secrets | ✅ Yes | After deploying contracts |
| `CONTRACT_RAILPAY_RECEIPT` | Supabase Secrets | ✅ Yes | After deploying contracts |
| `CONTRACT_RAILPAY_PAYMENTS` | Supabase Secrets | ✅ Yes | After deploying contracts |

---

**Total Required Variables: 12**

- **3** for Next.js frontend (`.env.local`)
- **9** for Supabase Edge Functions (Dashboard Secrets)


