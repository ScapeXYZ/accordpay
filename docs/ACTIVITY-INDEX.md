# AccordPay Activity Index

## Purpose

Dashboard, transaction, and notification reads use a persistent event index.
Normal `GET /api/accordpay/activity` requests query the index and do not wait
for a deployment-to-latest blockchain scan.

## Storage adapters

- Production: PostgreSQL, selected when `DATABASE_URL` is configured.
- Local development: `.accordpay/activity-index.json`, written atomically and
  ignored by Git.

Production deployments must configure PostgreSQL. The local adapter is for
development and testing; ephemeral serverless filesystems are not durable.

## Schema

`indexed_blocks` stores the chain, contract, last committed block, current
target block, and update time.

`accordpay_events` stores confirmed normalized lifecycle events. Its unique
constraint is `(chain_id, transaction_hash, log_index)`. Buyer, seller, escrow,
block, event, and state indexes support wallet-scoped reads.

The executable PostgreSQL schema is in
`apps/web/src/services/activity/schema.sql`. The server also creates missing
tables and indexes idempotently.

## Synchronization

`POST /api/accordpay/sync` runs a bounded server-side synchronization:

1. Read the committed checkpoint.
2. Start at deployment block `31913078` when no checkpoint exists.
3. Otherwise resume at `last_synced_block + 1`.
4. Query confirmed GIWA logs in 2,000-block chunks.
5. Enrich and commit each successful chunk transactionally.
6. Update the checkpoint only with the committed chunk.
7. After reaching the previous target, rescan a 20-block overlap for reorg
   safety.
8. Upsert events by chain, transaction hash, and log index.

A single-flight lock prevents concurrent requests in one server process from
starting duplicate synchronization work. PostgreSQL additionally uses an
advisory lock keyed by chain and contract, preventing separate server instances
from running the same synchronization concurrently. Uniqueness and atomic
upserts provide a second consistency boundary.

In production, the sync route requires `GIWA_SYNC_SECRET` through either
`Authorization: Bearer <secret>` or `x-accordpay-sync-secret`. A scheduler
should invoke it regularly. Indexed GET requests may start a small non-blocking
sync when work remains.

## Environment

```text
DATABASE_URL=
GIWA_RPC_URL=
GIWA_SYNC_SECRET=
```

`GIWA_RPC_URL` defaults to `https://sepolia-rpc.giwa.io` for development. The
free endpoint may be rate-limited. Reliable production indexing should use a
dedicated external RPC provider or a self-hosted GIWA node.

No private key is required.
