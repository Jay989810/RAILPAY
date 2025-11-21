// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RailPayReceipt
 * @notice Simple ERC8004-style payment receipt registry
 * @dev Provides an immutable record of all payments made in the RailPay system
 * 
 * This contract maintains a registry of payment receipts that can be used
 * for accounting, auditing, and reconciliation purposes. Each receipt
 * includes payer, payee, amount, timestamp, and a refHash that can
 * link to tickets, passes, or other payment-related data.
 */
contract RailPayReceipt {
    /**
     * @notice Receipt structure
     * @param payer The address that made the payment
     * @param payee The address that received the payment
     * @param amount The amount of the payment (in wei or smallest unit)
     * @param timestamp Unix timestamp when the receipt was issued
     * @param refHash Hash reference linking to ticket ID, pass ID, or other payment metadata
     */
    struct Receipt {
        address payer;
        address payee;
        uint256 amount;
        uint256 timestamp;
        bytes32 refHash;
    }

    /**
     * @notice Counter for generating unique receipt IDs
     */
    uint256 public nextReceiptId;

    /**
     * @notice Mapping from receipt ID to receipt data
     */
    mapping(uint256 => Receipt) public receipts;

    /**
     * @notice Emitted when a new receipt is issued
     * @param receiptId The unique receipt ID
     * @param payer The address that made the payment
     * @param payee The address that received the payment
     * @param amount The amount of the payment
     * @param refHash Hash reference linking to payment metadata
     */
    event ReceiptIssued(
        uint256 indexed receiptId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        bytes32 refHash
    );

    /**
     * @notice Issue a new payment receipt
     * @dev Anyone can call this function to create a receipt
     * @param payer The address that made the payment
     * @param payee The address that received the payment
     * @param amount The amount of the payment
     * @param refHash Hash reference linking to ticket ID, pass ID, or other metadata
     * @return receiptId The ID of the newly created receipt
     * 
     * Requirements:
     * - Payer and payee addresses must be valid (non-zero)
     */
    function issueReceipt(
        address payer,
        address payee,
        uint256 amount,
        bytes32 refHash
    ) external returns (uint256) {
        require(payer != address(0), "RailPayReceipt: Invalid payer address");
        require(payee != address(0), "RailPayReceipt: Invalid payee address");
        
        uint256 receiptId = nextReceiptId;
        nextReceiptId++;

        receipts[receiptId] = Receipt({
            payer: payer,
            payee: payee,
            amount: amount,
            timestamp: block.timestamp,
            refHash: refHash
        });

        emit ReceiptIssued(receiptId, payer, payee, amount, refHash);

        return receiptId;
    }
}

