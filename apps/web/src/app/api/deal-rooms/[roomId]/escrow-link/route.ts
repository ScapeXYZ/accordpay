import { createPublicClient, decodeEventLog, http } from "viem";

import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";
import { apiError, readJsonBody } from "@/services/deal-room/http";
import {
  requireRoomParticipant,
  withDealRoomTransaction,
} from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";

const client = createPublicClient({
  chain: giwaSepolia,
  transport: http(
    process.env.GIWA_RPC_URL || giwaSepolia.rpcUrls.default.http[0],
  ),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const session = await requireWalletSession();
    const { roomId } = await params;
    const participant = await requireRoomParticipant(roomId, session.address);
    if (participant.role !== "buyer") {
      return apiError(
        403,
        "BUYER_ONLY",
        "Only the Deal Room buyer may link its funded escrow.",
      );
    }
    const body = (await readJsonBody(request, 4_096)) as Record<
      string,
      unknown
    >;
    const escrowId = String(body.escrowId ?? "");
    const transactionHash = String(body.transactionHash ?? "");
    if (
      !/^[1-9]\d*$/.test(escrowId) ||
      !/^0x[0-9a-fA-F]{64}$/.test(transactionHash)
    ) {
      return apiError(
        400,
        "INVALID_ESCROW_LINK",
        "Escrow evidence is invalid.",
      );
    }
    const receipt = await client.getTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });
    const created = receipt.logs.some((log) => {
      try {
        const decoded = decodeEventLog({
          abi: accordPayEscrowContract.abi,
          data: log.data,
          topics: log.topics,
          eventName: "EscrowCreated",
        });
        const args = decoded.args as unknown as {
          escrowId: bigint;
          buyer: string;
        };
        return (
          decoded.eventName === "EscrowCreated" &&
          args.escrowId === BigInt(escrowId) &&
          args.buyer.toLowerCase() === session.address.toLowerCase()
        );
      } catch {
        return false;
      }
    });
    if (!created) {
      return apiError(
        409,
        "ESCROW_EVENT_NOT_FOUND",
        "The confirmed EscrowCreated event does not match this room.",
      );
    }
    await withDealRoomTransaction(async (database) => {
      await database.query(
        `insert into public.room_escrow_links
         (room_id, chain_id, contract_address, escrow_id, creation_transaction)
         values ($1, 91342, $2, $3, $4)`,
        [roomId, accordPayEscrowContract.address, escrowId, transactionHash],
      );
      await database.query(
        `update public.deal_rooms set escrow_id = $2, status = 'funded',
         updated_at = now() where id = $1`,
        [roomId, escrowId],
      );
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(
      400,
      "ESCROW_LINK_FAILED",
      error instanceof Error ? error.message : "Escrow link failed.",
    );
  }
}
