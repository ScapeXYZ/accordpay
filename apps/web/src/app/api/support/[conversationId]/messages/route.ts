import { apiError, readJsonBody } from "@/services/deal-room/http";
import { normalizeMessage } from "@/services/deal-room/domain";
import { queryDealRoom } from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";
import { requireStepUpIfEnabled } from "@/services/deal-room/step-up";

async function supportAccess(conversationId: string, wallet: string) {
  const result = await queryDealRoom<{
    user_wallet: string;
    is_agent: boolean;
  }>(
    `select c.user_wallet, exists (
       select 1 from public.support_agents a
       where lower(a.wallet_address) = lower($2) and a.enabled = true
     ) as is_agent
     from public.support_conversations c where c.id = $1`,
    [conversationId, wallet],
  );
  const row = result.rows[0];
  if (
    !row ||
    (row.user_wallet.toLowerCase() !== wallet.toLowerCase() && !row.is_agent)
  ) {
    throw new Error("Support conversation access denied.");
  }
  return {
    kind:
      row.user_wallet.toLowerCase() === wallet.toLowerCase()
        ? ("user" as const)
        : ("support" as const),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const session = await requireWalletSession();
    await requireStepUpIfEnabled(session.address);
    const { conversationId } = await params;
    const access = await supportAccess(conversationId, session.address);
    const result = await queryDealRoom(
      `select id, sender_wallet, sender_kind, body, message_payload,
              message_sequence, created_at
       from public.support_messages where conversation_id = $1
       order by message_sequence asc limit 200`,
      [conversationId],
    );
    await queryDealRoom(
      `update public.support_conversations
       set ${access.kind === "user" ? "user_last_read_sequence" : "agent_last_read_sequence"}
         = coalesce((select max(message_sequence) from public.support_messages
           where conversation_id = $1), 0)
       where id = $1`,
      [conversationId],
    );
    return Response.json({ messages: result.rows, viewerKind: access.kind });
  } catch {
    return apiError(403, "SUPPORT_ACCESS_DENIED", "Support access denied.");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const session = await requireWalletSession();
    await requireStepUpIfEnabled(session.address);
    const { conversationId } = await params;
    const access = await supportAccess(conversationId, session.address);
    const body = (await readJsonBody(request, 8_192)) as Record<
      string,
      unknown
    >;
    const message = normalizeMessage(String(body.message ?? ""));
    const clientId = String(body.clientId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(clientId)) {
      return apiError(400, "INVALID_CLIENT_ID", "Message ID is invalid.");
    }
    const inserted = await queryDealRoom(
      `insert into public.support_messages
       (conversation_id, sender_wallet, sender_kind, client_id, body)
       values ($1, $2, $3, $4, $5)
       on conflict (conversation_id, client_id) do nothing returning id`,
      [conversationId, session.address, access.kind, clientId, message],
    );
    if (!inserted.rows[0]) {
      return apiError(409, "DUPLICATE_MESSAGE", "Message already received.");
    }
    await queryDealRoom(
      `update public.support_conversations set updated_at = now(),
       status = $2 where id = $1`,
      [
        conversationId,
        access.kind === "user" ? "waiting_for_support" : "waiting_for_user",
      ],
    );
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return apiError(
      400,
      "SUPPORT_MESSAGE_FAILED",
      error instanceof Error ? error.message : "Support message failed.",
    );
  }
}
