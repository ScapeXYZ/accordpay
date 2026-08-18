import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildApproveRefundRequest,
  escrowActionFunctions,
  validateEscrowIdInput,
} from "./escrow-lifecycle.ts";
import { classifyEscrowTransactionError } from "./transaction-errors.ts";
import { validateEscrowUri } from "./uri-validation.ts";

test("escrow lookup starts empty and validates positive whole numbers", async () => {
  const source = await readFile(
    new URL("./escrow-reader.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /validInitialId \?\? ""/);
  assert.match(source, /placeholder="Enter escrow ID"/);
  for (const invalid of ["", "0", "-1", "1.2", " ", "abc"]) {
    assert.equal(validateEscrowIdInput(invalid), false);
  }
  assert.equal(validateEscrowIdInput("8"), true);
});

test("lookup aligns on desktop and stacks on mobile", async () => {
  const css = await readFile(
    new URL("./escrow.module.css", import.meta.url),
    "utf8",
  );
  assert.match(
    css,
    /\.lookup[\s\S]*grid-template-columns: minmax\(12rem, 1fr\) auto/,
  );
  assert.match(
    css,
    /@media \(max-width: 48rem\)[\s\S]*\.lookup[\s\S]*grid-template-columns: 1fr/,
  );
});

test("metadata and evidence submission reject invalid values", () => {
  assert.equal(validateEscrowUri("tt").valid, false);
  assert.equal(validateEscrowUri("ipfs://bafy/evidence.pdf").valid, true);
});

test("invalid legacy evidence is displayed without a clickable URL", async () => {
  const source = await readFile(
    new URL("./escrow-reader.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /Invalid or unsupported evidence URI/);
  assert.match(source, /storedEvidence\?\.valid/);
});

test("invalid agreement and evidence values disable submission", async () => {
  const createSource = await readFile(
    new URL("./create-escrow-form.tsx", import.meta.url),
    "utf8",
  );
  const readerSource = await readFile(
    new URL("./escrow-reader.tsx", import.meta.url),
    "utf8",
  );
  assert.match(createSource, /metadataValidation\?\.valid !== true/);
  assert.match(readerSource, /deliveryValidation\?\.valid/);
});

test("approve refund and dispute requests use deployed ABI function names", () => {
  assert.deepEqual(buildApproveRefundRequest(8n), {
    functionName: "approveRefund",
    args: [8n],
  });
  assert.equal(escrowActionFunctions.raiseDispute, "raiseDispute");
});

test("gas-limit-too-high receives a controlled RPC message", () => {
  const result = classifyEscrowTransactionError(
    new Error("RPC 0x164c Custom eth_sendRawTransaction: gas limit too high"),
  );
  assert.equal(result.errorKind, "rpc");
  assert.match(result.error, /gas limit/i);
});

test("transactions are simulated before wallet submission without hardcoded gas", async () => {
  const source = await readFile(
    new URL("./use-escrow-transaction.ts", import.meta.url),
    "utf8",
  );
  assert.ok(source.indexOf("simulateContract") < source.indexOf("mutateAsync"));
  assert.match(source, /estimateContractGas/);
  assert.match(source, /bufferedGas/);
  assert.match(source, /safeBlockMaximum/);
  assert.doesNotMatch(source, /\bgas:\s*\d+n/);
});
