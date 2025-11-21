// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RailPayReceipt.sol";

/**
 * @title RailPayPayments
 * @notice Flexible payment processing contract for RailPay
 * @dev Supports flexible payment logic without requiring on-chain balance checks
 * 
 * This contract allows for flexible payment processing that supports:
 * - Zero-ETH testnet purchases (for testing without testnet ETH)
 * - Future FIAT on-ramp integration
 * - Mobile money integration
 * - USDT/USDC/any token acceptance
 * - x402 micro-payments integration
 * 
 * The contract does NOT require msg.value > 0, allowing payment metadata
 * to be stored even when actual value transfer happens off-chain or through
 * other mechanisms.
 */
contract RailPayPayments {
    /**
     * @notice The wallet address that receives payments (operator wallet)
     */
    address public operatorWallet;

    /**
     * @notice Reference to the RailPayReceipt contract for issuing receipts
     */
    RailPayReceipt public receiptContract;

    /**
     * @notice Emitted when a payment is made for a ticket
     * @param payer The address that made the payment
     * @param amount The metadata amount (may differ from msg.value)
     * @param msgValue The actual ETH transferred (can be 0)
     * @param ticketId The ticket ID associated with this payment
     * @param receiptId The receipt ID issued for this payment
     */
    event PaymentMade(
        address indexed payer,
        uint256 amount,
        uint256 msgValue,
        uint256 indexed ticketId,
        uint256 indexed receiptId
    );

    /**
     * @notice Emitted when a payment is made for a pass
     * @param payer The address that made the payment
     * @param amount The metadata amount (may differ from msg.value)
     * @param msgValue The actual ETH transferred (can be 0)
     * @param passType The pass type (0=daily, 1=weekly, 2=monthly)
     * @param receiptId The receipt ID issued for this payment
     */
    event PassPaymentMade(
        address indexed payer,
        uint256 amount,
        uint256 msgValue,
        uint8 passType,
        uint256 indexed receiptId
    );

    /**
     * @notice Emitted when funds are withdrawn from the contract
     * @param to The address that received the funds
     * @param amount The amount withdrawn
     */
    event Withdrawn(address indexed to, uint256 amount);

    /**
     * @notice Constructor initializes the payment contract
     * @param _operatorWallet The wallet address that will receive payments
     * @param _receiptContract The address of the RailPayReceipt contract
     * 
     * Requirements:
     * - Operator wallet and receipt contract addresses must be valid (non-zero)
     */
    constructor(address _operatorWallet, address _receiptContract) {
        require(_operatorWallet != address(0), "RailPayPayments: Invalid operator wallet");
        require(_receiptContract != address(0), "RailPayPayments: Invalid receipt contract");
        
        operatorWallet = _operatorWallet;
        receiptContract = RailPayReceipt(_receiptContract);
    }

    /**
     * @notice Process payment for a ticket
     * @dev msg.value is optional - can be 0 for off-chain payments
     * @param ticketId The ticket ID being purchased
     * @param refHash Hash reference linking to ticket metadata
     * @param amount The metadata amount (for receipt purposes, may differ from msg.value)
     * 
     * This function allows payment processing even when msg.value == 0,
     * enabling integration with FIAT, mobile money, or other payment methods
     * where actual value transfer happens off-chain.
     */
    function payForTicket(
        uint256 ticketId,
        bytes32 refHash,
        uint256 amount
    ) external payable {
        // Issue receipt regardless of msg.value
        // This allows tracking payments even when value transfer is off-chain
        uint256 receiptId = receiptContract.issueReceipt(
            msg.sender,
            operatorWallet,
            amount,
            refHash
        );

        emit PaymentMade(
            msg.sender,
            amount,
            msg.value,
            ticketId,
            receiptId
        );

        // If msg.value > 0, the ETH is automatically held in the contract
        // The operator can withdraw it later using withdraw()
    }

    /**
     * @notice Process payment for a pass
     * @dev msg.value is optional - can be 0 for off-chain payments
     * @param passType The pass type (0=daily, 1=weekly, 2=monthly)
     * @param refHash Hash reference linking to pass metadata
     * @param amount The metadata amount (for receipt purposes, may differ from msg.value)
     * 
     * This function allows payment processing even when msg.value == 0,
     * enabling integration with FIAT, mobile money, or other payment methods
     * where actual value transfer happens off-chain.
     */
    function payForPass(
        uint8 passType,
        bytes32 refHash,
        uint256 amount
    ) external payable {
        // Issue receipt regardless of msg.value
        // This allows tracking payments even when value transfer is off-chain
        uint256 receiptId = receiptContract.issueReceipt(
            msg.sender,
            operatorWallet,
            amount,
            refHash
        );

        emit PassPaymentMade(
            msg.sender,
            amount,
            msg.value,
            passType,
            receiptId
        );

        // If msg.value > 0, the ETH is automatically held in the contract
        // The operator can withdraw it later using withdraw()
    }

    /**
     * @notice Withdraw accumulated ETH balance from the contract
     * @dev Only the operator wallet can withdraw
     * 
     * Requirements:
     * - Only callable by the operator wallet
     * - Contract must have a balance > 0
     */
    function withdraw() external {
        require(msg.sender == operatorWallet, "RailPayPayments: Only operator can withdraw");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "RailPayPayments: No balance to withdraw");
        
        (bool success, ) = operatorWallet.call{value: balance}("");
        require(success, "RailPayPayments: Withdrawal failed");
        
        emit Withdrawn(operatorWallet, balance);
    }

    /**
     * @notice Receive function to allow the contract to receive ETH
     * @dev This allows direct ETH transfers to the contract
     */
    receive() external payable {}
}

