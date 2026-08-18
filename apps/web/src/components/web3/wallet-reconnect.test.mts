import assert from "node:assert/strict";
import test from "node:test";

import {
  matchesStoredConnector,
  parseStoredWalletConnector,
  serializeWalletConnector,
  WALLET_CONNECTOR_STORAGE_KEY,
} from "./wallet-reconnect.ts";

test("persists and restores only the previously selected connector", () => {
  const selected = { uuid: "wallet-uuid", rdns: "io.wallet" };
  assert.deepEqual(
    parseStoredWalletConnector(serializeWalletConnector(selected)),
    selected,
  );
  assert.equal(
    matchesStoredConnector(selected, {
      uuid: "different",
      rdns: "io.wallet",
    }),
    true,
  );
  assert.match(WALLET_CONNECTOR_STORAGE_KEY, /authorized-wallet-connector/);
});

test("explicit disconnect storage removal leaves no passive reconnect target", () => {
  assert.equal(parseStoredWalletConnector(null), undefined);
  assert.equal(parseStoredWalletConnector("{invalid"), undefined);
});
