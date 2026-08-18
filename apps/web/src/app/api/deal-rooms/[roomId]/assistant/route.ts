import { apiError, readJsonBody } from "@/services/deal-room/http";
import {
  queryDealRoom,
  requireRoomParticipant,
} from "@/services/deal-room/database";
import { createAgreementAssistant } from "@/services/deal-room/assistant";
import type { AgreementContent } from "@/services/deal-room/domain";
import { requireWalletSession } from "@/services/deal-room/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const session = await requireWalletSession();
    const { roomId } = await params;
    await requireRoomParticipant(roomId, session.address);
    const body = (await readJsonBody(request, 64 * 1024)) as {
      current?: AgreementContent;
      includeConversation?: boolean;
      externalProcessingConsent?: boolean;
    };
    if (!body.current || body.current.roomId !== roomId) {
      return apiError(
        400,
        "INVALID_ASSISTANT_INPUT",
        "Provide the current structured agreement draft.",
      );
    }
    const assistant = createAgreementAssistant();
    if (
      assistant.provider !== "deterministic" &&
      !body.externalProcessingConsent
    ) {
      return apiError(
        403,
        "AI_CONSENT_REQUIRED",
        "Explicit room consent is required before external processing.",
      );
    }
    const messages = body.includeConversation
      ? (
          await queryDealRoom<{ body: string }>(
            `select body from public.deal_room_messages
             where room_id = $1 and message_type = 'text'
             order by message_sequence desc limit 50`,
            [roomId],
          )
        ).rows
          .reverse()
          .map((row) => row.body)
      : [];
    const proposal = await assistant.propose({
      current: body.current,
      messages,
      externalProcessingConsent: Boolean(body.externalProcessingConsent),
    });
    await queryDealRoom(
      `insert into public.assistant_runs
       (room_id, requested_by, provider, consented_external_processing,
        input_scope, proposal, status)
       values ($1, $2, $3, $4, $5, $6, 'proposal')`,
      [
        roomId,
        session.address,
        assistant.provider,
        Boolean(body.externalProcessingConsent),
        JSON.stringify({
          structuredDraft: true,
          conversation: Boolean(body.includeConversation),
        }),
        JSON.stringify(proposal),
      ],
    );
    await queryDealRoom(
      `insert into public.deal_room_messages
       (room_id, sender_address, client_id, message_type, body, message_payload,
        agreement_version)
       values ($1, $2, gen_random_uuid(), 'assistant',
         'AI agreement draft generated for participant review.', $3, $4)`,
      [
        roomId,
        session.address,
        JSON.stringify({
          kind: "agreement-draft",
          proposal: proposal.proposal,
          missingFields: proposal.missingFields,
          final: false,
        }),
        body.current.version,
      ],
    );
    return Response.json({
      provider: assistant.provider,
      proposal,
      notice:
        "Assistant output is a proposal only. Buyer and seller must review and approve the same final version.",
    });
  } catch (error) {
    return apiError(
      400,
      "ASSISTANT_FAILED",
      error instanceof Error
        ? error.message
        : "The deterministic assistant is unavailable.",
    );
  }
}
