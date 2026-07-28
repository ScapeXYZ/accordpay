// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAccordPayEscrowForSeller {
    function markDelivered(uint256 escrowId, string calldata deliveryURI) external;
    function approveRefund(uint256 escrowId) external;
}

/// @dev Test-only seller that attempts to re-enter during settlement.
contract ReentrantSeller {
    IAccordPayEscrowForSeller public immutable escrow;
    uint256 public targetEscrowId;
    bool public reentryAttempted;
    bool public reentrySucceeded;

    constructor(address escrowAddress) {
        escrow = IAccordPayEscrowForSeller(escrowAddress);
    }

    function markDelivered(uint256 escrowId, string calldata deliveryURI) external {
        targetEscrowId = escrowId;
        escrow.markDelivered(escrowId, deliveryURI);
    }

    receive() external payable {
        reentryAttempted = true;
        try escrow.approveRefund(targetEscrowId) {
            reentrySucceeded = true;
        } catch {}
    }
}
