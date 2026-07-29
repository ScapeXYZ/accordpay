import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getFunctionSelector } from "viem";

import {
  buildApproveRefundRequest,
  buildMarkDeliveredRequest,
  decodeEscrowStatus,
  escrowActionFunctions,
} from "./escrow-lifecycle.ts";

test("Mark delivered routes only to markDelivered with its evidence URI", () => {
  const request = buildMarkDeliveredRequest(
    BigInt(4),
    "ipfs://accordpay-delivery-proof-004",
  );

  assert.deepEqual(request, {
    functionName: "markDelivered",
    args: [BigInt(4), "ipfs://accordpay-delivery-proof-004"],
  });
  assert.notEqual(
    request.functionName,
    escrowActionFunctions.approveRefund as string,
  );
});

test("Approve refund has a distinct function and argument shape", () => {
  assert.deepEqual(buildApproveRefundRequest(BigInt(4)), {
    functionName: "approveRefund",
    args: [BigInt(4)],
  });
});

test("Delivered and Refunded numeric values decode independently", () => {
  assert.equal(decodeEscrowStatus(1), "delivered");
  assert.equal(decodeEscrowStatus(3), "refunded");
});

test("Action selectors and signatures match the deployed frontend ABI", () => {
  const abi = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../packages/shared/src/contracts/accordpay-escrow-abi.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as Array<{
    type: string;
    name?: string;
    inputs?: Array<{ type: string }>;
  }>;
  const functions = new Map(
    abi
      .filter((entry) => entry.type === "function")
      .map((entry) => [
        entry.name,
        entry.inputs?.map((input) => input.type) ?? [],
      ]),
  );

  assert.deepEqual(functions.get("markDelivered"), ["uint256", "string"]);
  assert.deepEqual(functions.get("approveRefund"), ["uint256"]);
  assert.deepEqual(functions.get(escrowActionFunctions.releaseFunds), [
    "uint256",
  ]);
  assert.deepEqual(functions.get(escrowActionFunctions.raiseDispute), [
    "uint256",
  ]);
  assert.deepEqual(functions.get(escrowActionFunctions.reclaimAfterDeadline), [
    "uint256",
  ]);
  assert.deepEqual(functions.get(escrowActionFunctions.resolveDispute), [
    "uint256",
    "uint16",
  ]);
  assert.equal(
    getFunctionSelector("markDelivered(uint256,string)"),
    "0x5e390580",
  );
  assert.equal(getFunctionSelector("approveRefund(uint256)"), "0x348a71a6");
});
