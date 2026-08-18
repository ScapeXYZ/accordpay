import { apiError, readJsonBody } from "@/services/deal-room/http";
import { queryDealRoom } from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  try {
    const session = await requireWalletSession();
    const { caseId } = await params;
    const body = (await readJsonBody(request, 8_192)) as Record<
      string,
      unknown
    >;
    const transactionHash = String(body.transactionHash ?? "");
    const blockNumber = String(body.blockNumber ?? "");
    if (
      !/^0x[0-9a-fA-F]{64}$/.test(transactionHash) ||
      !/^\d+$/.test(blockNumber)
    ) {
      return apiError(400, "INVALID_RECEIPT", "Receipt evidence is invalid.");
    }
    const result = await queryDealRoom(
      `update public.dispute_cases set transaction_hash = $1,
       block_number = $2, contract_status = 'disputed', updated_at = now()
       where id = $3 and lower(raised_by) = lower($4)
         and transaction_hash is null returning id`,
      [transactionHash, blockNumber, caseId, session.address],
    );
    if (!result.rows[0]) {
      return apiError(403, "CASE_UPDATE_DENIED", "Dispute case update denied.");
    }
    return Response.json({ ok: true });
  } catch {
    return apiError(400, "CASE_UPDATE_FAILED", "Dispute case update failed.");
  }
}
