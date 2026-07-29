import assert from "node:assert/strict";
import test from "node:test";

import {
  getConnectedWalletIdentityView,
  shortenWalletAddress,
} from "./connected-wallet-identity.ts";

const address = "0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d";

test("confirmed UP ID is primary and canonical address is secondary", () => {
  assert.deepEqual(
    getConnectedWalletIdentityView(address, "confirmed", {
      status: "confirmed",
      address,
      name: "temidele.up.id",
    }),
    {
      primary: "temidele.up.id",
      secondary: "0x7748…290d",
      status: "confirmed",
      statusLabel: "Name confirmed",
    },
  );
});

test("loading, no-name, mismatch, and unavailable states fall back to address", () => {
  const fallback = shortenWalletAddress(address);
  const scenarios = [
    ["resolving", { status: "unavailable", message: "pending" }, "loading"],
    ["not-found", { status: "not-found", address }, "no-name"],
    [
      "mismatch",
      { status: "mismatch", address, name: "other.up.id" },
      "mismatch",
    ],
    [
      "unavailable",
      { status: "unavailable", address, message: "RPC unavailable" },
      "unavailable",
    ],
  ] as const;

  for (const [state, result, expectedStatus] of scenarios) {
    const view = getConnectedWalletIdentityView(address, state, result);
    assert.equal(view.primary, fallback);
    assert.equal(view.secondary, undefined);
    assert.equal(view.status, expectedStatus);
  }
});
