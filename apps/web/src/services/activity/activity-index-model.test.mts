import assert from "node:assert/strict";
import test from "node:test";

import {
  chooseSyncStart,
  SingleFlight,
  upsertIndexedEvents,
} from "./activity-index-model.ts";

const baseEvent = {
  chainId: 91342,
  contractAddress: "0xcontract",
  transactionHash: "0xhash",
  logIndex: 1,
  blockNumber: 100n,
  blockTimestamp: 100,
  eventName: "EscrowCreated",
  escrowId: 8n,
  buyer: "0xbuyer",
  seller: "0xseller",
  amount: 1n,
  currentState: "funded",
  rawEventData: {},
} as const;

test("checkpoint creation starts at deployment and interrupted sync resumes", () => {
  assert.equal(
    chooseSyncStart({
      deploymentBlock: 31_913_078n,
      lastSyncedBlock: null,
      previousTargetBlock: null,
      overlap: 20n,
    }),
    31_913_078n,
  );
  assert.equal(
    chooseSyncStart({
      deploymentBlock: 31_913_078n,
      lastSyncedBlock: 31_915_077n,
      previousTargetBlock: 32_000_000n,
      overlap: 20n,
    }),
    31_915_078n,
  );
});

test("caught-up synchronization rescans a 20-block overlap", () => {
  assert.equal(
    chooseSyncStart({
      deploymentBlock: 31_913_078n,
      lastSyncedBlock: 32_000_000n,
      previousTargetBlock: 32_000_000n,
      overlap: 20n,
    }),
    31_999_981n,
  );
});

test("event upsert deduplicates and propagates current state", () => {
  const updated = {
    ...baseEvent,
    transactionHash: "0xsecond",
    logIndex: 2,
    currentState: "completed",
  } as const;
  const events = upsertIndexedEvents([baseEvent], [baseEvent, updated]);
  assert.equal(events.length, 2);
  assert.equal(
    events.every((event) => event.currentState === "completed"),
    true,
  );
});

test("single-flight synchronization lock shares one operation", async () => {
  const lock = new SingleFlight<number>();
  let calls = 0;
  const operation = () => {
    calls += 1;
    return new Promise<number>((resolve) =>
      setTimeout(() => resolve(calls), 5),
    );
  };
  const [first, second] = await Promise.all([
    lock.run(operation),
    lock.run(operation),
  ]);
  assert.equal(calls, 1);
  assert.equal(first, second);
  assert.equal(lock.running, false);
});
