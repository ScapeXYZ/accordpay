import assert from "node:assert/strict";
import test from "node:test";
import { validateEscrowUri } from "./uri-validation.ts";

for (const uri of [
  "https://example.com/agreement.json",
  "ipfs://bafybeigdyr/agreement.json",
  "ar://AValidArweaveTransactionId",
]) {
  test(`accepts ${uri.split(":")[0]} URI`, () => {
    const result = validateEscrowUri(`  ${uri}  `);
    assert.equal(result.valid, true);
    assert.equal(result.value, uri);
  });
}

for (const uri of [
  "tt",
  "test",
  "agreement",
  "javascript:alert(1)",
  "data:text/plain,test",
  "file:///agreement.json",
  "https://",
  "ipfs://",
]) {
  test(`rejects unsafe or malformed URI: ${uri}`, () => {
    assert.equal(validateEscrowUri(uri).valid, false);
  });
}
