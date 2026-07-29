import assert from "node:assert/strict";
import test from "node:test";

import type { Address } from "viem";

import { EnsUpbitNameResolutionService } from "../names/upbit-name-resolution.ts";
import {
  normalizeVerificationAddress,
  VerificationServiceError,
} from "./address-verification.ts";
import {
  DojangVerificationService,
  type DojangContractReader,
} from "./dojang-verification-service.ts";

const address = "0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d";
const fixedDate = new Date("2026-07-29T00:00:00.000Z");

function service(result: boolean | Error) {
  const reader: DojangContractReader = {
    async isVerified(receivedAddress) {
      assert.equal(receivedAddress, address);
      if (result instanceof Error) throw result;
      return result;
    },
  };
  return new DojangVerificationService(reader, () => fixedDate);
}

test("returns verified when DojangScroll returns true", async () => {
  const result = await service(true).verifyAddress(address.toLowerCase());
  assert.deepEqual(result, {
    address,
    verified: true,
    source: "dojang",
    checkedAt: fixedDate.toISOString(),
  });
});

test("returns not verified when DojangScroll successfully returns false", async () => {
  const result = await service(false).verifyAddress(address);
  assert.equal(result.verified, false);
});

test("maps an RPC or contract failure to unavailable", async () => {
  await assert.rejects(
    service(new Error("RPC unavailable")).verifyAddress(address),
    (error) =>
      error instanceof VerificationServiceError &&
      error.code === "UPSTREAM_ERROR",
  );
});

test("rejects a malformed address before querying DojangScroll", async () => {
  let queried = false;
  const verification = new DojangVerificationService({
    async isVerified() {
      queried = true;
      return true;
    },
  });

  await assert.rejects(
    verification.verifyAddress("not-an-address"),
    (error) =>
      error instanceof VerificationServiceError &&
      error.code === "INVALID_ADDRESS",
  );
  assert.equal(queried, false);
  assert.throws(() => normalizeVerificationAddress("not-an-address"));
});

test("a confirmed UP ID remains confirmed when Dojang is unavailable", async () => {
  const names = new EnsUpbitNameResolutionService({
    async getAddress() {
      return address as Address;
    },
    async getName() {
      return "temidele.up.id";
    },
  });
  const nameResult = await names.resolveReverse(address);

  await assert.rejects(
    service(new Error("RPC unavailable")).verifyAddress(address),
  );
  assert.equal(nameResult.status, "confirmed");
  if (nameResult.status === "confirmed") {
    assert.equal(nameResult.name, "temidele.up.id");
  }
});
