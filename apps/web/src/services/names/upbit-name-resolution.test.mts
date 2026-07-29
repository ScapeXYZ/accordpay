import assert from "node:assert/strict";
import test from "node:test";

import type { Address } from "viem";

import {
  EnsUpbitNameResolutionService,
  normalizeUpbitName,
  type EnsResolutionProvider,
} from "./upbit-name-resolution.ts";
import { prepareSellerAddress } from "../../features/escrow/seller-resolution.ts";

const address = "0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d" as Address;
const other = "0xFC1DC0f5C79a0a47E733476d61209E734a649094" as Address;
const name = "confirmed-holder.up.id";

function service(overrides: Partial<EnsResolutionProvider> = {}) {
  return new EnsUpbitNameResolutionService({
    getAddress: async () => address,
    getName: async () => name,
    ...overrides,
  });
}

test("forward resolution confirms only a matching reverse record", async () => {
  assert.deepEqual(await service().resolveForward(name), {
    status: "confirmed",
    name,
    address,
  });
});

test("reverse resolution confirms only a matching forward record", async () => {
  assert.deepEqual(await service().resolveReverse(address.toLowerCase()), {
    status: "confirmed",
    name,
    address,
  });
});

test("forward and reverse mismatches remain explicit", async () => {
  const result = await service({
    getName: async () => "other.up.id",
  }).resolveForward(name);
  assert.equal(result.status, "mismatch");
});

test("unresolved names return no name found", async () => {
  assert.equal(
    (await service({ getAddress: async () => null }).resolveForward(name))
      .status,
    "not-found",
  );
});

test("resolver failures return resolution unavailable", async () => {
  assert.equal(
    (
      await service({
        getAddress: async () => {
          throw new Error("RPC unavailable");
        },
      }).resolveForward(name)
    ).status,
    "unavailable",
  );
});

test("invalid name formats are rejected", () => {
  assert.throws(() => normalizeUpbitName("not-an-up-id.eth"));
});

test("wallet comparisons are case normalized", async () => {
  const result = await service({
    getAddress: async () => address.toLowerCase() as Address,
  }).resolveReverse(address);
  assert.equal(result.status, "confirmed");
});

test("name submission returns only the resolved contract address after confirmation", () => {
  const result = { status: "confirmed", name, address } as const;
  assert.equal(
    prepareSellerAddress(name, result, `${name}:${address}`),
    address,
  );
});

test("name submission is blocked before address confirmation", () => {
  const result = { status: "confirmed", name, address } as const;
  assert.throws(() => prepareSellerAddress(name, result, ""));
});

test("plain-address escrow creation remains functional", () => {
  assert.equal(
    prepareSellerAddress(other.toLowerCase(), { status: "not-found" }, ""),
    other,
  );
});
