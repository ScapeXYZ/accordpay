# AccordPay Contract Security Review

## Review status

Reviewed target: `packages/contracts/contracts/AccordPayEscrow.sol`

This is an internal pre-deployment review, not an independent audit. No contract has been deployed or verified. GIWA Sepolia Test ETH has no monetary value, and production use remains prohibited.

## Findings

### AP-SEC-001 — Pause authority could freeze every payout path

- **Severity:** Medium
- **Affected code:** Previous `whenNotPaused` use on `releaseFunds`, `approveRefund`, `reclaimAfterDeadline`, and `resolveDispute`
- **Exploit scenario:** A compromised or unavailable owner could pause the contract and indefinitely prevent buyers, sellers, and the resolver from settling or recovering already locked funds.
- **Recommended fix:** Restrict pause behavior to new escrow creation. Do not block existing escrow lifecycle or exit paths.
- **Resolution status:** Resolved. Only `createEscrow` uses `whenNotPaused`. Delivery, release, refund, deadline reclaim, dispute raising, and dispute resolution remain available while creation is paused.

### AP-SEC-002 — No explicit aggregate escrow-liability accounting

- **Severity:** Low
- **Affected code:** Previous storage and payout paths
- **Exploit scenario:** Per-record balances were sufficient to calculate obligations, but there was no constant-time invariant for comparing the contract balance against all active obligations. Operational monitoring could not distinguish active liabilities from forced ETH without event reconstruction.
- **Recommended fix:** Track aggregate non-terminal liability, increase it on creation, and decrease it exactly once before every terminal payout.
- **Resolution status:** Resolved. `totalEscrowLiability` is private and exposed through `totalLiability()`. Mixed-lifecycle and forced-ETH tests prove `address(this).balance >= totalLiability()`.

### AP-SEC-003 — Ownership renunciation could strand administration

- **Severity:** Low
- **Affected code:** Inherited `renounceOwnership()`
- **Exploit scenario:** The owner could accidentally renounce ownership, permanently preventing resolver replacement and pause recovery. A lost resolver would then make disputed funds unrecoverable.
- **Recommended fix:** Disable ownership renunciation for this administration-dependent MVP.
- **Resolution status:** Resolved. `renounceOwnership()` is overridden and always reverts with `OwnershipRenunciationDisabled`.

### AP-SEC-004 — Unbounded metadata references

- **Severity:** Low
- **Affected code:** `createEscrow` and `markDelivered`
- **Exploit scenario:** Although callers pay their own calldata and storage costs, extremely large strings could create avoidable RPC response, indexing, and user-interface denial-of-service pressure.
- **Recommended fix:** Apply a documented upper bound while preserving normal content-addressed URI usage.
- **Resolution status:** Resolved. Agreement and delivery references are limited to 2,048 bytes. Empty references remain rejected.

### AP-SEC-005 — Rejecting recipients can block direct settlement

- **Severity:** Low
- **Affected code:** `_sendValue`, `releaseFunds`, `_refund`, and `resolveDispute`
- **Exploit scenario:** A buyer or seller contract that rejects native ETH causes the payout transaction to revert. The relevant release, refund, or resolver split cannot complete until a compatible recipient path exists; a resolver split containing a rejecting party also reverts atomically.
- **Recommended fix:** Either document and test direct-payout rollback for the MVP or introduce withdrawal credits with their additional state and user transaction.
- **Resolution status:** Accepted limitation. Direct payouts remain for the MVP because they preserve a small state surface and one-step settlement. Tests prove status, timestamps, and liability roll back on rejected transfers. Pull payments remain a production design candidate.

### AP-SEC-006 — Forced ETH cannot be recovered

- **Severity:** Informational
- **Affected code:** Contract balance and rejecting `receive`/`fallback`
- **Exploit scenario:** Another contract can force ETH to this address despite reverting direct transfers. It raises the raw balance without creating an escrow liability.
- **Recommended fix:** Keep forced ETH out of liability accounting. Do not add an administrative sweep that could weaken escrow-fund protections.
- **Resolution status:** Accepted by design. A self-destruct-style test proves forced ETH does not change `totalLiability()`. The excess remains trapped.

### AP-SEC-007 — Owner and resolver may be the same address

- **Severity:** Informational
- **Affected code:** Constructor and `setResolver`
- **Exploit scenario:** A single compromised key could control both administrative configuration and testnet dispute outcomes.
- **Recommended fix:** Permit the configuration technically but separate and secure the roles operationally before production.
- **Resolution status:** Accepted for testnet flexibility. Same-address behavior is explicitly tested. Production owner and resolver should use appropriately secured accounts or multisigs.

### AP-SEC-008 — Block timestamps determine deadline eligibility

- **Severity:** Informational
- **Affected code:** Deadline validation and `reclaimAfterDeadline`
- **Exploit scenario:** Validators have limited timestamp discretion around a boundary.
- **Recommended fix:** Use strict, documented boundary semantics and deadlines long enough that small timestamp variance is immaterial.
- **Resolution status:** Accepted for the MVP. Creation requires `deadline > block.timestamp`; reclaim requires `block.timestamp > deadline`. Before, equal, and after-boundary tests are present.

## Line-by-line control review

### State and constants

- `MAX_METADATA_URI_LENGTH` bounds both stored references and emitted string payloads.
- `_escrows` is private and keyed by monotonically increasing IDs; no array or unbounded iteration exists.
- `_escrowCount` increments once after all creation validation succeeds.
- `totalEscrowLiability` tracks only non-terminal recorded escrow amounts.
- `_resolver` is private, non-zero at construction, and can only be updated to a non-zero address by the owner.

The `Escrow` record stores the required ID, parties, exact amount, deadline, status, URI references, and lifecycle timestamps. Full agreements and private evidence remain off-chain.

### Constructor

- OpenZeppelin `Ownable` rejects a zero initial owner before the constructor body.
- AccordPay rejects a zero initial resolver.
- Owner and resolver may intentionally be equal, but operational separation is recommended.
- Resolver initialization emits `ResolverUpdated`.

### Modifiers and access controls

- `whenNotPaused` applies only to `createEscrow`.
- Every ETH-paying external function is `nonReentrant`.
- Owner administration uses OpenZeppelin `onlyOwner`.
- Buyer, seller, and resolver permissions are checked against stored addresses.
- `Ownable2Step` requires the pending owner to accept.
- Zero-address `transferOwnership` cancels a pending transfer under OpenZeppelin’s two-step semantics.

### Custom errors

All validation paths use custom errors. Tests cover invalid amount, zero address, self-seller, invalid deadline, empty and oversized metadata, unknown ID, unauthorized role, invalid status, deadline not reached, excessive basis points, transfer failure, unexpected ETH, and disabled renunciation.

### Events and indexing

Lifecycle events index `escrowId`, buyer, and seller where useful. Events include exact amounts, deadlines, URI references, refund reason, dispute raiser, and both dispute payouts. These fields are sufficient to build per-party and per-escrow indexes without returning an unbounded array. Administrative events identify resolver changes and the pausing account.

### Creation

- Requires positive `msg.value`.
- Rejects zero seller and buyer/seller equality.
- Requires a strictly future deadline.
- Validates metadata length.
- Increments the ID and liability exactly once.
- Stores the exact deposit and emits after state creation.
- Creation and funding are atomic.

### Delivery

- Only the seller can call.
- Only `Funded` can become `Delivered`.
- Delivery reference must be non-empty and at most 2,048 bytes.
- No external call occurs.

### Release and refunds

- Release requires buyer plus `Delivered`.
- Seller-approved refund requires seller plus `Funded` or `Delivered`.
- Deadline reclaim requires buyer plus `Funded` and a timestamp strictly after the deadline.
- Status, completion timestamp, and liability are updated before the external call.
- A failed recipient call reverts the entire transaction, restoring state and liability.
- `Completed` and `Refunded` cannot transition again.

### Disputes

- Only buyer or seller can raise from `Funded` or `Delivered`.
- Raising a dispute moves state to `Disputed` without moving funds.
- Only the designated resolver can resolve a `Disputed` escrow.
- Buyer share cannot exceed 10,000 basis points.
- Buyer payout uses integer division; seller receives `amount - buyerPayout`, so no wei is unaccounted.
- Zero buyer or seller payout legs are skipped safely.
- Liability is reduced exactly once before transfers.
- Any failed payout reverts the full split and restores `Disputed` state and liability.

### ETH transfers and solvency

All ordinary payouts use low-level `call` after effects and under `ReentrancyGuard`. There is no owner, resolver, or arbitrary-address withdrawal path. Direct `receive` and `fallback` transfers revert. Forced ETH is not credited to liability and therefore cannot be mistaken for an escrow obligation.

Under reachable contract behavior, every created liability is funded by the same payable transaction and every liability reduction accompanies a terminal payout attempt. Solidity checked arithmetic prevents liability underflow. Tests cover concurrent escrows, mixed terminal paths, rejected recipients, reentrancy, and forced ETH.

### Prohibited mechanisms

The production contract contains no:

- `tx.origin`
- `delegatecall`
- `selfdestruct`
- proxy or upgrade mechanism
- unbounded loop
- hidden fee
- administrative seizure or sweep

`selfdestruct` appears only in a test helper used to prove forced-ETH accounting behavior and is never deployed.

## Remaining pre-production requirements

- Independent Slither analysis in a supported environment
- Independent professional audit
- Production threat model and incident response plan
- Secured owner and resolver accounts or multisigs
- Key rotation and monitoring procedures
- GIWA Sepolia deployment and verification only after explicit approval
- Live testnet smoke tests
