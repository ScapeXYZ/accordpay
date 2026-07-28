// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAccordPayEscrowForBuyer {
    function createEscrow(
        address seller,
        uint64 deadline,
        string calldata metadataURI
    ) external payable returns (uint256);

    function reclaimAfterDeadline(uint256 escrowId) external;
}

/// @dev Test-only buyer that attempts to re-enter during a seller-approved refund.
contract ReentrantBuyer {
    IAccordPayEscrowForBuyer public immutable escrow;
    uint256 public targetEscrowId;
    bool public reentryAttempted;
    bool public reentrySucceeded;

    constructor(address escrowAddress) {
        escrow = IAccordPayEscrowForBuyer(escrowAddress);
    }

    function create(
        address seller,
        uint64 deadline,
        string calldata metadataURI
    ) external payable returns (uint256 escrowId) {
        escrowId = escrow.createEscrow{value: msg.value}(seller, deadline, metadataURI);
        targetEscrowId = escrowId;
    }

    receive() external payable {
        reentryAttempted = true;
        try escrow.reclaimAfterDeadline(targetEscrowId) {
            reentrySucceeded = true;
        } catch {}
    }
}
