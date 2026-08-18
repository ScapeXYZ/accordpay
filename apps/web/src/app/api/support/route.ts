import { apiError, readJsonBody } from "@/services/deal-room/http";
import { queryDealRoom } from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";
import { normalizeMessage } from "@/services/deal-room/domain";
import { requireStepUpIfEnabled } from "@/services/deal-room/step-up";

export async function GET() {
  try {
    const session = await requireWalletSession();
    await requireStepUpIfEnabled(session.address);
    const result = await queryDealRoom(
      `select c.id, c.subject, c.status, c.created_at, c.updated_at,
        count(m.id) filter (
          where m.message_sequence > c.user_last_read_sequence
            and m.sender_kind = 'support'
        )::text as unread_count
       from public.support_conversations c
       left join public.support_messages m on m.conversation_id = c.id
       where lower(c.user_wallet) = lower($1)
          or exists (
            select 1 from public.support_agents a
            where lower(a.wallet_address) = lower($1) and a.enabled = true
              and (c.assigned_agent is null or lower(c.assigned_agent) = lower($1))
          )
       group by c.id order by c.updated_at desc`,
      [session.address],
    );
    return Response.json({
      configured: process.env.ACCORDPAY_SUPPORT_ENABLED === "true",
      conversations: result.rows,
    });
  } catch (error) {
    return apiError(
      401,
      "SUPPORT_UNAVAILABLE",
      error instanceof Error ? error.message : "Support is unavailable.",
    );
  }
}

export async function POST(request: Request) {
  try {
    if (process.env.ACCORDPAY_SUPPORT_ENABLED !== "true") {
      return apiError(
        503,
        "SUPPORT_OFFLINE",
        "Live support is not configured. Use the offline contact details shown in AccordPay.",
      );
    }
    const session = await requireWalletSession();
    await requireStepUpIfEnabled(session.address);
    const body = (await readJsonBody(request, 8_192)) as Record<
      string,
      unknown
    >;
    const subject = String(body.subject ?? "").trim();
    const message = normalizeMessage(String(body.message ?? ""));
    if (subject.length < 3 || subject.length > 160) {
      return apiError(400, "INVALID_SUBJECT", "Use a 3–160 character subject.");
    }
    const created = await queryDealRoom<{ id: string }>(
      `insert into public.support_conversations(user_wallet, subject)
       values ($1, $2) returning id`,
      [session.address, subject],
    );
    await queryDealRoom(
      `insert into public.support_messages
       (conversation_id, sender_wallet, sender_kind, client_id, body)
       values ($1, $2, 'user', gen_random_uuid(), $3)`,
      [created.rows[0].id, session.address, message],
    );
    return Response.json(
      { conversationId: created.rows[0].id },
      { status: 201 },
    );
  } catch (error) {
    return apiError(
      400,
      "SUPPORT_CREATE_FAILED",
      error instanceof Error ? error.message : "Support request failed.",
    );
  }
}
