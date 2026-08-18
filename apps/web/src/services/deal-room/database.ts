import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  var accordPayDealRoomPool: Pool | undefined;
}

export class DealRoomConfigurationError extends Error {}
export class DealRoomAuthorizationError extends Error {}

export function getDealRoomPool() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new DealRoomConfigurationError(
      "Accord Chat requires the server-only DATABASE_URL configuration.",
    );
  }
  globalThis.accordPayDealRoomPool ??= new Pool({
    connectionString,
    max: 5,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  });
  return globalThis.accordPayDealRoomPool;
}

export async function queryDealRoom<T extends QueryResultRow>(
  text: string,
  values: readonly unknown[] = [],
) {
  return getDealRoomPool().query<T>(text, [...values]);
}

export async function withDealRoomTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
) {
  const client = await getDealRoomPool().connect();
  try {
    await client.query("begin");
    const value = await operation(client);
    await client.query("commit");
    return value;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function requireRoomParticipant(
  roomId: string,
  walletAddress: string,
) {
  const result = await queryDealRoom<{
    role: "buyer" | "seller";
    last_read_sequence: string;
    archived_at: Date | null;
    draft_text: string;
  }>(
    `select role, last_read_sequence::text, archived_at, draft_text
     from public.deal_room_participants
     where room_id = $1 and lower(wallet_address) = lower($2) and left_at is null`,
    [roomId, walletAddress],
  );
  const participant = result.rows[0];
  if (!participant) {
    throw new DealRoomAuthorizationError(
      "The authenticated wallet is not an active participant in this conversation.",
    );
  }
  return participant;
}

export async function refreshLinkedRoomStates() {
  if (!process.env.DATABASE_URL?.trim()) return;
  await queryDealRoom(
    `update public.deal_rooms r
     set status = case e.current_state
       when 'funded' then 'funded'::public.deal_room_status
       when 'delivered' then 'delivered'::public.deal_room_status
       when 'disputed' then 'disputed'::public.deal_room_status
       when 'completed' then 'completed'::public.deal_room_status
       when 'refunded' then 'refunded'::public.deal_room_status
       else r.status end,
       updated_at = now()
     from public.room_escrow_links l
     join lateral (
       select current_state
       from public.accordpay_events ae
       where ae.chain_id = l.chain_id
         and lower(ae.contract_address) = lower(l.contract_address)
         and ae.escrow_id = l.escrow_id
       order by ae.block_number desc, ae.log_index desc
       limit 1
     ) e on true
     where r.id = l.room_id
       and r.status <> 'archived'
       and r.status::text <> e.current_state`,
  );
}
