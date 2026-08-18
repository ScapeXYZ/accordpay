import { createPublicClient, getAddress, http } from "viem";

import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";
import { apiError, readJsonBody } from "@/services/deal-room/http";
import { queryDealRoom } from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";
import { validateEscrowUri } from "@/features/escrow/uri-validation";

const client = createPublicClient({
  chain: giwaSepolia,
  transport: http(
    process.env.GIWA_RPC_URL || giwaSepolia.rpcUrls.default.http[0],
  ),
});

export async function GET() {
  try {
    const session = await requireWalletSession();
    const resolver = getAddress(
      (await client.readContract({
        ...accordPayEscrowContract,
        functionName: "resolver",
      })) as string,
    );
    if (resolver.toLowerCase() !== session.address.toLowerCase()) {
      return apiError(
        403,
        "RESOLVER_ONLY",
        "Only the designated testnet resolver may view the resolver queue.",
      );
    }
    const result = await queryDealRoom(
      `select * from public.dispute_cases
       where contract_status in ('pending', 'disputed')
       order by created_at asc limit 100`,
    );
    return Response.json({ resolver, cases: result.rows });
  } catch (error) {
    return apiError(
      503,
      "DISPUTE_QUEUE_UNAVAILABLE",
      error instanceof Error ? error.message : "Disputes are unavailable.",
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireWalletSession();
    const body = (await readJsonBody(request, 16_384)) as Record<
      string,
      unknown
    >;
    const escrowId = String(body.escrowId ?? "");
    const reason = String(body.reason ?? "").trim();
    const evidenceUri = String(body.evidenceUri ?? "").trim();
    if (
      !/^[1-9]\d*$/.test(escrowId) ||
      reason.length < 10 ||
      reason.length > 4_000
    ) {
      return apiError(
        400,
        "INVALID_DISPUTE",
        "Provide a valid agreement ID and a 10–4,000 character reason.",
      );
    }
    if (evidenceUri && !validateEscrowUri(evidenceUri).valid) {
      return apiError(
        400,
        "INVALID_EVIDENCE_URI",
        "Use a valid HTTPS, IPFS, or Arweave evidence URI.",
      );
    }
    const escrow = (await client.readContract({
      ...accordPayEscrowContract,
      functionName: "getEscrow",
      args: [BigInt(escrowId)],
    })) as {
      buyer: `0x${string}`;
      seller: `0x${string}`;
      status: number;
    };
    const caller = session.address.toLowerCase();
    if (
      escrow.buyer.toLowerCase() !== caller &&
      escrow.seller.toLowerCase() !== caller
    ) {
      return apiError(
        403,
        "NOT_ESCROW_PARTY",
        "Only the escrow buyer or seller may create a dispute case.",
      );
    }
    if (Number(escrow.status) !== 0 && Number(escrow.status) !== 1) {
      return apiError(
        409,
        "INVALID_ESCROW_STATE",
        "Only Funded or Delivered escrows may be disputed.",
      );
    }
    const result = await queryDealRoom<{ id: string }>(
      `insert into public.dispute_cases
       (room_id, escrow_id, raised_by, reason, contract_status)
       values (
         (select room_id from public.room_escrow_links
          where chain_id = 91342 and lower(contract_address) = lower($1)
            and escrow_id = $2),
         $2, $3, $4, 'pending'
       ) returning id`,
      [accordPayEscrowContract.address, escrowId, session.address, reason],
    );
    const disputeCaseId = result.rows[0].id;
    if (evidenceUri) {
      await queryDealRoom(
        `insert into public.dispute_evidence
         (dispute_case_id, submitted_by, evidence_uri) values ($1, $2, $3)`,
        [disputeCaseId, session.address, evidenceUri],
      );
    }
    return Response.json({ disputeCaseId }, { status: 201 });
  } catch (error) {
    return apiError(
      400,
      "DISPUTE_CREATE_FAILED",
      error instanceof Error ? error.message : "Dispute case was not created.",
    );
  }
}
