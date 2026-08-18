import { isAddress } from "viem";

import { queryDealRoom } from "@/services/deal-room/database";
import { apiError } from "@/services/deal-room/http";
import { requireWalletSession } from "@/services/deal-room/session";
import { isUpbitName } from "@/services/names/upbit-name-resolution";
import { serverUpbitNameService } from "@/services/names/server-upbit-name-service";

const filters = new Set([
  "all",
  "unread",
  "active",
  "completed",
  "support",
  "archived",
]);

export async function GET(request: Request) {
  try {
    const session = await requireWalletSession();
    const params = new URL(request.url).searchParams;
    const filter = params.get("filter")?.toLowerCase() ?? "all";
    const search = params.get("search")?.trim().slice(0, 160) ?? "";
    if (!filters.has(filter)) {
      return apiError(400, "INVALID_FILTER", "Conversation filter is invalid.");
    }
    let resolvedSearchAddress = "";
    if (isAddress(search)) resolvedSearchAddress = search;
    else if (isUpbitName(search)) {
      const resolution = await serverUpbitNameService.resolveForward(search);
      if (resolution.status === "confirmed") {
        resolvedSearchAddress = resolution.address;
      }
    }

    const rooms = await queryDealRoom<{
      id: string;
      title: string;
      status: string;
      context_type: "direct_agreement" | "job";
      role: "buyer" | "seller";
      counterparty_address: `0x${string}`;
      display_name: string | null;
      unread_count: string;
      last_message: string | null;
      last_message_at: Date | null;
      escrow_id: string | null;
      archived: boolean;
      last_read_sequence: string;
    }>(
      `select r.id, r.title, r.status, r.context_type, r.escrow_id, p.role,
        case when p.role = 'buyer' then r.seller_address else r.buyer_address end
          as counterparty_address,
        wp.display_name, (p.archived_at is not null) as archived,
        p.last_read_sequence::text,
        count(m.id) filter (
          where m.message_sequence > p.last_read_sequence
            and lower(m.sender_address) <> lower($1)
        )::text as unread_count,
        latest.body as last_message, latest.created_at as last_message_at
       from public.deal_rooms r
       join public.deal_room_participants p on p.room_id = r.id
       left join public.deal_room_messages m on m.room_id = r.id
       left join lateral (
         select body, created_at from public.deal_room_messages
         where room_id = r.id order by message_sequence desc limit 1
       ) latest on true
       left join public.wallet_profiles wp on lower(wp.wallet_address) = lower(
         case when p.role = 'buyer' then r.seller_address else r.buyer_address end
       )
       where lower(p.wallet_address) = lower($1) and p.left_at is null
         and p.hidden_at is null
         and ($2 = '' or lower(r.title) like '%' || lower($2) || '%'
           or lower(coalesce(wp.display_name, '')) like '%' || lower($2) || '%'
           or lower(coalesce(r.escrow_id::text, '')) = lower(regexp_replace($2, '^ACP-0*', '', 'i'))
           or lower(case when p.role = 'buyer' then r.seller_address else r.buyer_address end)
             like '%' || lower($2) || '%'
           or ($3 <> '' and lower(case when p.role = 'buyer' then r.seller_address else r.buyer_address end) = lower($3)))
         and ($4 = 'all'
           or ($4 = 'unread' and m.message_sequence > p.last_read_sequence
             and lower(m.sender_address) <> lower($1))
           or ($4 = 'active' and r.status in (
             'draft','awaiting_counterparty','negotiating',
             'awaiting_buyer_approval','awaiting_seller_approval','approved',
             'awaiting_escrow_creation','funded','delivered','disputed'))
           or ($4 = 'completed' and r.status in ('completed','refunded'))
           or ($4 = 'archived' and p.archived_at is not null))
         and ($4 = 'archived' or p.archived_at is null)
       group by r.id, p.role, p.archived_at, p.last_read_sequence,
                wp.display_name, latest.body, latest.created_at
       order by coalesce(latest.created_at, r.updated_at) desc limit 50`,
      [session.address, search, resolvedSearchAddress, filter],
    );

    const support =
      filter === "all" || filter === "support"
        ? await queryDealRoom<{
            id: string;
            title: string;
            status: string;
            unread_count: string;
            last_message: string | null;
            last_message_at: Date | null;
          }>(
            `select c.id, c.subject as title, c.status,
              count(m.id) filter (
                where m.message_sequence > c.user_last_read_sequence
                  and m.sender_kind = 'support'
              )::text as unread_count,
              latest.body as last_message, latest.created_at as last_message_at
             from public.support_conversations c
             left join public.support_messages m on m.conversation_id = c.id
             left join lateral (
               select body, created_at from public.support_messages
               where conversation_id = c.id order by message_sequence desc limit 1
             ) latest on true
             where lower(c.user_wallet) = lower($1)
               and ($2 = '' or lower(c.subject) like '%' || lower($2) || '%')
             group by c.id, latest.body, latest.created_at
             order by coalesce(latest.created_at, c.updated_at) desc limit 20`,
            [session.address, search],
          )
        : { rows: [] };

    const invites = await queryDealRoom<{
      id: string;
      room_id: string;
      role: string;
      created_at: Date;
    }>(
      `select id, room_id, role, created_at from public.deal_room_invites
       where lower(invited_wallet) = lower($1) and accepted_at is null
         and revoked_at is null and expires_at > now()
       order by created_at desc`,
      [session.address],
    );
    const unreadCount =
      rooms.rows.reduce((sum, room) => sum + Number(room.unread_count), 0) +
      support.rows.reduce((sum, room) => sum + Number(room.unread_count), 0);
    return Response.json({
      wallet: session.address,
      unreadCount,
      pendingInvitationCount: invites.rowCount ?? 0,
      conversations: rooms.rows,
      supportConversations: support.rows,
      invitations: invites.rows,
      supportConfigured: process.env.ACCORDPAY_SUPPORT_ENABLED === "true",
    });
  } catch (error) {
    return apiError(
      401,
      "ACCORD_CHAT_UNAVAILABLE",
      error instanceof Error ? error.message : "Accord Chat is unavailable.",
    );
  }
}
