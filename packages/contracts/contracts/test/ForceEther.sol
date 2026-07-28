// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @dev Test-only helper for forced-ETH accounting checks.
contract ForceEther {
    constructor() payable {}

    function forceSend(address payable recipient) external {
        selfdestruct(recipient);
    }
}
