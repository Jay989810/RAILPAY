// Shared Blockchain Helper for RailPay Edge Functions
// Provides ethers.js provider, signer, and contract factories for all RailPay contracts
// 
// This module centralizes blockchain interactions to ensure consistency across all Edge Functions
// 
// Environment Variables Required:
// - SEPOLIA_RPC_URL: Sepolia testnet RPC endpoint
// - BLOCKCHAIN_PRIVATE_KEY: Private key for signing transactions (operator wallet)
// - CONTRACT_RAILPAY_IDENTITY: Address of RailPayIdentity contract
// - CONTRACT_RAILPAY_TICKET: Address of RailPayTicket contract
// - CONTRACT_RAILPASS_SUBSCRIPTION: Address of RailPassSubscription contract
// - CONTRACT_RAILPAY_RECEIPT: Address of RailPayReceipt contract
// - CONTRACT_RAILPAY_PAYMENTS: Address of RailPayPayments contract

import { ethers } from 'https://esm.sh/ethers@6.9.0';

/**
 * Get the ethers.js provider for Sepolia testnet
 * Uses the RPC URL from environment variables
 * 
 * @returns ethers.JsonRpcProvider instance
 */
export function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = Deno.env.get('SEPOLIA_RPC_URL');
  
  if (!rpcUrl) {
    throw new Error('SEPOLIA_RPC_URL environment variable is not set');
  }
  
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get the ethers.js signer (wallet) for signing transactions
 * Uses the private key from environment variables
 * 
 * @returns ethers.Wallet instance
 */
export function getSigner(): ethers.Wallet {
  const privateKey = Deno.env.get('BLOCKCHAIN_PRIVATE_KEY');
  
  if (!privateKey) {
    throw new Error('BLOCKCHAIN_PRIVATE_KEY environment variable is not set');
  }
  
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Get contract address from environment variables
 * 
 * @param contractName - Name of the contract (e.g., 'RAILPAY_IDENTITY')
 * @returns Contract address
 */
function getContractAddress(contractName: string): string {
  const address = Deno.env.get(`CONTRACT_${contractName}`);
  
  if (!address) {
    throw new Error(`CONTRACT_${contractName} environment variable is not set`);
  }
  
  return address;
}

/**
 * RailPayIdentity Contract ABI
 * Minimal ABI for the functions we need
 */
const RAILPAY_IDENTITY_ABI = [
  'function registerPassenger(string memory nin, string memory fullName) external',
  'function isRegistered(address user) external view returns (bool)',
  'function getPassengerInfo(address user) external view returns (string memory nin, string memory fullName, bool isRegistered)',
  'function setAdminRole(address user, bool isAdmin) external',
  'function isAdmin(address user) external view returns (bool)',
];

/**
 * RailPayTicket Contract ABI
 * Minimal ABI for the functions we need
 */
const RAILPAY_TICKET_ABI = [
  'function mintTicket(address to, uint256 routeId, uint256 price, uint64 travelTime, string memory seat) external',
  'function validateTicket(uint256 tokenId) external',
  'function ticketInfo(uint256 tokenId) external view returns (uint256 routeId, uint256 price, uint64 travelTime, string memory seat, uint8 status)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function nextTicketId() external view returns (uint256)',
  'event TicketMinted(uint256 indexed tokenId, address indexed to, uint256 routeId, uint256 price)',
  'event TicketValidated(uint256 indexed tokenId)',
  'event TicketRefunded(uint256 indexed tokenId)',
];

/**
 * RailPassSubscription Contract ABI
 * Minimal ABI for the functions we need
 */
const RAILPASS_SUBSCRIPTION_ABI = [
  'function issuePass(address to, uint8 passType, uint64 durationSeconds) external',
  'function isPassValid(uint256 passId) external view returns (bool)',
  'function passes(uint256 passId) external view returns (address owner, uint8 passType, uint64 expiresAt, bool active)',
  'function nextPassId() external view returns (uint256)',
  'function renewPass(uint256 passId, uint64 extraSeconds) external',
  'event PassIssued(uint256 indexed passId, address indexed owner, uint8 passType, uint64 expiresAt)',
  'event PassRenewed(uint256 indexed passId, uint64 newExpiresAt)',
];

/**
 * RailPayReceipt Contract ABI
 * Minimal ABI for the functions we need
 */
const RAILPAY_RECEIPT_ABI = [
  'function issueReceipt(address payer, address payee, uint256 amount, bytes32 reference) external returns (uint256)',
  'function receipts(uint256 receiptId) external view returns (address payer, address payee, uint256 amount, bytes32 reference, uint256 timestamp)',
  'function nextReceiptId() external view returns (uint256)',
  'event ReceiptIssued(uint256 indexed receiptId, address indexed payer, address indexed payee, uint256 amount, bytes32 reference)',
];

/**
 * RailPayPayments Contract ABI
 * Minimal ABI for the functions we need
 */
const RAILPAY_PAYMENTS_ABI = [
  'function payForTicket(uint256 ticketId, bytes32 reference, uint256 amount) external payable',
  'function payForPass(uint8 passType, bytes32 reference, uint256 amount) external payable',
  'function operatorWallet() external view returns (address)',
  'function withdraw() external',
  'event PaymentMade(address indexed payer, uint256 amount, uint256 msgValue, uint256 indexed ticketId, uint256 indexed receiptId)',
  'event PassPaymentMade(address indexed payer, uint256 amount, uint256 msgValue, uint8 passType, uint256 indexed receiptId)',
  'event Withdrawn(address indexed to, uint256 amount)',
];

/**
 * Get RailPayIdentity contract instance
 * 
 * @returns Contract instance connected to signer
 */
export function getRailPayIdentityContract(): ethers.Contract {
  const address = getContractAddress('RAILPAY_IDENTITY');
  const signer = getSigner();
  return new ethers.Contract(address, RAILPAY_IDENTITY_ABI, signer);
}

/**
 * Get RailPayTicket contract instance
 * 
 * @returns Contract instance connected to signer
 */
export function getRailPayTicketContract(): ethers.Contract {
  const address = getContractAddress('RAILPAY_TICKET');
  const signer = getSigner();
  return new ethers.Contract(address, RAILPAY_TICKET_ABI, signer);
}

/**
 * Get RailPassSubscription contract instance
 * 
 * @returns Contract instance connected to signer
 */
export function getRailPassSubscriptionContract(): ethers.Contract {
  const address = getContractAddress('RAILPASS_SUBSCRIPTION');
  const signer = getSigner();
  return new ethers.Contract(address, RAILPASS_SUBSCRIPTION_ABI, signer);
}

/**
 * Get RailPayReceipt contract instance
 * 
 * @returns Contract instance connected to signer
 */
export function getRailPayReceiptContract(): ethers.Contract {
  const address = getContractAddress('RAILPAY_RECEIPT');
  const signer = getSigner();
  return new ethers.Contract(address, RAILPAY_RECEIPT_ABI, signer);
}

/**
 * Get RailPayPayments contract instance
 * 
 * @returns Contract instance connected to signer
 */
export function getRailPayPaymentsContract(): ethers.Contract {
  const address = getContractAddress('RAILPAY_PAYMENTS');
  const signer = getSigner();
  return new ethers.Contract(address, RAILPAY_PAYMENTS_ABI, signer);
}

/**
 * Get RailPayTicket contract instance (read-only, for event listening)
 * 
 * @returns Contract instance connected to provider (read-only)
 */
export function getRailPayTicketContractReadOnly(): ethers.Contract {
  const address = getContractAddress('RAILPAY_TICKET');
  const provider = getProvider();
  return new ethers.Contract(address, RAILPAY_TICKET_ABI, provider);
}

/**
 * Get RailPassSubscription contract instance (read-only, for event listening)
 * 
 * @returns Contract instance connected to provider (read-only)
 */
export function getRailPassSubscriptionContractReadOnly(): ethers.Contract {
  const address = getContractAddress('RAILPASS_SUBSCRIPTION');
  const provider = getProvider();
  return new ethers.Contract(address, RAILPASS_SUBSCRIPTION_ABI, provider);
}

/**
 * Get RailPayPayments contract instance (read-only, for event listening)
 * 
 * @returns Contract instance connected to provider (read-only)
 */
export function getRailPayPaymentsContractReadOnly(): ethers.Contract {
  const address = getContractAddress('RAILPAY_PAYMENTS');
  const provider = getProvider();
  return new ethers.Contract(address, RAILPAY_PAYMENTS_ABI, provider);
}

/**
 * Helper function to convert Ethereum address to checksum format
 * 
 * @param address - Ethereum address
 * @returns Checksummed address
 */
export function toChecksumAddress(address: string): string {
  return ethers.getAddress(address);
}

/**
 * Helper function to parse units (e.g., convert ETH to wei)
 * 
 * @param amount - Amount in human-readable format
 * @param decimals - Number of decimals (default: 18 for ETH)
 * @returns Amount in smallest unit (wei)
 */
export function parseUnits(amount: string, decimals: number = 18): bigint {
  return ethers.parseUnits(amount, decimals);
}

/**
 * Helper function to format units (e.g., convert wei to ETH)
 * 
 * @param amount - Amount in smallest unit (wei)
 * @param decimals - Number of decimals (default: 18 for ETH)
 * @returns Amount in human-readable format
 */
export function formatUnits(amount: bigint, decimals: number = 18): string {
  return ethers.formatUnits(amount, decimals);
}

/**
 * Helper function to wait for transaction confirmation
 * 
 * @param txHash - Transaction hash
 * @param confirmations - Number of confirmations to wait for (default: 1)
 * @returns Transaction receipt
 */
export async function waitForTransaction(
  txHash: string,
  confirmations: number = 1
): Promise<ethers.TransactionReceipt> {
  const provider = getProvider();
  return await provider.waitForTransaction(txHash, confirmations);
}

