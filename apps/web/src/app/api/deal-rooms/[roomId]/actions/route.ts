import { apiError, readJsonBody } from "@/services/deal-room/http";
import {
  requireRoomParticipant,
  withDealRoomTransaction,
} from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const session = await requireWalletSession();
    const { roomId } = await params;
    await requireRoomParticipant(roomId, session.address);
    const body = (await readJsonBody(request, 2_048)) as { action?: unknown };
    if (body.action !== "leave" && body.action !== "archive") {
      return apiError(400, "INVALID_ROOM_ACTION", "Room action is invalid.");
    }
    await withDealRoomTransaction(async (client) => {
      const result = await client.query<{ status: string }>(
        "select status from public.deal_rooms where id = $1 for update",
        [roomId],
      );
      const status = result.rows[0]?.status;
      if (body.action === "leave") {
        if (
          !["draft", "awaiting_counterparty", "negotiating"].includes(status)
        ) {
          throw new Error(
            "Participants cannot leave after approval or on-chain funding.",
          );
        }
        await client.query(
          `update public.deal_room_participants set left_at = now()
           where room_id = $1 and lower(wallet_address) = lower($2)`,
          [roomId, session.address],
        );
      } else {
        if (!["completed", "refunded"].includes(status)) {
          throw new Error(
            "Only contract-confirmed Completed or Refunded rooms may be archived.",
          );
        }
        await client.query(
          `update public.deal_rooms set status = 'archived',
           archived_at = now(), updated_at = now() where id = $1`,
          [roomId],
        );
      }
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(
      409,
      "ROOM_ACTION_REJECTED",
      error instanceof Error ? error.message : "Room action was rejected.",
    );
  }
}
