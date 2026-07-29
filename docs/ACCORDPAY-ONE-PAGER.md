# AccordPay

**Secure every agreement.**

## Product summary

AccordPay is verified escrow and programmable commerce infrastructure built on GIWA. A buyer can create and fund a Test ETH agreement in one transaction, a seller can record delivery, and the buyer can release payment through a clear on-chain lifecycle. The MVP also supports permitted refunds, deadline reclaim, designated-resolver disputes, confirmed Upbit Web3 Names, on-chain Dojang verification, and contract-event notifications.

## Problem

Buyers risk paying before acceptable delivery. Sellers risk delivering without funded payment. Direct wallet transfers do not express delivery obligations, refund conditions, or the next authorized action, while manual escrow can be difficult to integrate into digital commerce.

## Solution

AccordPay turns escrow into an understandable product workflow backed by a non-upgradeable GIWA Sepolia contract. It keeps the wallet address canonical, shows verified identity context separately, exposes exact contract state, and links every submitted transaction to GIWA Explorer.

## How it works

1. The buyer enters the seller, Test ETH amount, deadline, and public metadata reference.
2. AccordPay resolves a submitted UP ID and requires confirmation of the canonical wallet address.
3. `createEscrow` creates and funds the agreement atomically.
4. The seller records delivery.
5. The buyer releases funds, or the parties use an allowed refund or dispute path.
6. Contract events update agreement state and the connected wallet’s notification feed.

## Why GIWA

- GIWA Sepolia provides the contract and transaction execution environment.
- Upbit Web3 Names add confirmed, human-readable identity while retaining wallet addresses.
- Dojang exposes on-chain Verified Address status through official GIWA contracts.
- GIWA Explorer provides public contract and transaction evidence.
- AccordPay demonstrates a commerce-focused GIWA application rather than a trading interface.

AccordPay is an independent product built on GIWA.

## Current MVP capabilities

- GIWA Sepolia wallet connection and network switching.
- EIP-6963 wallet discovery.
- Atomic escrow creation and Test ETH funding.
- Live escrow lookup by numeric ID.
- Seller delivery marking.
- Buyer release.
- Seller-approved refund.
- Buyer reclaim after deadline while still Funded.
- Buyer or seller dispute raising.
- Designated-resolver payout split.
- Confirmed UP ID forward/reverse ownership checks.
- On-chain Dojang verification.
- Real contract-event notifications with local read state.
- GIWA Explorer links and one-confirmation transaction handling.
- Responsive application shell and production landing page.

## Revenue opportunities

The MVP protocol fee is 0%, and no testnet fee is collected. Future opportunities include a transparent settlement fee, merchant integration plans, developer APIs, operational tooling, and higher-volume support. These are possible models, not current revenue.

## Verified contract details

| Property         | Value                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Network          | GIWA Sepolia                                                                                                           |
| Chain ID         | `91342`                                                                                                                |
| Contract         | `0x0d6e2c12BD5916B1020A03f30EAf3b73f09dF798`                                                                           |
| Deployment block | `31913078`                                                                                                             |
| Explorer         | [Verified AccordPayEscrow source](https://sepolia-explorer.giwa.io/address/0x0d6e2c12BD5916B1020A03f30EAf3b73f09dF798) |
| Asset            | Test ETH                                                                                                               |
| MVP fee          | 0%                                                                                                                     |

Test ETH has no monetary value. The contract source is verified on the explorer but has not been independently audited.

## Roadmap

The following modules are **future scope and are not implemented**:

- Freelance service marketplace.
- Job and opportunity board.
- OTC whitelist marketplace.
- NFT instant-sale and pre-market marketplace.
- Merchant escrow API.
- Community voting module.
- Travel and flight-payment integrations.
- In-app buyer and seller chat.
- Stablecoin and token support.
- Milestone escrow payments.

Other production-readiness work includes independent auditing, legal review, secured administrative roles, production RPC infrastructure, monitoring, and incident response.

## GASOK submission summary

AccordPay presents a working GIWA-native escrow MVP with a deployed and explorer-verified contract, live buyer and seller lifecycle actions, GIWA identity integrations, real event notifications, automated contract tests, responsive product UI, and explicit testnet limitations. It is intended to demonstrate how GIWA can support practical agreement and commerce workflows without inventing adoption, revenue, audit, or partnership claims.
