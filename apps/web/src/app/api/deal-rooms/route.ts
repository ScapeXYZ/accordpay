import { randomBytes } from "node:crypto";
import { getAddress, isAddress } from "viem";

import { serverUpbitNameService } from "@/services/names/server-upbit-name-service";
import { apiError, readJsonBody } from "@/services/deal-room/http";
import {
  queryDealRoom,
  withDealRoomTransaction,
} from "@/services/deal-room/database";
import { roomRoles, type RoomRole } from "@/services/deal-room/domain";
import { requireWalletSession } from "@/services/deal-room/session";

async function resolveInvite(value: string) {
  if (isAddress(value)) return getAddress(value);
  const result = await serverUpbitNameService.resolveForward(value);
  if (result.status !== "confirmed") {
    throw new Error("The invited UP ID could not be ownership-confirmed.");
  }
  return result.address;
}

export async function GET() {
  try {
    const session = await requireWalletSession();
    const result = await queryDealRoom(
      `select r.id, r.title, r.status, r.buyer_address, r.seller_address,
              r.current_version, r.escrow_id, r.updated_at, p.role
       from public.deal_rooms r
       join public.deal_room_participants p on p.room_id = r.id
       where lower(p.wallet_address) = lower($1) and p.left_at is null
         and p.archived_at is null and p.hidden_at is null
       order by r.updated_at desc limit 100`,
      [session.address],
    );
    return Response.json({ rooms: result.rows });
  } catch (error) {
    return apiError(
      401,
      "ROOM_LIST_UNAVAILABLE",
      error instanceof Error ? error.message : "Conversations are unavailable.",
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireWalletSession();
    const body = (await readJsonBody(request)) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const role = body.role as RoomRole;
    const invite = typeof body.invite === "string" ? body.invite.trim() : "";
    const contextType =
      body.contextType === "job"
        ? ("job" as const)
        : ("direct_agreement" as const);
    const contextId =
      typeof body.contextId === "string" &&
      /^[0-9a-f-]{36}$/i.test(body.contextId)
        ? body.contextId
        : contextType === "direct_agreement"
          ? crypto.randomUUID()
          : "";
    if (contextType === "job" && !contextId) {
      return apiError(
        400,
        "JOB_CONTEXT_REQUIRED",
        "A valid job context is required for a job conversation.",
      );
    }
    if (title.length < 3 || title.length > 160) {
      return apiError(400, "INVALID_TITLE", "Use a 3–160 character title.");
    }
    if (!roomRoles.includes(role)) {
      return apiError(400, "INVALID_ROLE", "Choose Buyer or Seller.");
    }
    const counterparty = await resolveInvite(invite);
    if (counterparty.toLowerCase() === session.address.toLowerCase()) {
      return apiError(
        400,
        "INVALID_COUNTERPARTY",
        "Buyer and seller must use different wallets.",
      );
    }
    const invitedRole: RoomRole = role === "buyer" ? "seller" : "buyer";
    const inviteToken = randomBytes(32).toString("base64url");
    const tokenHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(inviteToken),
    );
    const tokenHex = Buffer.from(tokenHash).toString("hex");
    const room = await withDealRoomTransaction(async (client) => {
      if (contextType === "job") {
        const existing = await client.query<{ id: string }>(
          `select id from public.deal_rooms
           where context_type = 'job' and context_id = $1
             and least(lower(buyer_address), lower(seller_address))
               = least(lower($2), lower($3))
             and greatest(lower(buyer_address), lower(seller_address))
               = greatest(lower($2), lower($3))
           limit 1`,
          [contextId, session.address, counterparty],
        );
        if (existing.rows[0]) {
          return { id: existing.rows[0].id, reused: true };
        }
      }
      const created = await client.query<{ id: string }>(
        `insert into public.deal_rooms
         (created_by, buyer_address, seller_address, status, title,
          context_type, context_id)
         values ($1, $2, $3, 'awaiting_counterparty', $4, $5, $6)
         returning id`,
        [
          session.address,
          role === "buyer" ? session.address : counterparty,
          role === "seller" ? session.address : counterparty,
          title,
          contextType,
          contextId,
        ],
      );
      const id = created.rows[0].id;
      await client.query(
        `insert into public.deal_room_participants
         (room_id, wallet_address, role) values ($1, $2, $3)`,
        [id, session.address, role],
      );
      await client.query(
        `insert into public.deal_room_invites
         (room_id, invited_wallet, role, token_hash, expires_at, created_by)
         values ($1, $2, $3, $4, now() + interval '7 days', $5)`,
        [id, counterparty, invitedRole, tokenHex, session.address],
      );
      return { id, reused: false };
    });
    if (room.reused) {
      return Response.json({ roomId: room.id, reused: true });
    }
    return Response.json(
      {
        roomId: room.id,
        inviteToken,
        invitedWallet: counterparty,
        reused: false,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(
      400,
      "ROOM_CREATE_FAILED",
      error instanceof Error
        ? error.message
        : "The conversation was not created.",
    );
  }
}
