# AccordPay 60–90 Second Demo Script

## Recording setup

- Use GIWA Sepolia only.
- Use Test ETH only.
- Prepare separate buyer and seller wallets.
- Pre-fund both wallets with sufficient testnet gas.
- Use a short public demonstration metadata URI with no confidential content.
- Keep the GIWA Explorer contract and transaction pages ready in separate tabs.
- Do not describe the contract as audited or Test ETH as valuable.

## Script

### 0:00–0:08 — Landing page

**Show:** AccordPay homepage, A3 logo, “Secure every agreement,” GIWA Sepolia disclosure, and primary actions.

**Say:** “AccordPay is verified escrow and programmable commerce infrastructure built on GIWA. This demo uses GIWA Sepolia Test ETH, which has no monetary value.”

### 0:08–0:16 — Connect wallet

**Show:** Select **Launch App**, open **Connect wallet**, and choose the buyer’s detected wallet.

**Say:** “Wallets are discovered through EIP-6963, and AccordPay connects only the provider I select.”

### 0:16–0:23 — Confirm UP ID

**Show:** The connected identity with confirmed UP ID as the primary label and shortened address underneath.

**Say:** “AccordPay confirms forward and reverse UP ID ownership, while the wallet address remains canonical.”

### 0:23–0:28 — Confirm Dojang verification

**Show:** The separate **Dojang verified** badge.

**Say:** “Dojang verification is read on-chain from the official GIWA Sepolia DojangScroll contract and remains separate from name resolution.”

### 0:28–0:43 — Create and fund escrow

**Show:** Open **Create Escrow**, enter the seller wallet or confirmed UP ID, amount, future deadline, and metadata URI. Confirm the resolved seller address and sign.

**Say:** “The buyer creates and funds the escrow atomically. The MVP protocol fee is zero.”

**Show after confirmation:** Numeric escrow ID, transaction hash, explorer link, and **View escrow** action.

### 0:43–0:54 — Seller marks delivered

**Show:** Switch to the seller wallet, open the created escrow, enter a delivery-evidence URI, and select **Mark delivered**.

**Say:** “Only the seller can move a Funded escrow to Delivered.”

### 0:54–1:04 — Buyer releases funds

**Show:** Switch back to the buyer wallet, refresh the escrow, and select **Release funds**.

**Say:** “After reviewing delivery, only the buyer can release the full escrowed amount.”

### 1:04–1:12 — Completed escrow

**Show:** Completed state, buyer and seller identities, Test ETH amount, timestamps, metadata, delivery reference, and contract address.

**Say:** “The completed agreement retains its exact parties, amount, references, timestamps, and terminal state.”

### 1:12–1:19 — GIWA Explorer

**Show:** Open the release transaction on GIWA Explorer.

**Say:** “Every submitted action links to its confirmed GIWA transaction and the verified AccordPay contract.”

### 1:19–1:27 — Notification panel

**Show:** Open the bell and display the real funded, delivery, and release notifications for the connected wallet.

**Say:** “Notifications come from confirmed AccordPay contract events—no sample live activity is inserted.”

### 1:27–1:30 — Close

**Show:** AccordPay landing page or completed escrow.

**Say:** “AccordPay: Secure every agreement. The current contract is testnet-only and has not been independently audited.”

## Contingency notes

- If an RPC read is slow, retain the pending state on screen; do not edit the video to imply an unconfirmed transaction.
- If a wallet request is rejected, restart the action and keep the controlled rejection message visible.
- If a UP ID or Dojang read is unavailable, do not substitute a hardcoded identity.
- Never expose private keys, seed phrases, environment files, or confidential metadata while recording.
