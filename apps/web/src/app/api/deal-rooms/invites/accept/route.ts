import { createHash } from "node:crypto";

import { apiError, readJsonBody } from "@/services/deal-room/http";
import { withDealRoomTransaction } from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";

export async function POST(request: Request) {
  try {
    const session = await requireWalletSession();
    const body = (await readJsonBody(request, 4_096)) as {
      token?: unknown;
    };
    if (typeof body.token !== "string" || body.token.length < 32) {
      return apiError(400, "INVALID_INVITE", "Invite token is invalid.");
    }
    const tokenHash = createHash("sha256").update(body.token).digest("hex");
    const roomId = await withDealRoomTransaction(async (client) => {
      const invite = await client.query<{
        id: string;
        room_id: string;
        invited_wallet: string;
        role: "buyer" | "seller";
      }>(
        `select id, room_id, invited_wallet, role from public.deal_room_invites
         where token_hash = $1 and accepted_at is null and revoked_at is null
           and expires_at > now() for update`,
        [tokenHash],
      );
      const row = invite.rows[0];
      if (
        !row ||
        row.invited_wallet.toLowerCase() !== session.address.toLowerCase()
      ) {
        throw new Error("This invite does not belong to the connected wallet.");
      }
      await client.query(
        `insert into public.deal_room_participants
         (room_id, wallet_address, role) values ($1, $2, $3)`,
        [row.room_id, session.address, row.role],
      );
      await client.query(
        "update public.deal_room_invites set accepted_at = now() where id = $1",
        [row.id],
      );
      await client.query(
        `update public.deal_rooms set status = 'negotiating', updated_at = now()
         where id = $1`,
        [row.room_id],
      );
      await client.query(
        `insert into public.deal_room_messages
         (room_id, sender_address, client_id, message_type, body)
         values ($1, $2, gen_random_uuid(), 'system', 'Invitation accepted.')`,
        [row.room_id, session.address],
      );
      return row.room_id;
    });
    return Response.json({ roomId });
  } catch (error) {
    return apiError(
      403,
      "INVITE_REJECTED",
      error instanceof Error ? error.message : "Invite could not be accepted.",
    );
  }
}
