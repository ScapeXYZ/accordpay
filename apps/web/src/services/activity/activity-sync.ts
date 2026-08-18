import { createPublicClient, getAddress, http, type Address } from "viem";

import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";
import { decodeEscrowStatus } from "@/features/escrow/escrow-lifecycle";

import { getActivityIndex, type IndexedActivityEvent } from "./activity-index";
import { chooseSyncStart, SingleFlight } from "./activity-index-model";
import {
  deduplicateLogs,
  generateBlockChunks,
  mapWithConcurrency,
  withRpcRetry,
} from "./activity-utils";
import { refreshLinkedRoomStates } from "@/services/deal-room/database";
import { DEFAULT_CHUNK_SIZE } from "./activity-service";
import type { ActivityEventName } from "./activity-types";

const REORG_OVERLAP = 20n;

type ContractEscrow = {
  id: bigint;
  buyer: Address;
  seller: Address;
  amount: bigint;
  deadline: bigint;
  status: number;
};

type SyncLog = {
  eventName?: string;
  args?: Record<string, unknown>;
  transactionHash?: `0x${string}` | null;
  blockNumber?: bigint | null;
  logIndex?: number | null;
};

export type SyncProgress = {
  running: boolean;
  lastSyncedBlock: string | null;
  targetBlock: string | null;
  completedRanges: number;
  totalRanges: number;
  complete: boolean;
};

const client = createPublicClient({
  chain: giwaSepolia,
  transport: http(
    process.env.GIWA_RPC_URL?.trim() || giwaSepolia.rpcUrls.default.http[0],
    { timeout: 15_000, retryCount: 0 },
  ),
});

const synchronizationLock = new SingleFlight<SyncProgress>();

function rawData(value: Record<string, unknown> | undefined) {
  return JSON.parse(
    JSON.stringify(value ?? {}, (_, item) =>
      typeof item === "bigint" ? item.toString() : item,
    ),
  ) as Record<string, unknown>;
}

function progress(
  lastSyncedBlock: bigint | null,
  targetBlock: bigint | null,
  running: boolean,
): SyncProgress {
  const deployment = BigInt(accordPayEscrowContract.deploymentBlock);
  const totalRanges =
    targetBlock == null
      ? 0
      : Number(
          (targetBlock - deployment + DEFAULT_CHUNK_SIZE) / DEFAULT_CHUNK_SIZE,
        );
  const completedRanges =
    lastSyncedBlock == null
      ? 0
      : Number(
          (lastSyncedBlock - deployment + DEFAULT_CHUNK_SIZE) /
            DEFAULT_CHUNK_SIZE,
        );
  return {
    running,
    lastSyncedBlock: lastSyncedBlock?.toString() ?? null,
    targetBlock: targetBlock?.toString() ?? null,
    completedRanges: Math.max(0, Math.min(completedRanges, totalRanges)),
    totalRanges,
    complete:
      lastSyncedBlock != null &&
      targetBlock != null &&
      lastSyncedBlock >= targetBlock,
  };
}

async function synchronize(maxChunks: number): Promise<SyncProgress> {
  const index = await getActivityIndex();
  const contractAddress = accordPayEscrowContract.address.toLowerCase();
  const release = await index.acquireSyncLock(
    `${giwaSepolia.id}:${contractAddress}`,
  );
  if (!release) {
    const current = await index.getCheckpoint(giwaSepolia.id, contractAddress);
    return progress(current.lastSyncedBlock, current.targetBlock, true);
  }
  try {
    const deployment = BigInt(accordPayEscrowContract.deploymentBlock);
    const checkpoint = await index.getCheckpoint(
      giwaSepolia.id,
      contractAddress,
    );
    const latest = await withRpcRetry(() => client.getBlockNumber());
    const start = chooseSyncStart({
      deploymentBlock: deployment,
      lastSyncedBlock: checkpoint.lastSyncedBlock,
      previousTargetBlock: checkpoint.targetBlock,
      overlap: REORG_OVERLAP,
    });
    const ranges = generateBlockChunks(start, latest, DEFAULT_CHUNK_SIZE).slice(
      0,
      maxChunks,
    );
    let lastSynced = checkpoint.lastSyncedBlock;

    for (const range of ranges) {
      const logs = deduplicateLogs(
        (await withRpcRetry(() =>
          client.getContractEvents({
            address: accordPayEscrowContract.address,
            abi: accordPayEscrowContract.abi,
            fromBlock: range.fromBlock,
            toBlock: range.toBlock,
            strict: true,
          }),
        )) as SyncLog[],
      ).filter((log) =>
        [
          "EscrowCreated",
          "DeliveryMarked",
          "FundsReleased",
          "EscrowRefunded",
          "DisputeRaised",
          "DisputeResolved",
        ].includes(log.eventName ?? ""),
      );
      const ids = [
        ...new Set(
          logs
            .map((log) => log.args?.escrowId)
            .filter((id): id is bigint => typeof id === "bigint"),
        ),
      ];
      const escrowResults = await mapWithConcurrency(ids, 4, async (id) => {
        const escrow = (await withRpcRetry(() =>
          client.readContract({
            address: accordPayEscrowContract.address,
            abi: accordPayEscrowContract.abi,
            functionName: "getEscrow",
            args: [id],
          }),
        )) as ContractEscrow;
        const status = decodeEscrowStatus(Number(escrow.status));
        if (!status) throw new Error(`Unknown escrow status ${escrow.status}.`);
        return { ...escrow, status };
      });
      if (escrowResults.some((result) => result.status === "rejected")) {
        throw new Error(
          `Escrow enrichment failed for chunk ${range.fromBlock}-${range.toBlock}.`,
        );
      }
      const escrowMap = new Map(
        escrowResults.flatMap((result) =>
          result.status === "fulfilled"
            ? [[result.value.id, result.value] as const]
            : [],
        ),
      );
      const blockNumbers = [
        ...new Set(
          logs
            .map((log) => log.blockNumber)
            .filter((block): block is bigint => block != null),
        ),
      ];
      const blockResults = await mapWithConcurrency(blockNumbers, 4, (block) =>
        withRpcRetry(() => client.getBlock({ blockNumber: block })),
      );
      const timestamps = new Map(
        blockResults.flatMap((result) =>
          result.status === "fulfilled"
            ? [[result.value.number, Number(result.value.timestamp)] as const]
            : [],
        ),
      );
      const events: IndexedActivityEvent[] = logs.flatMap((log) => {
        const id = log.args?.escrowId;
        if (
          typeof id !== "bigint" ||
          !log.eventName ||
          !log.transactionHash ||
          log.blockNumber == null ||
          log.logIndex == null
        ) {
          return [];
        }
        const escrow = escrowMap.get(id);
        if (!escrow) return [];
        return [
          {
            chainId: giwaSepolia.id,
            contractAddress,
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
            blockNumber: log.blockNumber,
            blockTimestamp: timestamps.get(log.blockNumber) ?? null,
            eventName: log.eventName as ActivityEventName,
            escrowId: id,
            buyer: getAddress(escrow.buyer),
            seller: getAddress(escrow.seller),
            amount: escrow.amount,
            currentState: escrow.status,
            rawEventData: rawData({
              ...log.args,
              _escrowDeadline: escrow.deadline,
            }),
          },
        ];
      });
      await index.persistChunk(events, {
        chainId: giwaSepolia.id,
        contractAddress,
        lastSyncedBlock: range.toBlock,
        targetBlock: latest,
      });
      await refreshLinkedRoomStates().catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[AccordPay Deal Rooms] state propagation skipped",
            error,
          );
        }
      });
      lastSynced = range.toBlock;
    }

    return progress(lastSynced, latest, false);
  } finally {
    await release();
  }
}

export function runActivitySync(maxChunks = 5) {
  return synchronizationLock.run(() => synchronize(maxChunks));
}

export function ensureActivitySyncStarted() {
  if (!synchronizationLock.running)
    void runActivitySync(2).catch(() => undefined);
}

export async function getSyncProgress() {
  const index = await getActivityIndex();
  const checkpoint = await index.getCheckpoint(
    giwaSepolia.id,
    accordPayEscrowContract.address.toLowerCase(),
  );
  return progress(
    checkpoint.lastSyncedBlock,
    checkpoint.targetBlock,
    synchronizationLock.running,
  );
}

export function isSyncRunning() {
  return synchronizationLock.running;
}
