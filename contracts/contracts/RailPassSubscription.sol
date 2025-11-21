// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RailPassSubscription
 * @notice Simple pass system for rail travel subscriptions
 * @dev Manages daily, weekly, and monthly passes
 * 
 * This contract allows the owner to issue passes to users with different
 * durations. Passes can be renewed by extending their expiration time.
 * Pass validity is checked by verifying that the pass is active and
 * has not expired.
 */
contract RailPassSubscription is Ownable {
    /**
     * @notice Pass type enumeration
     * @dev 0 = daily, 1 = weekly, 2 = monthly
     */
    uint8 public constant PASS_TYPE_DAILY = 0;
    uint8 public constant PASS_TYPE_WEEKLY = 1;
    uint8 public constant PASS_TYPE_MONTHLY = 2;

    /**
     * @notice Pass structure
     * @param owner The address that owns the pass
     * @param passType The type of pass (0=daily, 1=weekly, 2=monthly)
     * @param expiresAt Unix timestamp when the pass expires
     * @param active Whether the pass is currently active
     */
    struct Pass {
        address owner;
        uint8 passType;
        uint64 expiresAt;
        bool active;
    }

    /**
     * @notice Counter for generating unique pass IDs
     */
    uint256 public nextPassId;

    /**
     * @notice Mapping from pass ID to pass data
     */
    mapping(uint256 => Pass) public passes;

    /**
     * @notice Emitted when a new pass is issued
     * @param passId The unique pass ID
     * @param owner The address that owns the pass
     * @param passType The type of pass
     * @param expiresAt Unix timestamp when the pass expires
     */
    event PassIssued(
        uint256 indexed passId,
        address indexed owner,
        uint8 passType,
        uint64 expiresAt
    );

    /**
     * @notice Emitted when a pass is renewed
     * @param passId The pass ID that was renewed
     * @param newExpiresAt The new expiration timestamp
     */
    event PassRenewed(uint256 indexed passId, uint64 newExpiresAt);

    /**
     * @notice Constructor sets the initial owner
     * @param initialOwner The address that will own this contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        nextPassId = 1; // Start pass IDs at 1
    }

    /**
     * @notice Issue a new pass to a user
     * @dev Only callable by the contract owner
     * @param to The address that will receive the pass
     * @param passType The type of pass (0=daily, 1=weekly, 2=monthly)
     * @param durationSeconds The duration of the pass in seconds
     * 
     * Requirements:
     * - Only callable by the contract owner
     * - The recipient address must be valid (non-zero)
     * - The pass type must be valid (0, 1, or 2)
     */
    function issuePass(
        address to,
        uint8 passType,
        uint64 durationSeconds
    ) external onlyOwner {
        require(to != address(0), "RailPassSubscription: Cannot issue to zero address");
        require(passType <= PASS_TYPE_MONTHLY, "RailPassSubscription: Invalid pass type");
        
        uint256 passId = nextPassId;
        nextPassId++;

        uint64 expiresAt = uint64(block.timestamp + durationSeconds);

        passes[passId] = Pass({
            owner: to,
            passType: passType,
            expiresAt: expiresAt,
            active: true
        });

        emit PassIssued(passId, to, passType, expiresAt);
    }

    /**
     * @notice Renew an existing pass by extending its expiration time
     * @dev Only callable by the contract owner
     * @param passId The pass ID to renew
     * @param extraSeconds Additional seconds to add to the expiration time
     * 
     * Requirements:
     * - Only callable by the contract owner
     * - The pass must exist
     * - The pass must be active
     */
    function renewPass(uint256 passId, uint64 extraSeconds) external onlyOwner {
        require(passes[passId].active, "RailPassSubscription: Pass not active");
        
        // Extend expiration time
        passes[passId].expiresAt += extraSeconds;
        
        emit PassRenewed(passId, passes[passId].expiresAt);
    }

    /**
     * @notice Check if a pass is currently valid
     * @dev A pass is valid if it is active and has not expired
     * @param passId The pass ID to check
     * @return bool True if the pass is valid, false otherwise
     */
    function isPassValid(uint256 passId) external view returns (bool) {
        Pass memory pass = passes[passId];
        return pass.active && pass.expiresAt > block.timestamp;
    }
}

