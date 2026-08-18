# Fund Security and Step-Up Authentication

## Current boundary

Optional TOTP MFA uses Supabase Auth AAL2. AccordPay verifies the Supabase user
server-side, binds it to the signed wallet session, rejects reused MFA token
identifiers, and issues a ten-minute HttpOnly step-up session. Enrolled wallets
must have a recent step-up session before approving an agreement through the
website.

> Additional verification protects actions performed through AccordPay. A
> person controlling your wallet may still interact directly with the current
> smart contract.

The deployed `AccordPayEscrow` authorizes calls using `msg.sender`. It has no
knowledge of Supabase, email, TOTP, application sessions, or AccordPay
authorization signatures. Therefore application MFA cannot stop a wallet holder
from calling the contract directly. OTP codes, hashes, emails, and secrets must
never be written on-chain.

## Future architectures

### Authorization-aware escrow contract

A future deployment could require both the wallet call and a short-lived
AccordPay authorization signed after step-up verification. The signed typed data
must bind a nonce, expiry, chain ID, contract address, escrow ID, exact action,
and all action parameters. The contract must consume the nonce to prevent
replay. This requires a new independently reviewed contract and migration plan.

### ERC-4337 smart account

A smart account may enforce a second validator, session policy, or guardian for
selected actions. Security depends on the account implementation, bundler and
paymaster assumptions, recovery design, and audited validation modules.

### Multisignature account

Buyer, seller, resolver, or treasury roles may use a multisignature wallet so a
single compromised signer cannot act alone. This protects the role account but
does not change the existing escrow's role model.

## Operational requirements

- Enable TOTP in Supabase Auth and configure an authentication method privately.
- Do not expose participant email addresses to counterparties or the chain.
- Use secured owner/resolver accounts or multisigs before production.
- Review AAL2 linking, recovery, rate limits, security-event retention, and
  revocation before enabling MFA for production users.
- The deployed escrow remains testnet-only and not independently audited.
