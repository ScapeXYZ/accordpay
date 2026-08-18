begin;

alter table public.deal_room_messages
  add column if not exists message_sequence bigint generated always as identity,
  add column if not exists message_payload jsonb not null default '{}'::jsonb;

create unique index if not exists room_message_sequence_unique
  on public.deal_room_messages (room_id, message_sequence);

alter table public.deal_room_participants
  add column if not exists last_read_sequence bigint not null default 0,
  add column if not exists last_read_at timestamptz;

create table public.wallet_profiles (
  wallet_address text primary key,
  display_name text,
  updated_at timestamptz not null default now(),
  check (wallet_address ~ '^0x[0-9a-fA-F]{40}$'),
  check (display_name is null or char_length(display_name) between 2 and 48),
  check (
    display_name is null or
    lower(display_name) not in (
      'accordpay support', 'support', 'designated testnet resolver',
      'accordpay resolver', 'administrator', 'admin'
    )
  )
);

create table public.support_agents (
  wallet_address text primary key,
  enabled boolean not null default true,
  assigned_by text not null,
  created_at timestamptz not null default now(),
  check (wallet_address ~ '^0x[0-9a-fA-F]{40}$')
);

create table public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_wallet text not null,
  assigned_agent text references public.support_agents(wallet_address),
  status text not null default 'open'
    check (status in ('open', 'waiting_for_user', 'waiting_for_support', 'closed')),
  subject text not null check (char_length(subject) between 3 and 160),
  user_last_read_sequence bigint not null default 0,
  agent_last_read_sequence bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_wallet ~ '^0x[0-9a-fA-F]{40}$')
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete restrict,
  sender_wallet text not null,
  sender_kind text not null check (sender_kind in ('user', 'support')),
  client_id uuid not null,
  message_sequence bigint generated always as identity,
  body text not null check (char_length(body) between 1 and 4000),
  message_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (conversation_id, client_id),
  unique (conversation_id, message_sequence)
);

create table public.wallet_mfa_identities (
  wallet_address text primary key,
  supabase_user_id uuid not null unique,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (wallet_address ~ '^0x[0-9a-fA-F]{40}$')
);

create table public.step_up_sessions (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  supabase_user_id uuid not null,
  assurance_level text not null check (assurance_level = 'aal2'),
  token_jti_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check (wallet_address ~ '^0x[0-9a-fA-F]{40}$')
);

create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  wallet_address text,
  event_type text not null,
  outcome text not null,
  request_fingerprint_hash text,
  created_at timestamptz not null default now()
);

create index if not exists room_unread_idx
  on public.deal_room_messages (room_id, message_sequence desc);
create index if not exists support_user_idx
  on public.support_conversations (lower(user_wallet), updated_at desc);
create index if not exists support_agent_idx
  on public.support_conversations (lower(assigned_agent), updated_at desc);
create index if not exists support_message_page_idx
  on public.support_messages (conversation_id, message_sequence desc);
create index if not exists step_up_wallet_idx
  on public.step_up_sessions (lower(wallet_address), expires_at desc);

alter table public.wallet_profiles enable row level security;
alter table public.support_agents enable row level security;
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
alter table public.wallet_mfa_identities enable row level security;
alter table public.step_up_sessions enable row level security;
alter table public.security_events enable row level security;

create policy profiles_authenticated_read on public.wallet_profiles for select
  using (public.request_wallet_address() <> '');
create policy profiles_owner_update on public.wallet_profiles for update
  using (lower(wallet_address) = public.request_wallet_address())
  with check (lower(wallet_address) = public.request_wallet_address());
create policy support_conversation_user_read on public.support_conversations for select
  using (lower(user_wallet) = public.request_wallet_address());
create policy support_messages_user_read on public.support_messages for select
  using (exists (
    select 1 from public.support_conversations c
    where c.id = conversation_id
      and lower(c.user_wallet) = public.request_wallet_address()
  ));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'support_messages'
  ) then
    alter publication supabase_realtime add table public.support_messages;
  end if;
end $$;

commit;

-- Rollback: remove Phase 20B policies/tables/indexes, then remove the added
-- participant/message columns only after exporting unread and audit state.
