import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";
import { getActivityIndex } from "@/services/activity/activity-index";
import {
  ensureActivitySyncStarted,
  getSyncProgress,
} from "@/services/activity/activity-sync";
import { validateActivityQuery } from "@/services/activity/activity-validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const validation = validateActivityQuery(params);
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  const limitValue = Number(params.get("limit") ?? "100");
  const limit = Number.isInteger(limitValue)
    ? Math.min(Math.max(limitValue, 1), 250)
    : 100;
  const escrowValue = params.get("escrowId");
  let escrowId: bigint | undefined;
  if (escrowValue) {
    try {
      escrowId = BigInt(escrowValue);
    } catch {
      return Response.json(
        {
          error: {
            code: "INVALID_ESCROW_ID",
            method: "validation",
            retryable: false,
            message: "The escrow ID filter is invalid.",
          },
        },
        { status: 400 },
      );
    }
  }

  try {
    const index = await getActivityIndex();
    ensureActivitySyncStarted();
    const [result, sync] = await Promise.all([
      index.query({
        wallet: validation.wallet,
        escrowId,
        event: validation.event,
        status: validation.status,
        cursor: params.get("cursor") ?? undefined,
        limit,
      }),
      getSyncProgress(),
    ]);
    const escrowMap = new Map(
      result.events.map((event) => [
        event.escrowId.toString(),
        {
          id: event.escrowId.toString(),
          buyer: event.buyer,
          seller: event.seller,
          amount: event.amount.toString(),
          deadline:
            typeof event.rawEventData._escrowDeadline === "string"
              ? event.rawEventData._escrowDeadline
              : "0",
          status: event.currentState,
        },
      ]),
    );
    return Response.json(
      {
        chainId: 91342,
        wallet: validation.wallet,
        resolver: "",
        events: result.events.map((event) => ({
          key: `${event.transactionHash}:${event.logIndex}`,
          eventName: event.eventName,
          escrowId: event.escrowId.toString(),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber.toString(),
          logIndex: event.logIndex,
          timestamp: event.blockTimestamp,
        })),
        escrows: [...escrowMap.values()],
        nextCursor: result.nextCursor,
        progress: {
          completedRanges: sync.completedRanges,
          totalRanges: sync.totalRanges,
          latestBlock: sync.targetBlock ?? "0",
          chunkSize: 2000,
        },
        sync: {
          running: sync.running,
          complete: sync.complete,
          lastSyncedBlock: sync.lastSyncedBlock,
          targetBlock: sync.targetBlock,
        },
        partial: false,
        warnings: [],
        contractAddress: accordPayEscrowContract.address,
        network: giwaSepolia.name,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=2, stale-while-revalidate=5",
        },
      },
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[AccordPay index] query failed", error);
    }
    return Response.json(
      {
        error: {
          code: "ACTIVITY_INDEX_ERROR",
          method: "indexed activity query",
          retryable: true,
          message: "Indexed AccordPay activity is temporarily unavailable.",
        },
      },
      { status: 503 },
    );
  }
}
