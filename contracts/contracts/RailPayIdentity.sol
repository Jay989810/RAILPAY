// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RailPayIdentity
 * @notice Registry of passengers and staff/admin roles
 * @dev Manages user identity registration and role assignments
 * 
 * This contract maintains a registry of all passengers in the RailPay system.
 * Each address can register themselves as a passenger with an identity hash
 * (computed off-chain from NIN + name + other identifying information).
 * The contract owner can assign staff and admin roles to specific addresses.
 */
contract RailPayIdentity is Ownable {
    /**
     * @notice Passenger information structure
     * @param identityHash Off-chain hash of NIN + name + other identifying data
     * @param isRegistered Whether the address has registered as a passenger
     * @param isStaff Whether the address has staff privileges
     * @param isAdmin Whether the address has admin privileges
     */
    struct Passenger {
        bytes32 identityHash;
        bool isRegistered;
        bool isStaff;
        bool isAdmin;
    }

    /**
     * @notice Mapping from user address to their passenger information
     */
    mapping(address => Passenger) public passengers;

    /**
     * @notice Emitted when a new passenger registers
     * @param user The address that registered
     * @param identityHash The identity hash provided during registration
     */
    event PassengerRegistered(address indexed user, bytes32 identityHash);

    /**
     * @notice Emitted when a user's role is updated
     * @param user The address whose role was updated
     * @param isStaff New staff status
     * @param isAdmin New admin status
     */
    event RoleUpdated(address indexed user, bool isStaff, bool isAdmin);

    /**
     * @notice Constructor sets the initial owner
     * @param initialOwner The address that will own this contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Register the caller as a passenger
     * @dev Can only be called once per address
     * @param identityHash Off-chain hash of NIN + name + other identifying data
     * 
     * Requirements:
     * - The caller must not already be registered
     */
    function registerPassenger(bytes32 identityHash) external {
        require(!passengers[msg.sender].isRegistered, "RailPayIdentity: Already registered");
        
        passengers[msg.sender] = Passenger({
            identityHash: identityHash,
            isRegistered: true,
            isStaff: false,
            isAdmin: false
        });

        emit PassengerRegistered(msg.sender, identityHash);
    }

    /**
     * @notice Set staff status for a user (only owner)
     * @param user The address to update
     * @param status The new staff status
     * 
     * Requirements:
     * - Only callable by the contract owner
     */
    function setStaff(address user, bool status) external onlyOwner {
        require(passengers[user].isRegistered, "RailPayIdentity: User not registered");
        
        passengers[user].isStaff = status;
        
        emit RoleUpdated(user, passengers[user].isStaff, passengers[user].isAdmin);
    }

    /**
     * @notice Set admin status for a user (only owner)
     * @param user The address to update
     * @param status The new admin status
     * 
     * Requirements:
     * - Only callable by the contract owner
     */
    function setAdmin(address user, bool status) external onlyOwner {
        require(passengers[user].isRegistered, "RailPayIdentity: User not registered");
        
        passengers[user].isAdmin = status;
        
        emit RoleUpdated(user, passengers[user].isStaff, passengers[user].isAdmin);
    }
}

