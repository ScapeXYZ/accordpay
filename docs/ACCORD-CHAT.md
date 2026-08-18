# Accord Chat

## Purpose

Accord Chat is the user-facing name for AccordPay's private agreement workspace:
“Chat, agree on terms, exchange files, and create secure GIWA escrow
agreements.” Existing `deal_rooms` routes and database identifiers remain
unchanged for migration compatibility.

## Access and unread state

Room APIs require a server-verified signed-wallet session. The floating launcher
is available on authenticated application pages but is not a primary sidebar
item. `message_sequence` provides deterministic ordering and each participant
stores an independent `last_read_sequence`. Opening a room marks messages read
for that participant only. Supabase Realtime invalidates the summary after an
insert; it does not broaden database authorization.

Wallet connection and Accord Chat authentication are separate states. The
browser first checks `GET /api/accord-chat/auth/session`. If no session exists,
the user explicitly requests a server challenge from
`POST /api/accord-chat/auth/challenge`, signs that exact personal message with
the already-selected Wagmi/EIP-6963 connector, and submits the proof to
`POST /api/accord-chat/auth/verify`. Only after the HttpOnly session cookie is
created may the client request the protected chat summary or
`GET /api/accord-chat/auth/realtime`.

The challenge is bound to `APP_URL`, GIWA Sepolia chain ID 91342, the wallet,
cryptographic nonce, challenge UUID, issued time, and five-minute expiry. A
SHA-256 digest of the exact server-generated message is stored in the existing
one-time challenge row. The row is consumed atomically and cannot be replayed.

## Identity

The display order is confirmed UP ID, saved AccordPay display name, then a
shortened canonical wallet address. UP ID confirmation remains independent of
Dojang verification. “AccordPay Support” and “Designated Testnet Resolver” are
protected role labels. They can only come from server-controlled role checks,
never a profile name.

## Messages and attachments

Messages render as React text and allow only parsed HTTPS links. HTML is never
executed. Attachments are limited to 25 MB and approved content types, receive
safe filenames and SHA-256 hashes, and are stored in the private Supabase bucket.
Downloads use short-lived signed URLs after wallet-session and membership
checks. Malware scanning is not configured, so the interface states that
limitation and never executes uploads.

## Agreement assistant and final metadata

The deterministic assistant works without an external provider and creates an
“AI agreement draft” proposal. It never approves, finalizes, or submits a
transaction. External processing requires explicit consent and an audited
provider adapter; no private conversation is sent externally in the current
implementation.

Any edit creates a new immutable version and resets approvals. Buyer and seller
approve the same content hash separately. Only dual approval finalizes the
version and triggers immutable HTTPS artifact generation. The URI is posted as a
system message and is prefilled in the Deal Room escrow flow.

## Support

Support conversations are separate from agreement rooms. Users can access only
their own tickets. Agents must exist in the server-controlled `support_agents`
table with `enabled = true`. Support cannot approve agreements or call escrow
actions. When `ACCORDPAY_SUPPORT_ENABLED` is false, the UI honestly reports that
staffed live support is offline.

## Configuration

Generate the server-only wallet-session secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Store the output only in local/Vercel secrets as `WALLET_SESSION_SECRET`. It must
contain at least 32 characters. Never place it in `NEXT_PUBLIC_*`.

Required variables are documented in `apps/web/.env.example`. Apply migrations
`202607300001_phase20_deal_rooms.sql` and
`202607300002_phase20b_accord_chat.sql`, enable the listed Realtime tables, and
create private/public storage buckets with the documented policies.
