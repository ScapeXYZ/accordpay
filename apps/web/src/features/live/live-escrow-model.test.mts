import assert from "node:assert/strict";
import test from "node:test";

import {
  dashboardCounts,
  escrowIdsFromLogs,
  filterTransactions,
  formatAgreementId,
  mapTransactions,
  parseAgreementId,
  transactionExplorerUrl,
} from "./live-escrow-model.ts";

const buyer = "0x0000000000000000000000000000000000000001";
const seller = "0x0000000000000000000000000000000000000002";
const resolver = "0x0000000000000000000000000000000000000003";
const hash = `0x${"a".repeat(64)}`;

const escrows = [
  { id: 1n, buyer, seller, amount: 5n, deadline: 100n, status: "funded" },
  { id: 2n, buyer, seller, amount: 7n, deadline: 100n, status: "completed" },
  { id: 3n, buyer, seller, amount: 9n, deadline: 100n, status: "disputed" },
] as const;

test("dashboard counts are wallet scoped and deduplicate escrow IDs", () => {
  const counts = dashboardCounts([...escrows, escrows[0]], buyer, resolver);
  assert.deepEqual(counts, {
    requiresAction: 1,
    active: 2,
    completed: 1,
    disputed: 1,
  });
});

test("wallet-specific transaction mapping loads timestamp and real explorer URL", () => {
  const log = {
    eventName: "EscrowCreated",
    args: { escrowId: 1n },
    transactionHash: hash,
    blockNumber: 22n,
    logIndex: 0,
  } as const;
  const rows = mapTransactions(
    [log, log],
    new Map([[1n, escrows[0]]]),
    new Map([[22n, 1_700_000_000]]),
    buyer,
    resolver,
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].role, "Buyer");
  assert.equal(rows[0].timestamp, 1_700_000_000);
  assert.equal(rows[0].explorerUrl, transactionExplorerUrl(hash));
});

test("unrelated wallets are filtered out", () => {
  const rows = mapTransactions(
    [
      {
        eventName: "EscrowCreated",
        args: { escrowId: 1n },
        transactionHash: hash,
        blockNumber: 22n,
        logIndex: 0,
      },
    ],
    new Map([[1n, escrows[0]]]),
    new Map([[22n, 1_700_000_000]]),
    "0x0000000000000000000000000000000000000004",
    resolver,
  );
  assert.equal(rows.length, 0);
});

test("agreement IDs accept numeric and ACP formats", () => {
  assert.equal(parseAgreementId("5"), 5n);
  assert.equal(parseAgreementId("ACP-000005"), 5n);
  assert.equal(parseAgreementId("ACP-five"), undefined);
  assert.equal(formatAgreementId(5n), "ACP-000005");
});

test("escrow IDs are deduplicated from event logs", () => {
  assert.deepEqual(
    escrowIdsFromLogs([
      { args: { escrowId: 4n } },
      { args: { escrowId: 4n } },
      { args: { escrowId: 7n } },
    ]),
    [4n, 7n],
  );
});

test("status and event filters preserve newest confirmed matches", () => {
  const rows = mapTransactions(
    [
      {
        eventName: "EscrowCreated",
        args: { escrowId: 1n },
        transactionHash: hash,
        blockNumber: 22n,
        logIndex: 0,
      },
    ],
    new Map([[1n, escrows[0]]]),
    new Map([[22n, 1_700_000_000]]),
    buyer,
    resolver,
  );
  assert.equal(
    filterTransactions(rows, {
      agreement: "ACP-000001",
      eventType: "EscrowCreated",
      status: "funded",
    }).length,
    1,
  );
  assert.equal(filterTransactions(rows, { status: "completed" }).length, 0);
});

test("a missing block timestamp retains the confirmed transaction row", () => {
  const rows = mapTransactions(
    [
      {
        eventName: "EscrowCreated",
        args: { escrowId: 1n },
        transactionHash: hash,
        blockNumber: 22n,
        logIndex: 0,
      },
    ],
    new Map([[1n, escrows[0]]]),
    new Map(),
    buyer,
    resolver,
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].timestamp, null);
});
