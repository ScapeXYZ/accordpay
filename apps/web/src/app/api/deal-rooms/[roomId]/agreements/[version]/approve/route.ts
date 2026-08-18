import { apiError, readJsonBody } from "@/services/deal-room/http";
import {
  requireRoomParticipant,
  withDealRoomTransaction,
} from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";
import { requireStepUpIfEnabled } from "@/services/deal-room/step-up";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string; version: string }> },
) {
  try {
    const session = await requireWalletSession();
    await requireStepUpIfEnabled(session.address);
    const { roomId, version: versionText } = await params;
    const participant = await requireRoomParticipant(roomId, session.address);
    const version = Number(versionText);
    const body = (await readJsonBody(request, 16_384)) as Record<
      string,
      unknown
    >;
    const contentHash =
      typeof body.contentHash === "string" ? body.contentHash : "";
    const signature =
      typeof body.signature === "string" ? body.signature : null;
    const result = await withDealRoomTransaction(async (client) => {
      const room = await client.query<{ current_version: number }>(
        "select current_version from public.deal_rooms where id = $1 for update",
        [roomId],
      );
      if (room.rows[0]?.current_version !== version) {
        throw new Error("This agreement version is stale.");
      }
      const agreement = await client.query<{
        id: string;
        content_hash: string;
      }>(
        `select id, content_hash from public.agreement_versions
         where room_id = $1 and version = $2`,
        [roomId, version],
      );
      const current = agreement.rows[0];
      if (!current || current.content_hash !== contentHash) {
        throw new Error("Content hash does not match the current version.");
      }
      await client.query(
        `insert into public.agreement_approvals
         (agreement_version_id, room_id, approver_address, role, content_hash, signature)
         values ($1, $2, $3, $4, $5, $6)
         on conflict (agreement_version_id, role) do nothing`,
        [
          current.id,
          roomId,
          session.address,
          participant.role,
          contentHash,
          signature,
        ],
      );
      const approvals = await client.query<{ role: string }>(
        `select role from public.agreement_approvals
         where agreement_version_id = $1 and content_hash = $2`,
        [current.id, contentHash],
      );
      const both =
        approvals.rows.some((row) => row.role === "buyer") &&
        approvals.rows.some((row) => row.role === "seller");
      await client.query(
        `update public.deal_rooms set status = $2, updated_at = now() where id = $1`,
        [
          roomId,
          both
            ? "approved"
            : participant.role === "buyer"
              ? "awaiting_seller_approval"
              : "awaiting_buyer_approval",
        ],
      );
      if (both) {
        await client.query(
          "update public.agreement_versions set finalized_at = now() where id = $1",
          [current.id],
        );
      }
      return { bothApproved: both, role: participant.role };
    });
    return Response.json(result);
  } catch (error) {
    return apiError(
      409,
      "APPROVAL_REJECTED",
      error instanceof Error ? error.message : "Approval was rejected.",
    );
  }
}
