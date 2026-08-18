import { apiError } from "@/services/deal-room/http";
import {
  queryDealRoom,
  requireRoomParticipant,
} from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";
import { requireStepUpIfEnabled } from "@/services/deal-room/step-up";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const session = await requireWalletSession();
    await requireStepUpIfEnabled(session.address);
    const { roomId } = await params;
    const participant = await requireRoomParticipant(roomId, session.address);
    const [room, messages, versions, approvals, artifacts] = await Promise.all([
      queryDealRoom("select * from public.deal_rooms where id = $1", [roomId]),
      queryDealRoom(
        `select id, sender_address, message_type, body, agreement_version,
                created_at, edited_at, message_payload, message_sequence
         from public.deal_room_messages
         where room_id = $1 order by message_sequence desc limit 40`,
        [roomId],
      ),
      queryDealRoom(
        `select id, version, canonical_content, content_hash, privacy_mode,
                created_by, created_at, finalized_at
         from public.agreement_versions where room_id = $1 order by version desc`,
        [roomId],
      ),
      queryDealRoom(
        `select agreement_version_id, approver_address, role, content_hash, approved_at
         from public.agreement_approvals where room_id = $1`,
        [roomId],
      ),
      queryDealRoom(
        "select * from public.agreement_artifacts where room_id = $1",
        [roomId],
      ),
    ]);
    return Response.json({
      room: room.rows[0],
      role: participant.role,
      lastReadSequence: Number(participant.last_read_sequence),
      archived: Boolean(participant.archived_at),
      draft: participant.draft_text,
      messages: messages.rows.reverse(),
      versions: versions.rows,
      approvals: approvals.rows,
      artifacts: artifacts.rows,
    });
  } catch (error) {
    return apiError(
      403,
      "ROOM_ACCESS_DENIED",
      error instanceof Error
        ? error.message
        : "Conversation access was denied.",
    );
  }
}
