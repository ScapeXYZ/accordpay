// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AccordPayEscrow
/// @notice Native-asset, single-payment escrow for the AccordPay GIWA Sepolia MVP.
/// @dev Creation and funding are atomic. Full agreement text and evidence files remain off-chain.
contract AccordPayEscrow is Ownable2Step, Pausable, ReentrancyGuard {
    enum EscrowStatus {
        Funded,
        Delivered,
        Completed,
        Refunded,
        Disputed
    }

    enum RefundReason {
        SellerApproved,
        DeadlineReclaim
    }

    struct Escrow {
        uint256 id;
        address buyer;
        address seller;
        uint256 amount;
        uint64 deadline;
        EscrowStatus status;
        string metadataURI;
        string deliveryURI;
        uint64 createdAt;
        uint64 deliveredAt;
        uint64 completedAt;
    }

    error ZeroAddress();
    error InvalidSeller();
    error InvalidAmount();
    error InvalidDeadline();
    error EmptyMetadata();
    error EscrowNotFound(uint256 escrowId);
    error Unauthorized(uint256 escrowId, address caller);
    error InvalidStatus(uint256 escrowId, EscrowStatus current);
    error DeadlineNotReached(uint256 escrowId, uint64 deadline);
    error InvalidBuyerShare(uint16 buyerShareBps);
    error TransferFailed(address recipient, uint256 amount);
    error UnexpectedEther();

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint64 deadline,
        string metadataURI
    );
    event DeliveryMarked(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint64 deliveredAt,
        string deliveryURI
    );
    event FundsReleased(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );
    event EscrowRefunded(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        RefundReason reason
    );
    event DisputeRaised(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        address raisedBy
    );
    event DisputeResolved(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 buyerPayout,
        uint256 sellerPayout
    );
    event ResolverUpdated(address indexed previousResolver, address indexed newResolver);
    event ContractPaused(address indexed account);
    event ContractUnpaused(address indexed account);

    mapping(uint256 escrowId => Escrow escrow) private _escrows;
    uint256 private _escrowCount;
    address private _resolver;

    /// @param initialOwner Initial two-step owner.
    /// @param initialResolver Designated testnet dispute resolver.
    constructor(address initialOwner, address initialResolver) Ownable(initialOwner) {
        if (initialOwner == address(0) || initialResolver == address(0)) revert ZeroAddress();
        _resolver = initialResolver;
        emit ResolverUpdated(address(0), initialResolver);
    }

    /// @notice Atomically creates and funds a native-asset escrow.
    /// @param seller Seller that may mark delivery and approve a refund.
    /// @param deadline Unix timestamp after which the buyer may reclaim if still Funded.
    /// @param metadataURI Content-addressed reference to off-chain agreement metadata.
    /// @return escrowId Numeric escrow identifier.
    function createEscrow(
        address seller,
        uint64 deadline,
        string calldata metadataURI
    ) external payable whenNotPaused returns (uint256 escrowId) {
        if (msg.value == 0) revert InvalidAmount();
        if (seller == address(0)) revert ZeroAddress();
        if (seller == msg.sender) revert InvalidSeller();
        if (deadline <= block.timestamp) revert InvalidDeadline();
        if (bytes(metadataURI).length == 0) revert EmptyMetadata();

        escrowId = ++_escrowCount;
        _escrows[escrowId] = Escrow({
            id: escrowId,
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            deadline: deadline,
            status: EscrowStatus.Funded,
            metadataURI: metadataURI,
            deliveryURI: "",
            createdAt: uint64(block.timestamp),
            deliveredAt: 0,
            completedAt: 0
        });

        emit EscrowCreated(escrowId, msg.sender, seller, msg.value, deadline, metadataURI);
    }

    /// @notice Marks a funded escrow as delivered.
    /// @param escrowId Existing escrow identifier.
    /// @param deliveryURI Content-addressed reference to off-chain delivery evidence.
    function markDelivered(uint256 escrowId, string calldata deliveryURI) external {
        Escrow storage escrow = _requireEscrow(escrowId);
        if (msg.sender != escrow.seller) revert Unauthorized(escrowId, msg.sender);
        if (escrow.status != EscrowStatus.Funded) {
            revert InvalidStatus(escrowId, escrow.status);
        }
        if (bytes(deliveryURI).length == 0) revert EmptyMetadata();

        escrow.status = EscrowStatus.Delivered;
        escrow.deliveryURI = deliveryURI;
        escrow.deliveredAt = uint64(block.timestamp);

        emit DeliveryMarked(
            escrowId,
            escrow.buyer,
            escrow.seller,
            escrow.deliveredAt,
            deliveryURI
        );
    }

    /// @notice Releases all escrowed funds to the seller after delivery.
    /// @param escrowId Delivered escrow identifier.
    function releaseFunds(uint256 escrowId) external nonReentrant whenNotPaused {
        Escrow storage escrow = _requireEscrow(escrowId);
        if (msg.sender != escrow.buyer) revert Unauthorized(escrowId, msg.sender);
        if (escrow.status != EscrowStatus.Delivered) {
            revert InvalidStatus(escrowId, escrow.status);
        }

        uint256 amount = escrow.amount;
        escrow.status = EscrowStatus.Completed;
        escrow.completedAt = uint64(block.timestamp);

        _sendValue(escrow.seller, amount);
        emit FundsReleased(escrowId, escrow.buyer, escrow.seller, amount);
    }

    /// @notice Allows the seller to return all funds to the buyer before terminal settlement.
    /// @dev Seller approval is permitted in Funded or Delivered because it is a consensual unwind.
    /// @param escrowId Funded or Delivered escrow identifier.
    function approveRefund(uint256 escrowId) external nonReentrant whenNotPaused {
        Escrow storage escrow = _requireEscrow(escrowId);
        if (msg.sender != escrow.seller) revert Unauthorized(escrowId, msg.sender);
        if (
            escrow.status != EscrowStatus.Funded &&
            escrow.status != EscrowStatus.Delivered
        ) {
            revert InvalidStatus(escrowId, escrow.status);
        }

        _refund(escrow, RefundReason.SellerApproved);
    }

    /// @notice Allows the buyer to reclaim after deadline only if delivery was never marked.
    /// @param escrowId Funded escrow identifier.
    function reclaimAfterDeadline(uint256 escrowId) external nonReentrant whenNotPaused {
        Escrow storage escrow = _requireEscrow(escrowId);
        if (msg.sender != escrow.buyer) revert Unauthorized(escrowId, msg.sender);
        if (escrow.status != EscrowStatus.Funded) {
            revert InvalidStatus(escrowId, escrow.status);
        }
        if (block.timestamp <= escrow.deadline) {
            revert DeadlineNotReached(escrowId, escrow.deadline);
        }

        _refund(escrow, RefundReason.DeadlineReclaim);
    }

    /// @notice Freezes a Funded or Delivered escrow in dispute.
    /// @param escrowId Existing escrow identifier.
    function raiseDispute(uint256 escrowId) external {
        Escrow storage escrow = _requireEscrow(escrowId);
        if (msg.sender != escrow.buyer && msg.sender != escrow.seller) {
            revert Unauthorized(escrowId, msg.sender);
        }
        if (
            escrow.status != EscrowStatus.Funded &&
            escrow.status != EscrowStatus.Delivered
        ) {
            revert InvalidStatus(escrowId, escrow.status);
        }

        escrow.status = EscrowStatus.Disputed;
        emit DisputeRaised(escrowId, escrow.buyer, escrow.seller, msg.sender);
    }

    /// @notice Resolves a disputed testnet escrow using a basis-point split.
    /// @param escrowId Disputed escrow identifier.
    /// @param buyerShareBps Buyer share from 0 to 10,000 basis points.
    function resolveDispute(
        uint256 escrowId,
        uint16 buyerShareBps
    ) external nonReentrant whenNotPaused {
        Escrow storage escrow = _requireEscrow(escrowId);
        if (msg.sender != _resolver) revert Unauthorized(escrowId, msg.sender);
        if (escrow.status != EscrowStatus.Disputed) {
            revert InvalidStatus(escrowId, escrow.status);
        }
        if (buyerShareBps > 10_000) revert InvalidBuyerShare(buyerShareBps);

        uint256 buyerPayout = (escrow.amount * buyerShareBps) / 10_000;
        uint256 sellerPayout = escrow.amount - buyerPayout;
        escrow.status = EscrowStatus.Completed;
        escrow.completedAt = uint64(block.timestamp);

        if (buyerPayout != 0) _sendValue(escrow.buyer, buyerPayout);
        if (sellerPayout != 0) _sendValue(escrow.seller, sellerPayout);

        emit DisputeResolved(
            escrowId,
            escrow.buyer,
            escrow.seller,
            buyerPayout,
            sellerPayout
        );
    }

    /// @notice Updates the designated testnet resolver.
    /// @param newResolver Non-zero resolver address.
    function setResolver(address newResolver) external onlyOwner {
        if (newResolver == address(0)) revert ZeroAddress();
        address previousResolver = _resolver;
        _resolver = newResolver;
        emit ResolverUpdated(previousResolver, newResolver);
    }

    /// @notice Pauses new escrow creation and functions that transfer escrow funds.
    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }

    /// @notice Resumes new escrow creation and functions that transfer escrow funds.
    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    /// @notice Returns one escrow by identifier.
    /// @param escrowId Existing escrow identifier.
    /// @return escrow Stored escrow record.
    function getEscrow(uint256 escrowId) external view returns (Escrow memory escrow) {
        Escrow storage stored = _requireEscrow(escrowId);
        return stored;
    }

    /// @notice Returns the number of escrows ever created.
    function totalEscrows() external view returns (uint256) {
        return _escrowCount;
    }

    /// @notice Returns the designated dispute resolver.
    function resolver() external view returns (address) {
        return _resolver;
    }

    function _refund(Escrow storage escrow, RefundReason reason) private {
        uint256 amount = escrow.amount;
        escrow.status = EscrowStatus.Refunded;
        escrow.completedAt = uint64(block.timestamp);

        _sendValue(escrow.buyer, amount);
        emit EscrowRefunded(
            escrow.id,
            escrow.buyer,
            escrow.seller,
            amount,
            reason
        );
    }

    function _requireEscrow(uint256 escrowId) private view returns (Escrow storage escrow) {
        escrow = _escrows[escrowId];
        if (escrow.buyer == address(0)) revert EscrowNotFound(escrowId);
    }

    function _sendValue(address recipient, uint256 amount) private {
        (bool success, ) = payable(recipient).call{value: amount}("");
        if (!success) revert TransferFailed(recipient, amount);
    }

    receive() external payable {
        revert UnexpectedEther();
    }

    fallback() external payable {
        revert UnexpectedEther();
    }
}
