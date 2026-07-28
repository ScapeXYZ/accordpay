# AccordPay Product Brief

## Product problem

Digital commerce between unfamiliar parties depends on trust that is difficult to establish. Buyers risk paying before receiving acceptable goods or services, while sellers risk delivering without reliable payment. Manual escrow can be slow, opaque, expensive, and difficult to integrate into digital workflows.

## Product solution

AccordPay provides verified escrow and programmable commerce infrastructure on GIWA Chain. It lets a buyer and seller record clear transaction terms, lock funds, track fulfilment, and release or refund payment through an understandable on-chain workflow.

The product should make transaction state and required actions clear without requiring users to understand smart-contract internals.

## Target users

- Independent professionals and their clients
- Digital merchants and buyers
- Small businesses purchasing remote services or goods
- Online communities coordinating peer-to-peer commerce
- Developers that need escrow primitives for commerce applications

## Core buyer and seller transaction flow

1. A buyer creates an agreement with a seller, amount, asset, description, deadline, and acceptance terms.
2. Both parties review the terms before funds are committed.
3. The buyer funds the escrow on GIWA Chain.
4. The seller delivers and marks the agreement ready for review.
5. The buyer accepts the delivery and releases payment.
6. If the agreement is cancelled under permitted conditions, funds are refunded according to its rules.
7. Both parties can inspect the agreement status and transaction history throughout.

## GIWA ecosystem value

AccordPay adds a commerce-focused use case to GIWA Chain by turning on-chain settlement into a practical agreement workflow. It can create repeatable transaction activity, demonstrate consumer-facing contract utility, and provide a foundation for future merchants and developers to build programmable commerce experiences on the network.

## MVP scope

- Wallet connection and supported-network detection
- Buyer-created, single-payment escrow agreements
- Explicit seller identity by wallet address
- Defined amount, description, deadline, and acceptance terms
- Escrow funding, delivery marking, buyer release, and eligible refund
- Clear agreement states and transaction history
- Buyer and seller agreement dashboards
- Responsive, accessible user experience
- Smart-contract tests and deployment tooling for the selected GIWA environment
- Product documentation and a demonstrable end-to-end flow

## Features excluded from the first MVP

- Fiat payments or off-chain custody
- Multi-currency baskets
- Milestone, subscription, streaming, or recurring payments
- Decentralized arbitration and dispute juries
- Reputation scores and identity verification
- Marketplace discovery or merchant storefronts
- Cross-chain settlement and bridges
- Mobile applications
- Governance or a project token
- Production guarantees, insurance, or audited-contract claims

## Business model

The initial model is a transparent protocol or service fee charged when escrow is successfully settled. Fee policy must be visible before funding. Future revenue may include developer infrastructure, merchant tools, and higher-volume plans, but these are outside the MVP.

## Product risks

- Smart-contract defects or incorrect state transitions
- Users misunderstanding irreversible wallet actions
- Lost keys, incorrect addresses, or unsupported assets
- Disputes that the limited MVP flow cannot resolve
- Network instability, fee volatility, or incomplete GIWA tooling
- Regulatory obligations related to escrow, payments, custody, or user verification
- Low transaction liquidity or insufficient buyer and seller adoption
- Phishing, impersonation, and malicious agreement terms

Risk controls should include minimal contract scope, defensive testing, explicit confirmations, readable transaction states, clear limitations, and legal review before production use.

## Success criteria

- A buyer and seller can complete the full escrow flow on the selected GIWA environment.
- Users can understand agreement status and their next action without technical guidance.
- Invalid, unauthorized, and repeated state transitions are rejected by contracts.
- Core flows pass automated contract and frontend tests.
- The interface meets agreed accessibility and responsive-layout checks.
- Setup, deployment, limitations, and demo instructions are reproducible.
- User testing indicates that target users understand the value proposition and trust model.
