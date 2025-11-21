// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RailPayTicket
 * @notice On-chain representation of tickets as ERC721 NFTs
 * @dev Each ticket is a unique NFT that can be validated or refunded
 * 
 * This contract implements ERC721Enumerable to allow for easy enumeration
 * of tickets owned by each address. Tickets have associated metadata including
 * route, price, travel time, seat, and status.
 */
contract RailPayTicket is ERC721Enumerable, Ownable {
    /**
     * @notice Ticket status enumeration
     * @dev 0 = Valid, 1 = Used, 2 = Refunded
     */
    uint8 public constant STATUS_VALID = 0;
    uint8 public constant STATUS_USED = 1;
    uint8 public constant STATUS_REFUNDED = 2;

    /**
     * @notice Ticket data structure
     * @param routeId The route identifier for this ticket
     * @param price The price paid for the ticket (in wei or smallest unit)
     * @param travelTime Unix timestamp for departure time
     * @param seat Seat identifier (e.g., "A12", "B5")
     * @param status Current status of the ticket (0=Valid, 1=Used, 2=Refunded)
     */
    struct TicketData {
        uint256 routeId;
        uint256 price;
        uint64 travelTime;
        string seat;
        uint8 status;
    }

    /**
     * @notice Counter for generating unique ticket IDs
     */
    uint256 public nextTicketId;

    /**
     * @notice Mapping from ticket ID to ticket data
     */
    mapping(uint256 => TicketData) public ticketInfo;

    /**
     * @notice Emitted when a new ticket is minted
     * @param tokenId The unique ticket ID
     * @param to The address that receives the ticket
     * @param routeId The route identifier
     * @param price The price of the ticket
     */
    event TicketMinted(
        uint256 indexed tokenId,
        address indexed to,
        uint256 routeId,
        uint256 price
    );

    /**
     * @notice Emitted when a ticket is validated (used)
     * @param tokenId The ticket ID that was validated
     */
    event TicketValidated(uint256 indexed tokenId);

    /**
     * @notice Emitted when a ticket is refunded
     * @param tokenId The ticket ID that was refunded
     */
    event TicketRefunded(uint256 indexed tokenId);

    /**
     * @notice Constructor initializes the ERC721 token with name and symbol
     * @param initialOwner The address that will own this contract
     */
    constructor(address initialOwner) 
        ERC721("RailPay Ticket", "RPT") 
        Ownable(initialOwner) 
    {
        nextTicketId = 1; // Start ticket IDs at 1
    }

    /**
     * @notice Mint a new ticket NFT
     * @dev Only callable by the contract owner
     * @param to The address that will receive the ticket
     * @param routeId The route identifier
     * @param price The price of the ticket
     * @param travelTime Unix timestamp for departure time
     * @param seat Seat identifier
     * 
     * Requirements:
     * - Only callable by the contract owner
     * - The recipient address must be valid (non-zero)
     */
    function mintTicket(
        address to,
        uint256 routeId,
        uint256 price,
        uint64 travelTime,
        string memory seat
    ) external onlyOwner {
        require(to != address(0), "RailPayTicket: Cannot mint to zero address");
        
        uint256 tokenId = nextTicketId;
        nextTicketId++;

        ticketInfo[tokenId] = TicketData({
            routeId: routeId,
            price: price,
            travelTime: travelTime,
            seat: seat,
            status: STATUS_VALID
        });

        _safeMint(to, tokenId);

        emit TicketMinted(tokenId, to, routeId, price);
    }

    /**
     * @notice Validate a ticket (mark as used)
     * @dev Only callable by the contract owner
     * @param tokenId The ticket ID to validate
     * 
     * Requirements:
     * - Only callable by the contract owner
     * - The ticket must exist
     * - The ticket status must be Valid (0)
     */
    function validateTicket(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "RailPayTicket: Ticket does not exist");
        require(ticketInfo[tokenId].status == STATUS_VALID, "RailPayTicket: Ticket not valid");
        
        ticketInfo[tokenId].status = STATUS_USED;
        
        emit TicketValidated(tokenId);
    }

    /**
     * @notice Refund a ticket
     * @dev Only callable by the contract owner
     * @param tokenId The ticket ID to refund
     * 
     * Requirements:
     * - Only callable by the contract owner
     * - The ticket must exist
     * - The ticket status must be Valid (0)
     */
    function refundTicket(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "RailPayTicket: Ticket does not exist");
        require(ticketInfo[tokenId].status == STATUS_VALID, "RailPayTicket: Ticket not valid");
        
        ticketInfo[tokenId].status = STATUS_REFUNDED;
        
        emit TicketRefunded(tokenId);
    }
}

