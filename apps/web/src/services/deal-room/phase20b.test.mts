import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { bestIdentity, validateDisplayName } from "./identity.ts";
import { safeMessageParts, validateChatLink } from "./rich-message.ts";
import {
  decodeStepUpClaims,
  STEP_UP_SECONDS,
  validateStepUpClaims,
} from "./step-up-model.ts";

const root = new URL("../../../../../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("wallet session secret requires at least 32 characters", () => {
  return source("apps/web/src/services/deal-room/session.ts").then((text) => {
    assert.match(text, /normalized\.length < 32/);
    assert.match(text, /server-only WALLET_SESSION_SECRET/);
  });
});

test("rich chat accepts safe HTTPS links and rejects dangerous schemes", () => {
  assert.equal(validateChatLink("https://example.com/file.pdf"), true);
  for (const unsafe of [
    "javascript:alert(1)",
    "data:text/html,bad",
    "file:///secret",
    "http://example.com",
  ]) {
    assert.equal(validateChatLink(unsafe), false);
  }
  assert.equal(
    safeMessageParts("See https://example.com").some((part) => part.link),
    true,
  );
});

test("verified UP ID wins, then display name, then wallet fallback", () => {
  const wallet = "0x1111111111111111111111111111111111111111";
  assert.deepEqual(
    bestIdentity({
      confirmedName: "buyer.up.id",
      displayName: "Buyer",
      address: wallet,
    }),
    { primary: "buyer.up.id", verified: true },
  );
  assert.equal(
    bestIdentity({ displayName: "Buyer", address: wallet }).primary,
    "Buyer",
  );
  assert.equal(bestIdentity({ address: wallet }).primary, "0x1111…1111");
});

test("protected support and resolver labels cannot be impersonated", () => {
  assert.equal(validateDisplayName("AccordPay Support").valid, false);
  assert.equal(validateDisplayName("Designated Testnet Resolver").valid, false);
  assert.equal(validateDisplayName("Temi").valid, true);
});

test("AAL2 step-up rejects expiry and stale authentication", () => {
  const now = 2_000_000_000;
  assert.doesNotThrow(() =>
    validateStepUpClaims(
      {
        aal: "aal2",
        sub: "user",
        iat: now - STEP_UP_SECONDS + 1,
        exp: now + 60,
      },
      now,
    ),
  );
  assert.throws(() =>
    validateStepUpClaims(
      { aal: "aal1", sub: "user", iat: now, exp: now + 60 },
      now,
    ),
  );
  assert.throws(() =>
    validateStepUpClaims(
      {
        aal: "aal2",
        sub: "user",
        iat: now - STEP_UP_SECONDS - 1,
        exp: now + 60,
      },
      now,
    ),
  );
});

test("step-up JWT decoding preserves the AAL claim", () => {
  const encoded = Buffer.from(
    JSON.stringify({ sub: "user", aal: "aal2", iat: 1, exp: 2 }),
  ).toString("base64url");
  assert.equal(decodeStepUpClaims(`header.${encoded}.signature`).aal, "aal2");
});

test("Accord Chat is removed from primary navigation and exposed by launcher", async () => {
  const [navigation, launcher, shell] = await Promise.all([
    source("apps/web/src/components/app-shell/navigation-config.ts"),
    source("apps/web/src/components/deal-room/accord-chat-launcher.tsx"),
    source("apps/web/src/components/app-shell/app-shell.tsx"),
  ]);
  assert.doesNotMatch(navigation, /Deal Rooms|Accord Chat/);
  assert.match(launcher, /aria-label="Open Accord Chat"/);
  assert.match(launcher, /summary\.unreadCount > 0/);
  assert.match(shell, /AccordChatLauncher/);
});

test("unread state is participant-scoped and marked only on room open", async () => {
  const [migration, summary, readRoute, room] = await Promise.all([
    source("supabase/migrations/202607300002_phase20b_accord_chat.sql"),
    source("apps/web/src/app/api/accord-chat/summary/route.ts"),
    source("apps/web/src/app/api/accord-chat/rooms/[roomId]/read/route.ts"),
    source("apps/web/src/components/deal-room/deal-room.tsx"),
  ]);
  assert.match(migration, /last_read_sequence/);
  assert.match(summary, /p\.last_read_sequence/);
  assert.match(readRoute, /requireRoomParticipant/);
  assert.match(room, /\/read/);
});

test("support permission is server-controlled and room access is isolated", async () => {
  const [route, migration] = await Promise.all([
    source("apps/web/src/app/api/support/[conversationId]/messages/route.ts"),
    source("supabase/migrations/202607300002_phase20b_accord_chat.sql"),
  ]);
  assert.match(route, /public\.support_agents/);
  assert.match(route, /enabled = true/);
  assert.doesNotMatch(route, /display_name.*support/i);
  assert.match(migration, /support_messages_user_read/);
});

test("AI drafts remain proposals and dual approval triggers artifact creation", async () => {
  const [assistant, room] = await Promise.all([
    source("apps/web/src/app/api/deal-rooms/[roomId]/assistant/route.ts"),
    source("apps/web/src/components/deal-room/deal-room.tsx"),
  ]);
  assert.match(assistant, /status\).*'proposal'|status\)\s*values/s);
  assert.match(assistant, /final: false/);
  assert.match(room, /body\.bothApproved/);
  assert.match(room, /generateArtifact/);
});

test("MFA disclosure accurately preserves direct-contract limitation", async () => {
  const sourceText = await source(
    "apps/web/src/components/deal-room/step-up-security.tsx",
  );
  assert.match(
    sourceText,
    /A person controlling your wallet may still interact directly with the current smart contract/,
  );
});
