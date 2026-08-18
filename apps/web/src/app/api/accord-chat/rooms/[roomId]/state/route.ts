import { apiError, readJsonBody } from "@/services/deal-room/http";
import {
  queryDealRoom,
  requireRoomParticipant,
} from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const session = await requireWalletSession();
    const { roomId } = await params;
    await requireRoomParticipant(roomId, session.address);
    const result = await queryDealRoom<{
      archived_at: Date | null;
      draft_text: string;
      last_read_sequence: string;
    }>(
      `select archived_at, draft_text, last_read_sequence::text
       from public.deal_room_participants
       where room_id = $1 and lower(wallet_address) = lower($2)`,
      [roomId, session.address],
    );
    return Response.json(result.rows[0]);
  } catch {
    return apiError(
      403,
      "STATE_ACCESS_DENIED",
      "Conversation state unavailable.",
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const session = await requireWalletSession();
    const { roomId } = await params;
    await requireRoomParticipant(roomId, session.address);
    const body = (await readJsonBody(request, 8_192)) as {
      archived?: unknown;
      draft?: unknown;
    };
    if (body.archived === undefined && body.draft === undefined) {
      return apiError(
        400,
        "EMPTY_UPDATE",
        "No conversation state was provided.",
      );
    }
    if (body.archived !== undefined && typeof body.archived !== "boolean") {
      return apiError(400, "INVALID_ARCHIVE", "Archive state is invalid.");
    }
    if (
      body.draft !== undefined &&
      (typeof body.draft !== "string" || body.draft.length > 4000)
    ) {
      return apiError(
        400,
        "INVALID_DRAFT",
        "Draft must be at most 4,000 characters.",
      );
    }
    await queryDealRoom(
      `update public.deal_room_participants
       set archived_at = case when $3::boolean is null then archived_at
                              when $3 then now() else null end,
           draft_text = coalesce($4, draft_text),
           draft_updated_at = case when $4::text is null then draft_updated_at else now() end
       where room_id = $1 and lower(wallet_address) = lower($2)`,
      [roomId, session.address, body.archived ?? null, body.draft ?? null],
    );
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(
      403,
      "STATE_UPDATE_DENIED",
      error instanceof Error
        ? error.message
        : "Conversation state update denied.",
    );
  }
}
