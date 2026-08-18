# AccordPay Deal Rooms

## Status

Phase 20 adds a signed-wallet Deal Room foundation, private PostgreSQL schema,
RLS policies, authenticated Realtime message subscriptions, structured agreement
versioning, dual approval, public immutable HTTPS metadata artifacts, on-chain
escrow linking, and off-chain dispute cases.

The deployed `AccordPayEscrow` contract, ABI, address, and GIWA Sepolia chain
configuration are unchanged.

Private agreement finalization is intentionally disabled. EIP-6963 provides a
wallet provider identity but does not guarantee a standard encryption public key
for each participant. AccordPay does not use wallet signatures as encryption
keys and never silently changes a private agreement to public.

## Migrations

Apply `supabase/migrations/202607300001_phase20_deal_rooms.sql` through the
Supabase CLI or migration workflow. The migration creates:

- signed-wallet challenge and session records;
- rooms, participants, hashed invites, paginated messages, and attachments;
- immutable agreement versions and per-role approvals;
- finalized artifacts and on-chain escrow links;
- delivery submissions and dispute/evidence records;
- assistant audit records and future encrypted-key envelopes.

The migration enables RLS. Room content policies require a custom authenticated
Supabase JWT containing `wallet_address`. Authentication/session tables have no
browser policies and are server-only. No broad public `SELECT` policy exists.

Rollback requires dropping policies, dependent tables, functions, and enum types
in reverse order. Do not roll back after real audit records exist without first
exporting them.

## Wallet authentication

The browser requests a short-lived nonce and signs an AccordPay-specific message.
The server verifies the EVM signature with Viem, consumes the challenge exactly
once, stores only a hash of the opaque session token, and returns an HttpOnly,
Secure-in-production, SameSite=Lax cookie.

Wallet connection alone is not authentication. Every private API re-checks the
server session and room membership. Invite acceptance also verifies that the
signed wallet equals the invited address. Confirmed UP IDs resolve to canonical
addresses before invite creation.

## Realtime

`deal_room_messages` is added to the `supabase_realtime` publication. The server
issues a 15-minute Supabase JWT carrying the authenticated wallet address. RLS
then restricts events to room participants. Inserts are idempotent through the
unique `(room_id, client_id)` constraint. The REST route provides initial history,
pagination, retry, and a fallback when Realtime is unavailable.

## Agreement approval

Every edit creates a new version with stable canonical JSON and SHA-256 content
hash. The server derives the participant role from the database. It rejects stale
version numbers or mismatched hashes. Buyer and seller approvals are separate and
immutable. A version becomes finalized only when both roles approve the same
hash. A later edit creates a new version and therefore has no approvals.

## Assistant

The default assistant is deterministic. It identifies missing structured fields
and returns a proposal but cannot approve, finalize, or send a transaction.
External AI execution is not implemented in this phase. `AI_API_KEY` remains
server-only and must not be used until a reviewed provider adapter, explicit
per-room consent, input-scope disclosure, retention policy, and failure fallback
exist.

## Metadata

For public agreements, the server creates an immutable artifact database record
and an HTTPS URI under `APP_URL`. The artifact endpoint is cacheable and returns
the finalized canonical content and hash. The Deal Room escrow flow locks the
seller and metadata URI, so users cannot replace generated metadata before
simulation.

IPFS and Arweave environment slots are documented but no commercial provider is
hard-coded. A private Supabase Storage URL must never be used as an on-chain
public metadata URI.

## Attachments and delivery

The storage domain enforces a 25 MB limit, allowlisted content types, sanitized
filenames, and SHA-256 hashes. Supabase Storage bucket creation and policies must
still be completed manually before uploads are enabled. Malware scanning is not
available; downloaded files must be treated as untrusted and never executed.

Delivery and dispute evidence remain off-chain. The Solidity contract records
only the evidence URI for delivery and only the state transition for disputes.
Manual and generated URIs accept HTTPS, IPFS, or Arweave and are validated again
immediately before simulation.

## Private agreements

The local prototype uses Web Crypto AES-256-GCM with a random 96-bit IV, a
versioned payload, and authenticated ciphertext. Tests cover round trips, wrong
keys, tampering, and nonce uniqueness.

Production finalization is disabled because the supported EVM wallets do not
provide one universal, verified, recipient encryption-key protocol. The AES key
is never derived from a signature and is never stored in localStorage, logs,
public metadata, or the contract. Future finalization requires reviewed,
participant-specific public keys and a separate encrypted key envelope for buyer
and seller.

Even private mode would publicly reveal the contract, escrow ID, buyer, seller,
amount, deadline, encrypted URI, status, and transaction history.

## Disputes

An authenticated buyer or seller submits an off-chain reason and optional valid
evidence URI. The server independently reads `getEscrow` and permits case creation
only for a participant while the escrow is Funded or Delivered. The browser then
simulates and sends `raiseDispute`. Its confirmed transaction and block are added
to the case.

No reason or evidence is stored by `raiseDispute`. Funds do not move. Only the
current on-chain resolver may call `resolveDispute`. This is designated testnet
resolution, not decentralized arbitration.

## Required configuration

Server-only:

```text
DATABASE_URL
GIWA_RPC_URL
GIWA_SYNC_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET
SUPABASE_JWT_SECRET
APP_URL
WALLET_SESSION_SECRET
```

Browser-safe:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Optional and currently inactive:

```text
METADATA_STORAGE_PROVIDER
IPFS_PROVIDER_URL
IPFS_PROVIDER_TOKEN
ARWEAVE_PROVIDER_URL
AI_PROVIDER
AI_API_KEY
```

## Manual Supabase work

1. Apply the migration.
2. Confirm `deal_room_messages` is in the Realtime publication.
3. Create the private attachment bucket named by `SUPABASE_STORAGE_BUCKET`.
4. Add participant-scoped object policies before enabling uploads.
5. Configure short-lived JWT signing using the project JWT secret.
6. Configure database backups, point-in-time recovery, and connection pooling.
7. Review all RLS policies in the Supabase policy simulator.

## Recovery and security assumptions

- Revoke a wallet session by setting `revoked_at`.
- Revoke unused invites and rotate leaked invite links.
- Preserve message, approval, finalized artifact, delivery, and dispute audit
  records.
- Rotate `WALLET_SESSION_SECRET` and `SUPABASE_JWT_SECRET` through a planned
  session invalidation procedure.
- Use a dedicated production GIWA RPC.
- Obtain an independent application security review, RLS review, cryptographic
  review, and smart-contract audit before production use.
