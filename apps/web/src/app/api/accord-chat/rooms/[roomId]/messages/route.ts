import { apiError } from "@/services/deal-room/http";
import {
  queryDealRoom,
  requireRoomParticipant,
} from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";
import { requireStepUpIfEnabled } from "@/services/deal-room/step-up";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const session = await requireWalletSession();
    await requireStepUpIfEnabled(session.address);
    const { roomId } = await params;
    const participant = await requireRoomParticipant(roomId, session.address);
    const search = new URL(request.url).searchParams;
    const limit = Math.min(Math.max(Number(search.get("limit") ?? 40), 1), 40);
    const beforeText = search.get("beforeSequence");
    const before =
      beforeText === null || beforeText === ""
        ? null
        : Number.parseInt(beforeText, 10);
    if (before !== null && (!Number.isSafeInteger(before) || before <= 0)) {
      return apiError(400, "INVALID_CURSOR", "Message cursor is invalid.");
    }
    const result = await queryDealRoom(
      `select id, sender_address, message_type, body, agreement_version,
              created_at, edited_at, message_payload, message_sequence
       from public.deal_room_messages
       where room_id = $1 and ($2::bigint is null or message_sequence < $2)
       order by message_sequence desc limit $3`,
      [roomId, before, limit + 1],
    );
    const hasMore = result.rows.length > limit;
    const page = result.rows.slice(0, limit).reverse();
    return Response.json({
      messages: page,
      nextCursor: hasMore ? page[0]?.message_sequence : null,
      hasMore,
      firstUnreadSequence:
        participant.last_read_sequence === undefined
          ? null
          : Number(participant.last_read_sequence) + 1,
    });
  } catch (error) {
    return apiError(
      403,
      "MESSAGE_ACCESS_DENIED",
      error instanceof Error ? error.message : "Messages are unavailable.",
    );
  }
}
