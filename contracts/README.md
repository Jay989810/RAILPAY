# RailPay Smart Contracts

Smart contract layer for the RailPay project - a blockchain-based rail ticket management system.

## Overview

This Hardhat project contains the core smart contracts for RailPay:

1. **RailPayIdentity.sol** - Registry of passengers and staff/admin roles
2. **RailPayTicket.sol** - ERC721 NFT representation of tickets
3. **RailPassSubscription.sol** - Pass system for daily/weekly/monthly subscriptions
4. **RailPayReceipt.sol** - Payment receipt registry (ERC8004-style)
5. **RailPayPayments.sol** - Flexible payment processing contract

## Technology Stack

- **Solidity**: ^0.8.20
- **Hardhat**: ^2.19.0
- **TypeScript**: ^5.3.3
- **OpenZeppelin Contracts**: ^5.0.0
- **Network**: Sepolia testnet (configurable)

## Project Structure

```
contracts/
├── contracts/          # Solidity source files
│   ├── RailPayIdentity.sol
│   ├── RailPayTicket.sol
│   ├── RailPassSubscription.sol
│   ├── RailPayReceipt.sol
│   └── RailPayPayments.sol
├── scripts/            # Deployment and utility scripts
│   └── deploy.ts
├── test/               # Test files (to be added)
├── hardhat.config.ts   # Hardhat configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Git

### Installation

1. Navigate to the contracts directory:
```bash
cd contracts
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the contracts directory (optional, for local development):
```env
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
```

**Note**: For security, never commit your `.env` file or private keys to version control.

## Configuration

### Network Configuration

The `hardhat.config.ts` file is configured for:
- **Sepolia Testnet**: Requires `RPC_URL` and `PRIVATE_KEY` environment variables
- **Localhost**: For local development with `npx hardhat node`

### Environment Variables

- `RPC_URL`: Sepolia RPC endpoint (e.g., Infura, Alchemy)
- `PRIVATE_KEY`: Private key of the deployer account (without 0x prefix)
- `ETHERSCAN_API_KEY`: (Optional) Etherscan API key for contract verification

## Usage

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

### Deploy to Sepolia

```bash
npm run deploy:sepolia
```

Make sure you have set the `RPC_URL` and `PRIVATE_KEY` environment variables.

### Deploy to Local Network

1. Start a local Hardhat node:
```bash
npm run node
```

2. In another terminal, deploy to localhost:
```bash
npm run deploy:local
```

## Deployment Order

The deployment script (`scripts/deploy.ts`) deploys contracts in the following order:

1. **RailPayIdentity** - No dependencies
2. **RailPayReceipt** - No dependencies
3. **RailPayTicket** - No dependencies
4. **RailPassSubscription** - No dependencies
5. **RailPayPayments** - Depends on RailPayReceipt

All contracts are deployed with the deployer as the initial owner.

## Deployed Contracts (Sepolia)

The contracts have been successfully deployed to Sepolia testnet:

| Contract | Address | Description |
|----------|---------|-------------|
| RailPayIdentity | `0xC87333Cd6A1A9ce85d90acA1D7157a7DF80717F8` | Passenger and role registry |
| RailPayReceipt | `0x4F2c946bf2ED890Df80f03396b1Fe9fe97d7C4A6` | Payment receipt registry |
| RailPayTicket | `0x0eC2b764f34bfB904E175c120B16613E06054766` | ERC721 ticket NFTs |
| RailPassSubscription | `0x0953B0c46a68adC2830544e884bd91a8354BcBD0` | Subscription pass system |
| RailPayPayments | `0xB3c9aB15029d230e3f6c1ccAbb5CBADebC4498d8` | Payment processing |

**Deployer**: `0x68A643D905107728853AC4E66934e2B75adDED39`

Deployment details are saved in `deployments/sepolia.json`.

### Verify Contracts on Etherscan

To verify contracts on Etherscan (optional but recommended):

1. Get an Etherscan API key from https://etherscan.io/apis
2. Add to `.env`:
   ```env
   ETHERSCAN_API_KEY=your_api_key_here
   ```
3. Run the verification helper:
   ```bash
   npx hardhat run scripts/verify.ts --network sepolia
   ```
4. Follow the commands shown to verify each contract

## Contract Details

### RailPayIdentity

Manages user registration and role assignments (passenger, staff, admin).

### RailPayTicket

ERC721 NFT contract representing rail tickets. Each ticket has:
- Route ID
- Price
- Travel time (departure timestamp)
- Seat identifier
- Status (Valid, Used, Refunded)

### RailPassSubscription

Manages subscription passes with different durations (daily, weekly, monthly).

### RailPayReceipt

Immutable registry of payment receipts for accounting and auditing.

### RailPayPayments

Flexible payment processing that supports:
- Zero-ETH testnet purchases
- Future FIAT on-ramp integration
- Mobile money integration
- Token payments (USDT/USDC)
- x402 micro-payments

**Important**: The payment contract does NOT require `msg.value > 0`, allowing payment metadata to be stored even when actual value transfer happens off-chain.

## Known Limitations

- Contracts are currently deployed with the deployer as the owner. Consider implementing a multi-sig or DAO for production.
- The payment contract allows zero-ETH transactions for testing. Ensure proper validation in production.
- Gas optimization may be needed for high-volume scenarios.

## Security Considerations

- All contracts use OpenZeppelin's battle-tested libraries
- Access control is implemented using OpenZeppelin's `Ownable`
- Contracts follow the checks-effects-interactions pattern
- Reentrancy protection is handled by OpenZeppelin's ERC721 implementation

## Next Steps

### For Smart Contract Development

1. **Write Tests**: Create comprehensive test suites in the `test/` directory
   - Test all contract functions
   - Test edge cases and error conditions
   - Test contract interactions

2. **Contract Verification**: Verify contracts on Etherscan for transparency
   - See "Verify Contracts on Etherscan" section above

3. **Gas Optimization**: Review and optimize gas usage if needed
   - Consider using events instead of storage where possible
   - Batch operations where applicable

4. **Security Audit**: Consider professional security audit before mainnet deployment

5. **Integration**: Prepare contract ABIs and addresses for frontend integration
   - ABIs are in `artifacts/contracts/`
   - Contract addresses are in `deployments/sepolia.json`

### For Frontend Integration

The frontend team can now:
- Import contract ABIs from `artifacts/contracts/`
- Use deployed contract addresses from `deployments/sepolia.json`
- Connect to Sepolia testnet using the contract addresses
- Test ticket minting, payment processing, and identity registration

## License

MIT

