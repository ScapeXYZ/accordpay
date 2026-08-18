import assert from "node:assert/strict";
import test from "node:test";

import {
  deduplicateLogs,
  generateBlockChunks,
  isRetryableRpcError,
  mapWithConcurrency,
  scanAdaptiveRange,
} from "./activity-utils.ts";

test("generates conservative inclusive block chunks", () => {
  assert.deepEqual(generateBlockChunks(10n, 5_009n, 2_000n), [
    { fromBlock: 10n, toBlock: 2_009n },
    { fromBlock: 2_010n, toBlock: 4_009n },
    { fromBlock: 4_010n, toBlock: 5_009n },
  ]);
});

test("adaptive scanning reduces a rejected block range", async () => {
  const requests: Array<[bigint, bigint]> = [];
  const logs = await scanAdaptiveRange(
    1n,
    2_000n,
    async (from, to) => {
      requests.push([from, to]);
      if (to - from + 1n > 1_000n) {
        throw new Error("query exceeds max block range");
      }
      return [{ transactionHash: `0x${from}`, logIndex: 0 }];
    },
    2_000n,
  );
  assert.equal(requests.length, 3);
  assert.equal(logs.length, 2);
});

test("classifies transient failures without retrying deterministic errors", () => {
  assert.equal(isRetryableRpcError(new Error("HTTP 429 rate limit")), true);
  assert.equal(isRetryableRpcError(new Error("network timeout")), true);
  assert.equal(isRetryableRpcError(new Error("ABI decode failed")), false);
  assert.equal(isRetryableRpcError(new Error("invalid address")), false);
});

test("deduplicates logs by transaction hash and log index", () => {
  const log = {
    transactionHash: `0x${"a".repeat(64)}`,
    blockNumber: 10n,
    logIndex: 2,
  };
  assert.equal(deduplicateLogs([log, log]).length, 1);
});

test("controlled concurrency isolates partial enrichment failures", async () => {
  let active = 0;
  let maximum = 0;
  const results = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => {
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    if (value === 2) throw new Error("one getEscrow read failed");
    return value;
  });
  assert.equal(maximum, 2);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    3,
  );
  assert.equal(
    results.filter((result) => result.status === "rejected").length,
    1,
  );
});
