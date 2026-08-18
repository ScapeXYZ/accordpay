begin;

create extension if not exists pgcrypto;

create type public.deal_room_role as enum ('buyer', 'seller');
create type public.deal_room_status as enum (
  'draft', 'awaiting_counterparty', 'negotiating',
  'awaiting_buyer_approval', 'awaiting_seller_approval', 'approved',
  'awaiting_escrow_creation', 'funded', 'delivered', 'disputed',
  'completed', 'refunded', 'archived'
);
create type public.agreement_privacy_mode as enum ('public', 'private');

create table public.wallet_auth_challenges (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  nonce_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check (wallet_address ~ '^0x[0-9a-fA-F]{40}$')
);

create table public.wallet_sessions (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  check (wallet_address ~ '^0x[0-9a-fA-F]{40}$')
);

create table public.deal_rooms (
  id uuid primary key default gen_random_uuid(),
  created_by text not null,
  buyer_address text,
  seller_address text,
  status public.deal_room_status not null default 'draft',
  title text not null,
  current_version integer not null default 0,
  escrow_id numeric(78,0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (created_by ~ '^0x[0-9a-fA-F]{40}$'),
  check (buyer_address is null or buyer_address ~ '^0x[0-9a-fA-F]{40}$'),
  check (seller_address is null or seller_address ~ '^0x[0-9a-fA-F]{40}$'),
  check (buyer_address is null or seller_address is null or lower(buyer_address) <> lower(seller_address))
);

create table public.deal_room_participants (
  room_id uuid not null references public.deal_rooms(id) on delete restrict,
  wallet_address text not null,
  role public.deal_room_role not null,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (room_id, wallet_address),
  unique (room_id, role),
  check (wallet_address ~ '^0x[0-9a-fA-F]{40}$')
);

create table public.deal_room_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.deal_rooms(id) on delete restrict,
  invited_wallet text not null,
  role public.deal_room_role not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now(),
  check (invited_wallet ~ '^0x[0-9a-fA-F]{40}$')
);

create table public.deal_room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.deal_rooms(id) on delete restrict,
  sender_address text not null,
  client_id uuid not null,
  message_type text not null default 'text' check (message_type in ('text', 'system', 'assistant')),
  body text not null check (char_length(body) between 1 and 4000),
  agreement_version integer,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  unique (room_id, client_id),
  check (sender_address ~ '^0x[0-9a-fA-F]{40}$')
);

create table public.deal_room_attachments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.deal_rooms(id) on delete restrict,
  message_id uuid references public.deal_room_messages(id) on delete restrict,
  uploader_address text not null,
  storage_key text not null unique,
  safe_filename text not null,
  content_type text not null,
  byte_size bigint not null check (byte_size between 1 and 26214400),
  content_hash text not null,
  visibility public.agreement_privacy_mode not null,
  created_at timestamptz not null default now()
);

create table public.agreement_versions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.deal_rooms(id) on delete restrict,
  version integer not null check (version > 0),
  canonical_content jsonb not null,
  content_hash text not null,
  privacy_mode public.agreement_privacy_mode not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  previous_version_id uuid references public.agreement_versions(id) on delete restrict,
  finalized_at timestamptz,
  unique (room_id, version),
  unique (room_id, content_hash)
);

create table public.agreement_approvals (
  id uuid primary key default gen_random_uuid(),
  agreement_version_id uuid not null references public.agreement_versions(id) on delete restrict,
  room_id uuid not null references public.deal_rooms(id) on delete restrict,
  approver_address text not null,
  role public.deal_room_role not null,
  content_hash text not null,
  signature text,
  approved_at timestamptz not null default now(),
  unique (agreement_version_id, role)
);

create table public.agreement_artifacts (
  id uuid primary key default gen_random_uuid(),
  agreement_version_id uuid not null unique references public.agreement_versions(id) on delete restrict,
  room_id uuid not null references public.deal_rooms(id) on delete restrict,
  content_hash text not null,
  document_uri text not null,
  storage_provider text not null,
  encrypted boolean not null default false,
  immutable boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.room_escrow_links (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.deal_rooms(id) on delete restrict,
  chain_id integer not null check (chain_id = 91342),
  contract_address text not null,
  escrow_id numeric(78,0) not null,
  creation_transaction text not null,
  created_at timestamptz not null default now(),
  unique (chain_id, contract_address, escrow_id)
);

create table public.delivery_submissions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.deal_rooms(id) on delete restrict,
  escrow_id numeric(78,0) not null,
  submitter_address text not null,
  evidence_uri text not null,
  evidence_manifest jsonb not null,
  transaction_hash text,
  block_number bigint,
  created_at timestamptz not null default now()
);

create table public.dispute_cases (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.deal_rooms(id) on delete restrict,
  escrow_id numeric(78,0) not null,
  raised_by text not null,
  reason text not null check (char_length(reason) between 10 and 4000),
  transaction_hash text,
  block_number bigint,
  contract_status text not null default 'pending',
  resolver_status text not null default 'unreviewed',
  resolver_notes text,
  proposed_buyer_share_bps integer check (proposed_buyer_share_bps between 0 and 10000),
  resolution_transaction text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (escrow_id, transaction_hash)
);

create table public.dispute_evidence (
  id uuid primary key default gen_random_uuid(),
  dispute_case_id uuid not null references public.dispute_cases(id) on delete restrict,
  submitted_by text not null,
  attachment_id uuid references public.deal_room_attachments(id) on delete restrict,
  evidence_uri text,
  created_at timestamptz not null default now()
);

create table public.assistant_runs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.deal_rooms(id) on delete restrict,
  requested_by text not null,
  provider text not null,
  consented_external_processing boolean not null default false,
  input_scope jsonb not null,
  proposal jsonb,
  status text not null,
  created_at timestamptz not null default now()
);

create table public.encrypted_key_envelopes (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.agreement_artifacts(id) on delete restrict,
  recipient_address text not null,
  algorithm text not null,
  key_version integer not null,
  encrypted_key text not null,
  created_at timestamptz not null default now(),
  unique (artifact_id, recipient_address, key_version)
);

create index deal_rooms_buyer_idx on public.deal_rooms (lower(buyer_address), updated_at desc);
create index deal_rooms_seller_idx on public.deal_rooms (lower(seller_address), updated_at desc);
create index room_messages_page_idx on public.deal_room_messages (room_id, created_at desc, id);
create index room_attachments_idx on public.deal_room_attachments (room_id, created_at desc);
create index agreement_versions_room_idx on public.agreement_versions (room_id, version desc);
create index dispute_cases_escrow_idx on public.dispute_cases (escrow_id, created_at desc);

create or replace function public.request_wallet_address()
returns text language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'wallet_address', ''));
$$;

create or replace function public.is_room_participant(target_room uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.deal_room_participants p
    where p.room_id = target_room
      and lower(p.wallet_address) = public.request_wallet_address()
      and p.left_at is null
  );
$$;

alter table public.deal_rooms enable row level security;
alter table public.wallet_auth_challenges enable row level security;
alter table public.wallet_sessions enable row level security;
alter table public.deal_room_participants enable row level security;
alter table public.deal_room_invites enable row level security;
alter table public.deal_room_messages enable row level security;
alter table public.deal_room_attachments enable row level security;
alter table public.agreement_versions enable row level security;
alter table public.agreement_approvals enable row level security;
alter table public.agreement_artifacts enable row level security;
alter table public.room_escrow_links enable row level security;
alter table public.delivery_submissions enable row level security;
alter table public.dispute_cases enable row level security;
alter table public.dispute_evidence enable row level security;
alter table public.assistant_runs enable row level security;
alter table public.encrypted_key_envelopes enable row level security;

create policy rooms_participant_select on public.deal_rooms for select
  using (public.is_room_participant(id));
create policy participants_room_select on public.deal_room_participants for select
  using (public.is_room_participant(room_id));
create policy messages_room_select on public.deal_room_messages for select
  using (public.is_room_participant(room_id));
create policy messages_participant_insert on public.deal_room_messages for insert
  with check (
    public.is_room_participant(room_id)
    and lower(sender_address) = public.request_wallet_address()
  );
create policy attachments_room_select on public.deal_room_attachments for select
  using (public.is_room_participant(room_id));
create policy versions_room_select on public.agreement_versions for select
  using (public.is_room_participant(room_id));
create policy approvals_room_select on public.agreement_approvals for select
  using (public.is_room_participant(room_id));
create policy artifacts_room_select on public.agreement_artifacts for select
  using (public.is_room_participant(room_id));
create policy escrow_links_room_select on public.room_escrow_links for select
  using (public.is_room_participant(room_id));
create policy deliveries_room_select on public.delivery_submissions for select
  using (room_id is not null and public.is_room_participant(room_id));
create policy disputes_room_select on public.dispute_cases for select
  using (room_id is not null and public.is_room_participant(room_id));
create policy dispute_evidence_room_select on public.dispute_evidence for select
  using (exists (
    select 1 from public.dispute_cases c
    where c.id = dispute_case_id and public.is_room_participant(c.room_id)
  ));
create policy assistant_room_select on public.assistant_runs for select
  using (public.is_room_participant(room_id));
create policy envelopes_recipient_select on public.encrypted_key_envelopes for select
  using (lower(recipient_address) = public.request_wallet_address());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'deal_room_messages'
  ) then
    alter publication supabase_realtime add table public.deal_room_messages;
  end if;
end $$;

commit;

-- Rollback: drop the policies/functions/tables above in reverse dependency order,
-- then drop the three enum types. Never roll back after live audit records exist
-- without first exporting immutable agreement, approval, message, and dispute data.
