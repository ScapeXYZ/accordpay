import { accordPayEscrowContract } from "@/config/contracts";
import { apiError, readJsonBody } from "@/services/deal-room/http";
import {
  requireRoomParticipant,
  withDealRoomTransaction,
} from "@/services/deal-room/database";
import {
  hashCanonicalAgreement,
  type AgreementContent,
} from "@/services/deal-room/domain";
import { requireWalletSession } from "@/services/deal-room/session";

function validateAgreement(value: unknown): AgreementContent {
  const content = value as Partial<AgreementContent>;
  if (
    !content ||
    content.schemaVersion !== "1.0" ||
    typeof content.title !== "string" ||
    content.title.trim().length < 3 ||
    typeof content.description !== "string" ||
    !Array.isArray(content.deliverables) ||
    !Array.isArray(content.acceptanceCriteria) ||
    !content.buyer ||
    !content.seller ||
    content.chainId !== 91342 ||
    typeof content.contractAddress !== "string" ||
    content.contractAddress.toLowerCase() !==
      accordPayEscrowContract.address.toLowerCase()
  ) {
    throw new Error("Agreement content is incomplete or inconsistent.");
  }
  return content as AgreementContent;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const session = await requireWalletSession();
    const { roomId } = await params;
    await requireRoomParticipant(roomId, session.address);
    const body = (await readJsonBody(request, 64 * 1024)) as {
      content?: unknown;
    };
    const content = validateAgreement(body.content);
    if (content.roomId !== roomId) {
      return apiError(400, "ROOM_MISMATCH", "Agreement room ID is invalid.");
    }
    const contentHash = hashCanonicalAgreement(content);
    const result = await withDealRoomTransaction(async (client) => {
      const room = await client.query<{
        current_version: number;
        buyer_address: string;
        seller_address: string;
        status: string;
      }>(
        `select current_version, buyer_address, seller_address, status
         from public.deal_rooms where id = $1 for update`,
        [roomId],
      );
      const current = room.rows[0];
      if (!current || current.status === "archived") {
        throw new Error("Archived rooms cannot create new versions.");
      }
      if (
        current.buyer_address.toLowerCase() !== content.buyer.toLowerCase() ||
        current.seller_address.toLowerCase() !== content.seller.toLowerCase()
      ) {
        throw new Error("Agreement parties must match the Deal Room.");
      }
      const version = current.current_version + 1;
      const inserted = await client.query(
        `insert into public.agreement_versions
         (room_id, version, canonical_content, content_hash, privacy_mode,
          created_by, previous_version_id)
         values ($1, $2, $3, $4, $5, $6,
           (select id from public.agreement_versions where room_id = $1
            order by version desc limit 1))
         returning id, version, content_hash`,
        [
          roomId,
          version,
          JSON.stringify({ ...content, version }),
          contentHash,
          content.privacyMode,
          session.address,
        ],
      );
      await client.query(
        `update public.deal_rooms
         set current_version = $2, status = 'negotiating', updated_at = now()
         where id = $1`,
        [roomId, version],
      );
      await client.query(
        `insert into public.deal_room_messages
         (room_id, sender_address, client_id, message_type, body, agreement_version)
         values ($1, $2, gen_random_uuid(), 'system', $3, $4)`,
        [
          roomId,
          session.address,
          `Agreement version ${version} proposed. Previous approvals are no longer current.`,
          version,
        ],
      );
      return inserted.rows[0];
    });
    return Response.json({ agreement: result }, { status: 201 });
  } catch (error) {
    return apiError(
      400,
      "AGREEMENT_VERSION_FAILED",
      error instanceof Error
        ? error.message
        : "Agreement version could not be created.",
    );
  }
}
