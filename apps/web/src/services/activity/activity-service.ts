import {
  createPublicClient,
  getAddress,
  http,
  type Address,
  type PublicClient,
} from "viem";

import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";
import { decodeEscrowStatus } from "@/features/escrow/escrow-lifecycle";
import {
  isSupportedEventName,
  type RawEscrowEvent,
} from "@/features/live/live-escrow-model";

import type {
  ActivityApiEscrow,
  ActivityApiEvent,
  ActivityApiPage,
  ActivityEventName,
  ActivityStatus,
} from "./activity-types";
import {
  deduplicateLogs,
  generateBlockChunks,
  isRangeLimitError,
  isRetryableRpcError,
  mapWithConcurrency,
  scanAdaptiveRange,
  withRpcRetry,
} from "./activity-utils";

export const DEFAULT_CHUNK_SIZE = 2_000n;
export const CHUNKS_PER_RESPONSE = 5n;
const historicalLogCache = new Map<string, RawEscrowEvent[]>();
const blockTimestampCache = new Map<bigint, number>();

type ContractEscrow = {
  id: bigint;
  buyer: Address;
  seller: Address;
  amount: bigint;
  deadline: bigint;
  status: number;
  metadataURI: string;
  deliveryURI: string;
  createdAt: bigint;
  deliveredAt: bigint;
  completedAt: bigint;
};

function developmentLog(message: string, data: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[AccordPay activity] ${message} ${JSON.stringify(data)}`);
  }
}

function createGiwaClient() {
  return createPublicClient({
    chain: giwaSepolia,
    transport: http(giwaSepolia.rpcUrls.default.http[0], {
      timeout: 15_000,
      retryCount: 0,
    }),
  });
}

async function fetchLogs(
  client: PublicClient,
  fromBlock: bigint,
  toBlock: bigint,
  latestBlock: bigint,
) {
  const cacheKey = `${fromBlock}:${toBlock}`;
  const historical = toBlock < latestBlock - DEFAULT_CHUNK_SIZE;
  if (historical && historicalLogCache.has(cacheKey)) {
    return historicalLogCache.get(cacheKey)!;
  }
  developmentLog("RPC request", {
    endpoint: giwaSepolia.rpcUrls.default.http[0],
    chainId: giwaSepolia.id,
    latestBlock: latestBlock.toString(),
    requestedRange: `${fromBlock}-${toBlock}`,
    chunkSize: (toBlock - fromBlock + 1n).toString(),
    event: "supported AccordPay events",
    method: "eth_getLogs",
  });
  const result = (await withRpcRetry(
    () =>
      client.getContractEvents({
        address: accordPayEscrowContract.address,
        abi: accordPayEscrowContract.abi,
        fromBlock,
        toBlock,
        strict: true,
      }),
    (retryCount) =>
      developmentLog("retry", {
        method: "eth_getLogs",
        retryCount,
        errorCode: "TRANSIENT_RPC_ERROR",
      }),
  )) as RawEscrowEvent[];
  const supported = result.filter((log) => isSupportedEventName(log.eventName));
  developmentLog("RPC result", {
    method: "eth_getLogs",
    requestedRange: `${fromBlock}-${toBlock}`,
    logsReturned: supported.length,
  });
  if (historical) historicalLogCache.set(cacheKey, supported);
  return supported;
}

export async function loadActivityPage({
  wallet,
  cursor,
  event,
  status,
  client = createGiwaClient(),
}: {
  wallet: Address;
  cursor: bigint;
  event?: ActivityEventName;
  status?: ActivityStatus;
  client?: PublicClient;
}): Promise<ActivityApiPage> {
  const latestBlock = await withRpcRetry(() => client.getBlockNumber());
  const deploymentBlock = BigInt(accordPayEscrowContract.deploymentBlock);
  const pageEnd =
    cursor + DEFAULT_CHUNK_SIZE * CHUNKS_PER_RESPONSE - 1n < latestBlock
      ? cursor + DEFAULT_CHUNK_SIZE * CHUNKS_PER_RESPONSE - 1n
      : latestBlock;
  const ranges = generateBlockChunks(cursor, pageEnd, DEFAULT_CHUNK_SIZE);
  const rangeResults = await mapWithConcurrency(ranges, 2, (range) =>
    scanAdaptiveRange(
      range.fromBlock,
      range.toBlock,
      (from, to) => fetchLogs(client, from, to, latestBlock),
      DEFAULT_CHUNK_SIZE,
    ),
  );
  const logs = deduplicateLogs(
    rangeResults.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    ),
  );
  const warnings: string[] = [];
  if (rangeResults.some((result) => result.status === "rejected")) {
    warnings.push("One or more activity ranges could not be loaded.");
  }

  const resolver = getAddress(
    (await withRpcRetry(() =>
      client.readContract({
        address: accordPayEscrowContract.address,
        abi: accordPayEscrowContract.abi,
        functionName: "resolver",
      }),
    )) as Address,
  );
  const ids = [
    ...new Set(
      logs
        .map((log) => log.args?.escrowId)
        .filter((id): id is bigint => typeof id === "bigint"),
    ),
  ];
  const escrowReads = await mapWithConcurrency(ids, 4, async (id) => {
    const value = (await withRpcRetry(() =>
      client.readContract({
        address: accordPayEscrowContract.address,
        abi: accordPayEscrowContract.abi,
        functionName: "getEscrow",
        args: [id],
      }),
    )) as ContractEscrow;
    const decoded = decodeEscrowStatus(Number(value.status));
    if (!decoded) throw new Error(`Unknown escrow status ${value.status}.`);
    return {
      id: value.id.toString(),
      buyer: getAddress(value.buyer),
      seller: getAddress(value.seller),
      amount: value.amount.toString(),
      deadline: value.deadline.toString(),
      status: decoded,
    } satisfies ActivityApiEscrow;
  });
  const escrows = escrowReads.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  if (escrowReads.some((result) => result.status === "rejected")) {
    for (const result of escrowReads) {
      if (result.status === "rejected") {
        developmentLog("enrichment failure", {
          method: "eth_call:getEscrow",
          errorCode:
            result.reason instanceof Error
              ? result.reason.name
              : "ESCROW_READ_ERROR",
          message:
            result.reason instanceof Error
              ? result.reason.message
              : "Escrow read failed.",
        });
      }
    }
    warnings.push("Some escrow records could not be enriched.");
  }
  const escrowMap = new Map(escrows.map((escrow) => [escrow.id, escrow]));

  const relevantLogs = logs.filter((log) => {
    const id = log.args?.escrowId;
    if (typeof id !== "bigint") return false;
    const escrow = escrowMap.get(id.toString());
    if (!escrow) return false;
    const account = wallet.toLowerCase();
    const participant =
      escrow.buyer.toLowerCase() === account ||
      escrow.seller.toLowerCase() === account;
    const resolverEvent =
      resolver.toLowerCase() === account &&
      ["DisputeRaised", "DisputeResolved"].includes(log.eventName ?? "");
    return participant || resolverEvent;
  });
  const blocks = [
    ...new Set(
      relevantLogs
        .map((log) => log.blockNumber)
        .filter((block): block is bigint => block != null),
    ),
  ];
  const uncachedBlocks = blocks.filter(
    (block) => !blockTimestampCache.has(block),
  );
  const blockReads = await mapWithConcurrency(
    uncachedBlocks,
    4,
    async (block) => {
      const value = await withRpcRetry(() =>
        client.getBlock({ blockNumber: block }),
      );
      return [block, Number(value.timestamp)] as const;
    },
  );
  for (const result of blockReads) {
    if (result.status === "fulfilled") {
      blockTimestampCache.set(result.value[0], result.value[1]);
    }
  }
  if (blockReads.some((result) => result.status === "rejected")) {
    warnings.push("Some block timestamps are temporarily unavailable.");
  }

  const events: ActivityApiEvent[] = relevantLogs.flatMap((log) => {
    if (
      !isSupportedEventName(log.eventName) ||
      !log.transactionHash ||
      log.blockNumber == null ||
      log.logIndex == null
    ) {
      return [];
    }
    const id = log.args?.escrowId;
    if (typeof id !== "bigint") return [];
    const escrow = escrowMap.get(id.toString());
    if (
      !escrow ||
      (event && log.eventName !== event) ||
      (status && escrow.status !== status)
    ) {
      return [];
    }
    return [
      {
        key: `${log.transactionHash}:${log.logIndex}`,
        eventName: log.eventName,
        escrowId: id.toString(),
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber.toString(),
        logIndex: log.logIndex,
        timestamp: blockTimestampCache.get(log.blockNumber) ?? null,
      },
    ];
  });
  const relevantEscrows = escrows.filter((escrow) => {
    const account = wallet.toLowerCase();
    return (
      escrow.buyer.toLowerCase() === account ||
      escrow.seller.toLowerCase() === account ||
      (resolver.toLowerCase() === account && escrow.status === "disputed")
    );
  });
  const totalRanges = Number(
    (latestBlock - deploymentBlock + DEFAULT_CHUNK_SIZE) / DEFAULT_CHUNK_SIZE,
  );
  const completedRanges = Number(
    (pageEnd - deploymentBlock + DEFAULT_CHUNK_SIZE) / DEFAULT_CHUNK_SIZE,
  );

  return {
    chainId: 91342,
    wallet,
    resolver,
    events,
    escrows: relevantEscrows,
    nextCursor: pageEnd < latestBlock ? (pageEnd + 1n).toString() : null,
    progress: {
      completedRanges: Math.min(completedRanges, totalRanges),
      totalRanges,
      latestBlock: latestBlock.toString(),
      chunkSize: Number(DEFAULT_CHUNK_SIZE),
    },
    partial: warnings.length > 0,
    warnings,
  };
}

export function safeActivityError(error: unknown, method = "eth_getLogs") {
  const retryable = isRetryableRpcError(error) || isRangeLimitError(error);
  const source = error as { code?: unknown; name?: unknown };
  return {
    error: {
      code:
        typeof source?.code === "number" || typeof source?.code === "string"
          ? String(source.code)
          : typeof source?.name === "string"
            ? source.name
            : "GIWA_RPC_ERROR",
      method,
      retryable,
      message: retryable
        ? "GIWA Sepolia activity is temporarily unavailable. Retry shortly."
        : "The activity request could not be completed.",
    },
  };
}
