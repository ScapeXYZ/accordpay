import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  canonicalize,
  hashCanonicalAgreement,
  mayApproveVersion,
  nextAgreementVersion,
  normalizeMessage,
  type AgreementContent,
} from "./domain.ts";
import {
  canFinalizePrivateAgreement,
  decryptAgreementLocally,
  encryptAgreementLocally,
} from "./private-agreement.ts";
import {
  DeterministicAgreementAssistant,
  createAgreementAssistant,
} from "./assistant.ts";
import { safeFilename, validateAttachment } from "./storage.ts";

const content: AgreementContent = {
  schemaVersion: "1.0",
  roomId: "11111111-1111-4111-8111-111111111111",
  version: 1,
  title: "Design engagement",
  description: "Complete the agreed product design.",
  buyer: "0x1111111111111111111111111111111111111111",
  seller: "0x2222222222222222222222222222222222222222",
  amount: "0.1",
  currency: "Test ETH",
  network: "GIWA Sepolia",
  chainId: 91342,
  contractAddress: "0x0d6e2c12BD5916B1020A03f30EAf3b73f09dF798",
  deadline: "2026-08-30T12:00:00.000Z",
  deliverables: ["Design file"],
  acceptanceCriteria: ["All named screens are included"],
  requiredDeliveryEvidence: ["Public design link"],
  revisionConditions: "Two revision rounds.",
  refundConditions: "Seller may immediately refund.",
  disputeConditions: "Designated resolver resolution.",
  additionalTerms: "",
  privacyMode: "public",
};

test("canonical agreement hash is stable across key order", () => {
  const reversed = Object.fromEntries(Object.entries(content).reverse());
  assert.equal(canonicalize(content), canonicalize(reversed));
  assert.equal(
    hashCanonicalAgreement(content),
    hashCanonicalAgreement(reversed as AgreementContent),
  );
});

test("new versions increment and reset both approvals", () => {
  const version = nextAgreementVersion(4, content);
  assert.equal(version.version, 5);
  assert.equal(version.buyerApproved, false);
  assert.equal(version.sellerApproved, false);
});

test("one participant cannot approve for another or approve stale content", () => {
  assert.equal(
    mayApproveVersion({
      sessionAddress: content.buyer,
      participantAddress: content.seller,
      requestedHash: "hash",
      currentHash: "hash",
    }),
    false,
  );
  assert.equal(
    mayApproveVersion({
      sessionAddress: content.buyer,
      participantAddress: content.buyer,
      requestedHash: "stale",
      currentHash: "current",
    }),
    false,
  );
});

test("messages enforce body limits and safe plain text", () => {
  assert.equal(normalizeMessage("  hello <script>  "), "hello <script>");
  assert.throws(() => normalizeMessage(" "));
  assert.throws(() => normalizeMessage("x".repeat(4_001)));
});

test("deterministic assistant works without provider and never approves", async () => {
  const assistant = createAgreementAssistant();
  assert.ok(assistant instanceof DeterministicAgreementAssistant);
  const result = await assistant.propose({
    current: content,
    externalProcessingConsent: false,
  });
  assert.deepEqual(result.proposal, content);
  assert.equal("approved" in result.proposal, false);
});

test("private agreement local AES-GCM round trip succeeds", async () => {
  const encrypted = await encryptAgreementLocally("private agreement");
  assert.equal(
    await decryptAgreementLocally(encrypted.payload, encrypted.key),
    "private agreement",
  );
});

test("wrong key and tampering fail authenticated decryption", async () => {
  const encrypted = await encryptAgreementLocally("private agreement");
  const wrong = await encryptAgreementLocally("other");
  await assert.rejects(() =>
    decryptAgreementLocally(encrypted.payload, wrong.key),
  );
  const tampered = {
    ...encrypted.payload,
    ciphertext: `${encrypted.payload.ciphertext.slice(0, -2)}AA`,
  };
  await assert.rejects(() => decryptAgreementLocally(tampered, encrypted.key));
});

test("AES-GCM nonces are unique and production finalization is disabled", async () => {
  const left = await encryptAgreementLocally("same");
  const right = await encryptAgreementLocally("same");
  assert.notEqual(left.payload.iv, right.payload.iv);
  assert.equal(canFinalizePrivateAgreement(), false);
});

test("attachment validation limits size, type, and filename", () => {
  assert.equal(safeFilename("../../unsafe name.pdf"), "..-..-unsafe-name.pdf");
  assert.throws(() =>
    validateAttachment({
      size: 26 * 1024 * 1024,
      contentType: "application/pdf",
      filename: "large.pdf",
    }),
  );
  assert.throws(() =>
    validateAttachment({
      size: 100,
      contentType: "text/html",
      filename: "page.html",
    }),
  );
});

test("migration defines private tables, constraints, indexes, and RLS", async () => {
  const sql = await readFile(
    new URL(
      "../../../../../supabase/migrations/202607300001_phase20_deal_rooms.sql",
      import.meta.url,
    ),
    "utf8",
  );
  for (const table of [
    "deal_rooms",
    "deal_room_participants",
    "deal_room_messages",
    "agreement_versions",
    "agreement_approvals",
    "agreement_artifacts",
    "delivery_submissions",
    "dispute_cases",
    "assistant_runs",
    "encrypted_key_envelopes",
  ]) {
    assert.match(sql, new RegExp(`create table public\\.${table}`));
    assert.match(
      sql,
      new RegExp(`alter table public\\.${table} enable row level security`),
    );
  }
  assert.match(sql, /unique \(room_id, client_id\)/);
  assert.doesNotMatch(sql, /for select\s+using\s+\(true\)/i);
});

test("normal activity GET remains index-only", async () => {
  const route = await readFile(
    new URL("../../app/api/accordpay/activity/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(route, /getActivityIndex/);
  assert.doesNotMatch(route, /getContractEvents|eth_getLogs/);
});
