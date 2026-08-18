begin;

alter table public.deal_rooms
  add column if not exists context_type text not null default 'direct_agreement'
    check (context_type in ('direct_agreement', 'job', 'support')),
  add column if not exists context_id uuid,
  add column if not exists last_message_sequence bigint not null default 0;

update public.deal_rooms
set context_id = id
where context_id is null and context_type = 'direct_agreement';

alter table public.deal_room_participants
  add column if not exists archived_at timestamptz,
  add column if not exists hidden_at timestamptz,
  add column if not exists draft_text text not null default ''
    check (char_length(draft_text) <= 4000),
  add column if not exists draft_updated_at timestamptz;

create unique index if not exists job_participant_conversation_unique
  on public.deal_rooms (
    context_id,
    least(lower(buyer_address), lower(seller_address)),
    greatest(lower(buyer_address), lower(seller_address))
  )
  where context_type = 'job'
    and context_id is not null
    and buyer_address is not null
    and seller_address is not null;

create index if not exists conversation_inbox_status_idx
  on public.deal_rooms (status, updated_at desc);
create index if not exists conversation_context_idx
  on public.deal_rooms (context_type, context_id);
create index if not exists conversation_title_search_idx
  on public.deal_rooms (lower(title));
create index if not exists conversation_escrow_search_idx
  on public.deal_rooms (escrow_id) where escrow_id is not null;
create index if not exists participant_inbox_idx
  on public.deal_room_participants
  (lower(wallet_address), archived_at, hidden_at, last_read_sequence);
create index if not exists room_message_sequence_page_idx
  on public.deal_room_messages (room_id, message_sequence desc);

create or replace function public.update_room_last_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.deal_rooms
  set last_message_sequence = new.message_sequence,
      updated_at = new.created_at
  where id = new.room_id;
  return new;
end;
$$;

drop trigger if exists update_room_last_message_trigger
  on public.deal_room_messages;
create trigger update_room_last_message_trigger
after insert on public.deal_room_messages
for each row execute function public.update_room_last_message();

update public.deal_rooms r
set last_message_sequence = latest.sequence
from (
  select room_id, max(message_sequence) as sequence
  from public.deal_room_messages group by room_id
) latest
where latest.room_id = r.id;

commit;

-- Rollback: drop the trigger/function and Phase 21A indexes, then remove the
-- participant archive/draft columns and room context/sequence columns only
-- after exporting participant-specific state. Never delete room or message rows.
