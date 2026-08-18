import { apiError, readJsonBody } from "@/services/deal-room/http";
import {
  queryDealRoom,
  requireRoomParticipant,
} from "@/services/deal-room/database";
import { normalizeMessage } from "@/services/deal-room/domain";
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
    await requireRoomParticipant(roomId, session.address);
    const before = new URL(request.url).searchParams.get("before");
    const result = await queryDealRoom(
      `select id, sender_address, message_type, body, agreement_version,
              created_at, edited_at, message_payload, message_sequence
       from public.deal_room_messages
       where room_id = $1 and ($2::timestamptz is null or created_at < $2)
       order by created_at desc, id desc limit 50`,
      [roomId, before],
    );
    return Response.json({
      messages: result.rows.reverse(),
      nextCursor:
        result.rows.length === 50 ? result.rows.at(-1)?.created_at : null,
    });
  } catch {
    return apiError(403, "MESSAGE_ACCESS_DENIED", "Messages are unavailable.");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const session = await requireWalletSession();
    await requireStepUpIfEnabled(session.address);
    const { roomId } = await params;
    await requireRoomParticipant(roomId, session.address);
    const recent = await queryDealRoom<{ count: string }>(
      `select count(*)::text as count from public.deal_room_messages
       where room_id = $1 and lower(sender_address) = lower($2)
         and created_at > now() - interval '1 minute'`,
      [roomId, session.address],
    );
    if (Number(recent.rows[0]?.count ?? 0) >= 20) {
      return apiError(
        429,
        "MESSAGE_RATE_LIMIT",
        "Wait before sending more messages.",
      );
    }
    const body = (await readJsonBody(request, 8_192)) as Record<
      string,
      unknown
    >;
    const clientId = typeof body.clientId === "string" ? body.clientId : "";
    if (!/^[0-9a-f-]{36}$/i.test(clientId)) {
      return apiError(400, "INVALID_CLIENT_ID", "Message ID is invalid.");
    }
    const message = normalizeMessage(String(body.message ?? ""));
    const payload =
      body.messagePayload &&
      typeof body.messagePayload === "object" &&
      [
        "text",
        "attachment",
        "agreement-draft",
        "delivery-proof",
        "escrow-status",
      ].includes(String((body.messagePayload as { kind?: unknown }).kind))
        ? body.messagePayload
        : { kind: "text" };
    const result = await queryDealRoom(
      `insert into public.deal_room_messages
       (room_id, sender_address, client_id, body, message_payload)
       values ($1, $2, $3, $4, $5)
       on conflict (room_id, client_id) do update set body = excluded.body
       where false
       returning id, sender_address, message_type, body, created_at`,
      [roomId, session.address, clientId, message, JSON.stringify(payload)],
    );
    if (!result.rows[0]) {
      return apiError(409, "DUPLICATE_MESSAGE", "Message already received.");
    }
    return Response.json({ message: result.rows[0] }, { status: 201 });
  } catch (error) {
    return apiError(
      400,
      "MESSAGE_SEND_FAILED",
      error instanceof Error ? error.message : "Message could not be sent.",
    );
  }
}
