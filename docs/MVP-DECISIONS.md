# AccordPay MVP Decisions

This document is the approved product and technical decision record for the first AccordPay MVP. Product specifications, interface copy, implementation plans, and tests must remain consistent with these decisions unless a later approved decision record supersedes them.

## 1. Network

| Property     | Approved value                     |
| ------------ | ---------------------------------- |
| Display name | GIWA Sepolia                       |
| Chain ID     | `91342`                            |
| Native asset | Test ETH                           |
| RPC URL      | `https://sepolia-rpc.giwa.io`      |
| Explorer URL | `https://sepolia-explorer.giwa.io` |

GIWA Sepolia is a testnet. The public RPC may be rate-limited, and production infrastructure will require a suitable provider.

## 2. Wallet connection

The frontend will use Wagmi and Viem.

It will support:

- Injected EIP-1193 browser wallets
- MetaMask
- WalletConnect-compatible wallets

AccordPay must not claim support for untested wallets. A wallet or connection method is presented as supported only after the relevant flow has been tested on GIWA Sepolia.

## 3. Escrow creation model

Escrow creation and funding occur in one blockchain transaction.

The buyer supplies:

- Seller address
- Amount
- Deadline
- Metadata reference

The payable transaction creates the escrow and locks the funds atomically. The interface must not present creation and funding as separate blockchain actions.

## 4. Initial supported asset

Only GIWA Sepolia Test ETH is supported in the first MVP.

ERC-20 and stablecoin support are future scope. The interface must not present unsupported assets as selectable or imply that token deposits are available.

## 5. Protocol fee

The MVP protocol fee is 0%.

The UI must show:

- Escrow amount
- Protocol fee: `0 ETH`
- Total deposit

For the MVP, total deposit equals the escrow amount. Wallet or network gas is separate from the protocol fee and must not be described as revenue collected by AccordPay.

The architecture may support configurable fees later, but no testnet fee will be collected in the MVP.

## 6. Refund and cancellation policy

- Creation and funding are atomic.
- A funded escrow cannot be cancelled unilaterally by the buyer.
- The seller can approve a refund.
- The buyer can reclaim funds after the deadline only if delivery has not been marked.
- After delivery is marked, funds remain locked until release or dispute resolution.
- Completed and refunded escrows cannot be paid again.

The interface must derive available actions from the authoritative contract state. It must not imply that passing a deadline automatically executes a refund.

## 7. Delivery information

Delivery notes and evidence files remain off-chain.

The contract may store:

- A metadata hash
- A content-addressed URI
- An evidence reference

No private file or confidential agreement content should be written directly on-chain. The interface must explain the visibility and permanence of any reference before submission.

## 8. Agreement data

### On-chain

- Numeric escrow ID
- Buyer
- Seller
- Amount
- Deadline
- Status
- Metadata hash or URI reference

### Off-chain

- Agreement title
- Full description
- Delivery notes
- Search index
- User-interface metadata

Off-chain presentation must not contradict authoritative on-chain parties, value, deadline, identifier, or status.

## 9. Agreement identifier

The human-readable display format is:

```text
ACP-000001
```

The smart contract uses a `uint256` identifier internally. The frontend formats the numeric value using the `ACP-` prefix and a minimum six-digit, zero-padded display. Formatting does not change the canonical numeric identifier.

## 10. Transaction confirmation

The frontend distinguishes:

- Awaiting wallet signature
- Transaction submitted
- Transaction confirmed
- Contract state updated
- Transaction failed

One confirmed GIWA block is sufficient for the MVP interface to mark the transaction confirmed.

Transaction confirmation and contract-state synchronization are separate interface states. A confirmed transaction must not be presented as an updated contract state until the application has read or otherwise verified the resulting state.

## 11. GIWA-native features

Dojang Verified Address and Upbit Web3 Names are planned after the core escrow flow works.

They are not required to create the first escrow.

AccordPay must not display fake verification status or fake Web3 names. Wallet addresses remain the identity shown until real, tested integrations provide verified data.

## 12. Application navigation

### Desktop

Use a persistent left sidebar.

### Tablet

Use a compact header and collapsible navigation.

### Mobile

Use a top header plus bottom navigation.

Dark mode is excluded from the first MVP. The initial interface uses the approved light colour system.

## 13. Authentication

The wallet is the only identity mechanism in the first MVP.

Do not imply:

- Email accounts
- Passwords
- User profiles
- Custodial accounts

Wallet connection alone must not be described as a conventional authenticated account session. AccordPay must never request private keys or recovery phrases.

## 14. Disputes

- The Disputed status exists in the MVP state model.
- Buyer or seller may raise a dispute.
- Raising a dispute freezes funds.
- A designated resolver may resolve the testnet dispute.
- Full arbitration governance is future scope.
- Never call the MVP dispute process decentralised arbitration.

The interface must identify the testnet resolver model and avoid implying that resolution is permissionless, decentralised, independently governed, or suitable for production commerce.

## 15. Public disclosure rules

The interface must clearly state:

- GIWA Sepolia is a testnet.
- Test ETH has no real monetary value.
- Contracts are not audited unless a real audit occurs.
- AccordPay is an independent product built on GIWA.
- No financial guarantee should be implied.

These disclosures must appear where users can understand them before consequential testnet actions. They must not be hidden only in legal text or documentation.
