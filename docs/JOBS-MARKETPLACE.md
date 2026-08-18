# AccordPay Jobs & Services MVP

## Scope

Jobs & Services provides public job discovery, wallet-authenticated publishing,
job details, local job saving, and job-scoped Accord Chat conversations. It
does not yet implement proposals, applicant selection, hiring, milestones, or
automatic escrow creation.

## Database

Apply migrations in filename order, including:

`supabase/migrations/202607300004_phase21b_jobs_marketplace.sql`

The migration creates the `jobs` table, enums, indexes, RLS policies, and 12
idempotent demo records. Reapplying the seed insert does not duplicate records
because each demo job has a stable UUID and uses `ON CONFLICT (id) DO NOTHING`.

Use the Supabase SQL editor or the project's normal migration runner. Review
the target project before applying it. Do not paste database credentials into
the browser or repository.

### Wallet-RLS recovery

Phase 20 normally creates `public.request_wallet_address()`. A partially
migrated Supabase project may not have that function, causing the Phase 21B
marketplace migration to roll back when its first owner policy is created.

Apply `202607300005_fix_jobs_wallet_rls.sql` once to restore the helper, retry
`202607300004_phase21b_jobs_marketplace.sql`, and then apply the corrective
migration again to install its hardened policies. The corrective migration is
transactional and idempotent: its policy block safely does nothing when the job
tables do not exist.

The helper reads only the `wallet_address` claim from a Supabase-verified JWT
whose signed role is `authenticated`. It validates the claim as an EVM address.
It does not read arbitrary request headers. The custom Realtime JWT is issued
server-side only after AccordPay verifies the signed wallet challenge and active
HttpOnly wallet session.

Because the failed marketplace script is enclosed by `BEGIN` and `COMMIT`,
PostgreSQL rolls back its types, tables, indexes, policies, and seed inserts
together. Confirm the active project before retrying:

```sql
select
  to_regclass('public.jobs') as jobs,
  to_regclass('public.job_attachments') as job_attachments,
  to_regprocedure('public.request_wallet_address()')
    as request_wallet_address;
```

If the first two values are null, no marketplace cleanup is needed. If either
table exists, do not delete it: the corrective migration replaces policies
conditionally without removing job data.

## Access rules

- Anyone may read public, open jobs.
- A wallet-authenticated session creates jobs using the server-confirmed wallet.
- Only the matching client wallet may update a job.
- Contacting a client requires a wallet session.
- The job client and worker are inserted as the only conversation participants.
- Existing Phase 20/21 participant RLS protects messages and attachments.
- A unique job-context and participant-pair index prevents duplicate rooms.

## Client identity compatibility

`wallet_profiles` belongs to the optional Phase 20B Accord Chat migration. The
Jobs API does not join that table in its marketplace or detail queries. It reads
jobs from `public.jobs` first, checks whether `public.wallet_profiles` exists,
and enriches matching clients only when the table is available.

Without a profile table or matching profile row, the UI uses the shortened
canonical client wallet. Confirmed UP ID resolution remains an independent
client-side identity layer. Optional profile lookup failures never suppress an
otherwise valid public job listing.

## Contact flow

The job detail dispatches an in-page Accord Chat event. The floating launcher
calls the protected job-contact API, which loads the client from the database,
derives the worker from the wallet session, and creates or reuses the job room.
No client address or participant role is trusted from the browser.

The job remains open after contact. A system message records the job context,
and no escrow transaction occurs.

## Known limitations

- Optional job attachments use the existing private Supabase Storage bucket,
  server-side service role, safe filenames, hashes, allowlisted content types,
  and a 10 MB limit. Malware scanning is not yet configured.
- Saving a job is local to the browser and is not synchronized between devices.
- Proposal submission, assignment, hiring, and marketplace moderation are
  future phases.
