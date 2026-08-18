export type ScannableLog = {
  transactionHash?: string | null;
  blockNumber?: bigint | null;
  logIndex?: number | null;
};

export function generateBlockChunks(
  fromBlock: bigint,
  toBlock: bigint,
  chunkSize: bigint,
) {
  if (chunkSize <= 0n || toBlock < fromBlock) return [];
  const chunks: Array<{ fromBlock: bigint; toBlock: bigint }> = [];
  for (let start = fromBlock; start <= toBlock; start += chunkSize) {
    chunks.push({
      fromBlock: start,
      toBlock:
        start + chunkSize - 1n < toBlock ? start + chunkSize - 1n : toBlock,
    });
  }
  return chunks;
}

export function isRetryableRpcError(error: unknown) {
  const text =
    error instanceof Error
      ? `${error.name} ${error.message}`.toLowerCase()
      : String(error).toLowerCase();
  return (
    /429|rate limit|timeout|timed out|network|fetch failed|503|502|temporar/.test(
      text,
    ) && !/abi|decode|invalid address|invalid argument/.test(text)
  );
}

export function isRangeLimitError(error: unknown) {
  const text =
    error instanceof Error ? error.message.toLowerCase() : String(error);
  return /block range|range.*limit|exceeds max|too many blocks|-32602/.test(
    text,
  );
}

async function delay(milliseconds: number) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function withRpcRetry<T>(
  operation: () => Promise<T>,
  onRetry: (retryCount: number) => void = () => undefined,
  retries = 3,
) {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (!isRetryableRpcError(error) || attempt >= retries) throw error;
      onRetry(attempt + 1);
      await delay(250 * 2 ** attempt);
      attempt += 1;
    }
  }
}

export async function mapWithConcurrency<T, R>(
  values: readonly T[],
  limit: number,
  mapper: (value: T) => Promise<R>,
) {
  const results: PromiseSettledResult<R>[] = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      try {
        results[index] = {
          status: "fulfilled",
          value: await mapper(values[index]),
        };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  return results;
}

export async function scanAdaptiveRange<T>(
  fromBlock: bigint,
  toBlock: bigint,
  fetchRange: (from: bigint, to: bigint) => Promise<T[]>,
  initialChunkSize: bigint,
  minimumChunkSize = 125n,
): Promise<T[]> {
  const output: T[] = [];
  let cursor = fromBlock;
  let chunkSize = initialChunkSize;
  while (cursor <= toBlock) {
    const end =
      cursor + chunkSize - 1n < toBlock ? cursor + chunkSize - 1n : toBlock;
    try {
      output.push(...(await fetchRange(cursor, end)));
      cursor = end + 1n;
    } catch (error) {
      if (isRangeLimitError(error) && chunkSize > minimumChunkSize) {
        chunkSize =
          chunkSize / 2n > minimumChunkSize ? chunkSize / 2n : minimumChunkSize;
        continue;
      }
      throw error;
    }
  }
  return output;
}

export function deduplicateLogs<T extends ScannableLog>(logs: T[]) {
  const unique = new Map<string, T>();
  for (const log of logs) {
    if (!log.transactionHash || log.logIndex == null) continue;
    unique.set(`${log.transactionHash}:${log.logIndex}`, log);
  }
  return [...unique.values()].sort((left, right) => {
    if (left.blockNumber === right.blockNumber) {
      return (right.logIndex ?? 0) - (left.logIndex ?? 0);
    }
    return (left.blockNumber ?? 0n) > (right.blockNumber ?? 0n) ? -1 : 1;
  });
}
