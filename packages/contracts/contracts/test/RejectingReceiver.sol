// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAccordPayEscrowForRejector {
    function createEscrow(
        address seller,
        uint64 deadline,
        string calldata metadataURI
    ) external payable returns (uint256);

    function markDelivered(uint256 escrowId, string calldata deliveryURI) external;

    function raiseDispute(uint256 escrowId) external;
}

/// @dev Test-only party that rejects every native-asset payout.
contract RejectingReceiver {
    IAccordPayEscrowForRejector public immutable escrow;

    constructor(address escrowAddress) {
        escrow = IAccordPayEscrowForRejector(escrowAddress);
    }

    function create(
        address seller,
        uint64 deadline,
        string calldata metadataURI
    ) external payable returns (uint256) {
        return escrow.createEscrow{value: msg.value}(seller, deadline, metadataURI);
    }

    function markDelivered(uint256 escrowId, string calldata deliveryURI) external {
        escrow.markDelivered(escrowId, deliveryURI);
    }

    function raiseDispute(uint256 escrowId) external {
        escrow.raiseDispute(escrowId);
    }

    receive() external payable {
        revert("RejectingReceiver: rejected");
    }
}
