# AccordPay Contracts

Hardhat workspace for the AccordPay native-asset escrow contract.

> Testnet development software. No AccordPay contract has been deployed, verified, or audited yet. GIWA Sepolia Test ETH has no monetary value.

## Purpose

`AccordPayEscrow` atomically creates and funds one native Test ETH escrow between one buyer and one seller. It supports seller delivery, buyer release, seller-approved refund, deadline reclaim before delivery, and designated-resolver testnet disputes.

The owner cannot withdraw, seize, or sweep active escrow funds.

The hardened contract tracks aggregate active liability through `totalLiability()`, limits metadata references to 2,048 bytes, disables ownership renunciation, and restricts pause behavior to new escrow creation. Direct payouts remain an explicitly documented MVP limitation because rejecting recipient contracts can block settlement while preserving atomic rollback.

## Setup

From the repository root:

```bash
npm install
copy packages/contracts/.env.example packages/contracts/.env
npm run contracts:compile
npm run contracts:test
```

Never commit `.env` or a private key. `.env.example` contains no secrets.

## Scripts

```bash
npm run compile
npm run test
npm run coverage
npm run lint
npm run dry-run
npm run security
npm run export:abi
npm run clean
npm run node
npm run deploy:local
npm run deploy:giwa
npm run verify:giwa
npm run typecheck
```

Run these inside `packages/contracts`, or use the `contracts:*` scripts from the repository root.

## Environment

- `GIWA_SEPOLIA_RPC_URL` — GIWA Sepolia JSON-RPC endpoint
- `DEPLOYER_PRIVATE_KEY` — deployment signer private key
- `DISPUTE_RESOLVER` — designated testnet resolver
- `FEE_RECIPIENT` — reserved for future fee architecture; unused while the protocol fee is 0%
- `CONTRACT_ADDRESS` — deployed address used only by the manual verification script

## GIWA Sepolia

- Network: `giwaSepolia`
- Display name: GIWA Sepolia
- Chain ID: `91342`
- Explorer: `https://sepolia-explorer.giwa.io`

The public RPC may be rate-limited. Production infrastructure requires a suitable provider.

## Deployment

Deployment validates the network, deployer, and resolver, then prints deployment facts. It never writes an address into frontend files and never verifies automatically.

```bash
npm run deploy:giwa
```

Manual verification after a real deployment:

```bash
CONTRACT_ADDRESS=<address> npm run verify:giwa
```

No deployment or verification is performed as part of repository validation.

See [`../../docs/SMART-CONTRACT-DESIGN.md`](../../docs/SMART-CONTRACT-DESIGN.md) for the lifecycle, permissions, trust assumptions, and limitations.
