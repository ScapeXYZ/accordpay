import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import {
  authenticationUsesTransaction,
  sessionResponseState,
  shouldFetchProtectedChat,
} from "../../components/deal-room/wallet-auth-model.ts";
import {
  normalizeAppOrigin,
  requireApprovedAuthenticationOrigin,
} from "./auth-origin.ts";

const root = new URL("../../../../../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("connected wallet without server session renders Authenticate wallet", async () => {
  const launcher = await source(
    "apps/web/src/components/deal-room/accord-chat-launcher.tsx",
  );
  assert.match(launcher, /Authenticate your wallet/);
  assert.match(launcher, />\s*Authenticate wallet\s*</);
});

test("protected chat data is fetched only after authentication", async () => {
  assert.equal(shouldFetchProtectedChat("authentication-required"), false);
  assert.equal(shouldFetchProtectedChat("checking-session"), false);
  assert.equal(shouldFetchProtectedChat("authenticated"), true);
  const launcher = await source(
    "apps/web/src/components/deal-room/accord-chat-launcher.tsx",
  );
  assert.match(
    launcher,
    /auth\.state === "authenticated"[\s\S]*window\.setTimeout\(\(\) => void load\(\)/,
  );
});

test("authentication click signs a personal message through Wagmi", async () => {
  const hook = await source(
    "apps/web/src/components/deal-room/use-wallet-session-auth.ts",
  );
  assert.match(hook, /useSignMessage/);
  assert.match(hook, /signer\.mutateAsync\(\{\s*message: challenge\.message/);
  assert.doesNotMatch(hook, /writeContract|sendTransaction/);
  assert.equal(authenticationUsesTransaction(), false);
});

test("rejected signatures produce a controlled non-transaction error", async () => {
  const hook = await source(
    "apps/web/src/components/deal-room/use-wallet-session-auth.ts",
  );
  assert.match(hook, /signature request was rejected/);
  assert.match(hook, /No transaction was sent/);
});

test("valid verification creates a hashed database session and HttpOnly cookie", async () => {
  const session = await source("apps/web/src/services/deal-room/session.ts");
  const verify = await source(
    "apps/web/src/app/api/accord-chat/auth/verify/route.ts",
  );
  assert.match(session, /randomBytes\(32\)/);
  assert.match(session, /insert into public\.wallet_sessions/);
  assert.match(session, /digest\(token\)/);
  assert.match(session, /httpOnly: true/);
  assert.match(session, /sameSite: "lax"/);
  assert.match(session, /secure: process\.env\.NODE_ENV === "production"/);
  assert.match(verify, /setWalletSessionCookie/);
});

test("expired, reused, and wrong-wallet challenges are rejected", async () => {
  const session = await source("apps/web/src/services/deal-room/session.ts");
  assert.match(session, /challenge has expired/);
  assert.match(session, /challenge has already been used/);
  assert.match(session, /does not match this challenge/);
  assert.match(session, /signature came from the wrong wallet/i);
  assert.match(session, /consumed_at = now\(\)/);
});

test("all authentication routes use one Accord Chat namespace", async () => {
  for (const name of ["challenge", "verify", "session", "realtime", "logout"]) {
    await access(
      new URL(`apps/web/src/app/api/accord-chat/auth/${name}/route.ts`, root),
    );
  }
  const [launcher, room, control] = await Promise.all([
    source("apps/web/src/components/deal-room/accord-chat-launcher.tsx"),
    source("apps/web/src/components/deal-room/deal-room.tsx"),
    source("apps/web/src/components/deal-room/use-wallet-session-auth.ts"),
  ]);
  const combined = `${launcher}\n${room}\n${control}`;
  assert.doesNotMatch(combined, /\/api\/deal-rooms\/auth\//);
  assert.match(combined, /\/api\/accord-chat\/auth\/realtime/);
});

test("Realtime is unauthorized without a session and signs only after one", async () => {
  const route = await source(
    "apps/web/src/app/api/accord-chat/auth/realtime/route.ts",
  );
  assert.match(route, /requireWalletSession/);
  assert.match(route, /createSupabaseWalletToken\(session\.address\)/);
  assert.match(route, /unauthorized \? 401 : 503/);
  assert.match(route, /REALTIME_UNAVAILABLE/);
  assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("401 transitions to authentication required without endless loading", () => {
  assert.equal(sessionResponseState(401), "authentication-required");
  assert.equal(sessionResponseState(200), "authenticated");
  assert.equal(sessionResponseState(503), "failed");
});

test("challenge binds server origin, chain, wallet, issue time and expiry", async () => {
  const [route, session] = await Promise.all([
    source("apps/web/src/app/api/accord-chat/auth/challenge/route.ts"),
    source("apps/web/src/services/deal-room/session.ts"),
  ]);
  assert.match(route, /APP_URL/);
  assert.match(route, /body\.chainId !== 91342/);
  for (const field of [
    "Domain:",
    "URI:",
    "Wallet:",
    "Chain ID:",
    "Challenge ID:",
    "Nonce:",
    "Issued At:",
    "Expires:",
  ]) {
    assert.match(session, new RegExp(field));
  }
  assert.match(route, /walletChallengeDigest\(challenge\.message\)/);
  assert.match(session, /signed message does not match the server challenge/);
});

test("authentication origins are normalized and matched exactly", () => {
  const production = "https://accordpay-giwa.vercel.app";
  assert.equal(normalizeAppOrigin(production), production);
  assert.equal(normalizeAppOrigin(`${production}/`), production);
  assert.equal(normalizeAppOrigin(`${production}/app`), production);
  assert.equal(
    requireApprovedAuthenticationOrigin(production, `${production}/`),
    production,
  );
  assert.equal(
    requireApprovedAuthenticationOrigin(
      "http://localhost:3000",
      "http://localhost:3000",
    ),
    "http://localhost:3000",
  );
  for (const rejected of [
    "https://malicious.example.com",
    "https://accordpay-giwa.vercel.app.evil.com",
    "http://accordpay-giwa.vercel.app",
  ]) {
    assert.throws(
      () => requireApprovedAuthenticationOrigin(production, rejected),
      /does not match APP_URL/,
    );
  }
});

test("wallet reconnect continues using the selected EIP-6963 connector", async () => {
  const control = await source(
    "apps/web/src/components/web3/wallet-control.tsx",
  );
  assert.match(control, /detail\.provider/);
  assert.match(control, /matchesStoredConnector/);
  assert.match(
    control,
    /reconnect\(wagmiConfig, \{ connectors: \[connector\] \}\)/,
  );
  assert.doesNotMatch(control, /window\.ethereum/);
});
