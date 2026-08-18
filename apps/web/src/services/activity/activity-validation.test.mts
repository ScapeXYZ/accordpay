import assert from "node:assert/strict";
import test from "node:test";

import { validateActivityQuery } from "./activity-validation.ts";

const wallet = "0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d";

test("activity API validation accepts a checksummed wallet and filters", () => {
  const result = validateActivityQuery(
    new URLSearchParams({
      wallet,
      event: "EscrowCreated",
      status: "funded",
    }),
  );
  assert.equal(result.ok, true);
});

test("activity API validation returns structured deterministic errors", () => {
  const invalidWallet = validateActivityQuery(
    new URLSearchParams({ wallet: "not-an-address" }),
  );
  assert.deepEqual(invalidWallet, {
    ok: false,
    error: {
      code: "INVALID_WALLET",
      method: "validation",
      retryable: false,
      message: "A valid wallet address is required.",
    },
  });
  const invalidEvent = validateActivityQuery(
    new URLSearchParams({ wallet, event: "FakeEvent" }),
  );
  assert.equal(invalidEvent.ok ? "" : invalidEvent.error.code, "INVALID_EVENT");
});
