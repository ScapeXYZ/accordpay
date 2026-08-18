import { apiError, readJsonBody } from "@/services/deal-room/http";
import {
  queryDealRoom,
  requireRoomParticipant,
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
    const body = (await readJsonBody(request, 1_024)) as {
      sequence?: unknown;
    };
    const sequence = Number(body.sequence);
    if (!Number.isSafeInteger(sequence) || sequence < 0) {
      return apiError(
        400,
        "INVALID_READ_SEQUENCE",
        "Read sequence is invalid.",
      );
    }
    const maximum = await queryDealRoom<{ maximum: string }>(
      `select coalesce(max(message_sequence), 0)::text as maximum
       from public.deal_room_messages where room_id = $1`,
      [roomId],
    );
    const safeSequence = Math.min(
      sequence,
      Number(maximum.rows[0]?.maximum ?? 0),
    );
    await queryDealRoom(
      `update public.deal_room_participants p
       set last_read_sequence = greatest(last_read_sequence, $3),
           last_read_at = now()
       where room_id = $1 and lower(wallet_address) = lower($2)`,
      [roomId, session.address, safeSequence],
    );
    return Response.json({ ok: true, lastReadSequence: safeSequence });
  } catch {
    return apiError(403, "MARK_READ_DENIED", "Conversation access denied.");
  }
}
