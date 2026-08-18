begin;

-- Phase 20 originally introduced this helper. Recreate it here so a project
-- that imported the marketplace without the Phase 20 migration can recover.
-- auth.jwt() is populated only after Supabase verifies the JWT signature; no
-- request header or browser-supplied wallet value is consulted.
create or replace function public.request_wallet_address()
returns text
language sql
stable
security invoker
set search_path = pg_catalog, auth
as $$
  select case
    when coalesce(auth.jwt() ->> 'role', '') = 'authenticated'
      and coalesce(auth.jwt() ->> 'wallet_address', '')
        ~ '^0x[0-9a-fA-F]{40}$'
    then lower(auth.jwt() ->> 'wallet_address')
    else null
  end;
$$;

revoke all on function public.request_wallet_address() from public;
grant execute on function public.request_wallet_address()
  to anon, authenticated, service_role;

-- This block is intentionally conditional. It can run before retrying the
-- failed Phase 21B migration (when the tables do not exist), and it can be
-- rerun afterwards to install the hardened policies.
do $policies$
begin
  if to_regclass('public.jobs') is not null then
    alter table public.jobs enable row level security;

    drop policy if exists jobs_public_open_read on public.jobs;
    drop policy if exists jobs_owner_read on public.jobs;
    drop policy if exists jobs_owner_insert on public.jobs;
    drop policy if exists jobs_owner_update on public.jobs;
    drop policy if exists jobs_owner_delete on public.jobs;

    create policy jobs_public_open_read
      on public.jobs for select
      to anon, authenticated
      using (visibility = 'public' and status = 'open');

    create policy jobs_owner_read
      on public.jobs for select
      to authenticated
      using (
        public.request_wallet_address() is not null
        and lower(client_wallet) = public.request_wallet_address()
      );

    create policy jobs_owner_insert
      on public.jobs for insert
      to authenticated
      with check (
        public.request_wallet_address() is not null
        and lower(client_wallet) = public.request_wallet_address()
      );

    create policy jobs_owner_update
      on public.jobs for update
      to authenticated
      using (
        public.request_wallet_address() is not null
        and lower(client_wallet) = public.request_wallet_address()
      )
      with check (
        public.request_wallet_address() is not null
        and lower(client_wallet) = public.request_wallet_address()
      );

    -- Jobs are closed or cancelled through the owner update policy. There is
    -- deliberately no client DELETE policy, preserving marketplace history.
  end if;

  if to_regclass('public.job_attachments') is not null then
    alter table public.job_attachments enable row level security;

    drop policy if exists job_attachments_public_job_read
      on public.job_attachments;
    drop policy if exists job_attachments_owner_read
      on public.job_attachments;
    drop policy if exists job_attachments_owner_insert
      on public.job_attachments;
    drop policy if exists job_attachments_owner_update
      on public.job_attachments;
    drop policy if exists job_attachments_owner_delete
      on public.job_attachments;

    create policy job_attachments_public_job_read
      on public.job_attachments for select
      to anon, authenticated
      using (
        exists (
          select 1
          from public.jobs j
          where j.id = job_id
            and j.visibility = 'public'
            and j.status = 'open'
        )
      );

    create policy job_attachments_owner_read
      on public.job_attachments for select
      to authenticated
      using (
        public.request_wallet_address() is not null
        and exists (
          select 1
          from public.jobs j
          where j.id = job_id
            and lower(j.client_wallet) = public.request_wallet_address()
        )
      );

    create policy job_attachments_owner_insert
      on public.job_attachments for insert
      to authenticated
      with check (
        public.request_wallet_address() is not null
        and lower(uploader_wallet) = public.request_wallet_address()
        and exists (
          select 1
          from public.jobs j
          where j.id = job_id
            and lower(j.client_wallet) = public.request_wallet_address()
        )
      );

    create policy job_attachments_owner_delete
      on public.job_attachments for delete
      to authenticated
      using (
        public.request_wallet_address() is not null
        and exists (
          select 1
          from public.jobs j
          where j.id = job_id
            and lower(j.client_wallet) = public.request_wallet_address()
        )
      );

    -- Attachment metadata is immutable. Replacement is delete plus a
    -- separately validated upload, so no UPDATE policy is provided.
  end if;
end
$policies$;

commit;

-- Recovery for the reported failed Phase 21B transaction:
-- 1. Run this migration once to restore the signed-JWT helper.
-- 2. Retry 202607300004_phase21b_jobs_marketplace.sql.
-- 3. Run this migration again to replace its baseline policies with these
--    hardened owner and attachment policies.
--
-- Rollback: restore the Phase 20 helper definition only if required by an
-- older release. Do not drop request_wallet_address() while Phase 20/20B RLS
-- policies still depend on it.
