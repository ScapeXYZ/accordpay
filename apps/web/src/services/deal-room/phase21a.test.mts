import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  conversationSessionKey,
  conversationStatusLabel,
  isNearMessageBottom,
  mergeMessages,
  prependScrollTop,
} from "./conversation-model.ts";

const root = new URL("../../../../../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("Service Hub is the default app route and Overview preserves live dashboard", async () => {
  const [hub, overview, navigation] = await Promise.all([
    source("apps/web/src/app/app/page.tsx"),
    source("apps/web/src/app/app/overview/page.tsx"),
    source("apps/web/src/components/app-shell/navigation-config.ts"),
  ]);
  assert.match(hub, /Hire, work, agree, and get paid securely/);
  assert.match(overview, /useLiveAccordPay/);
  assert.match(navigation, /Overview.*\/app\/overview/);
});

test("service availability remains honest as Jobs becomes functional", async () => {
  const [hub, browse, post] = await Promise.all([
    source("apps/web/src/app/app/page.tsx"),
    source("apps/web/src/app/app/jobs/page.tsx"),
    source("apps/web/src/app/app/jobs/post/page.tsx"),
  ]);
  assert.match(hub, /Jobs & Services/);
  assert.match(hub, /Browse jobs, contact clients/);
  assert.match(hub, /Secure Escrow Agreements/);
  assert.match(hub, /Available/);
  assert.match(hub, /Coming soon/);
  assert.match(browse, /JobsMarketplace/);
  assert.match(post, /PostJobForm/);
});

test("Service Hub cards are responsive and accessible", async () => {
  const [page, css] = await Promise.all([
    source("apps/web/src/app/app/page.tsx"),
    source("apps/web/src/app/app/service-hub.module.css"),
  ]);
  assert.match(page, /aria-labelledby="services-heading"/);
  assert.match(page, /Browse jobs/);
  assert.match(page, /Post a job/);
  assert.match(css, /@media \(max-width: 40rem\)/);
  assert.match(css, /grid-template-columns: 1fr/);
});

test("conversation statuses use clear user-facing labels", () => {
  assert.equal(conversationStatusLabel("negotiating"), "Negotiating");
  assert.equal(
    conversationStatusLabel("awaiting_seller_approval"),
    "Awaiting approval",
  );
  assert.equal(conversationStatusLabel("completed"), "Completed");
  assert.equal(conversationStatusLabel("refunded"), "Refunded");
  assert.equal(conversationStatusLabel("open"), "Support");
});

test("message merge deduplicates and orders oldest to newest", () => {
  const merged = mergeMessages(
    [
      { id: "b", message_sequence: 2 },
      { id: "c", message_sequence: 3 },
    ],
    [
      { id: "a", message_sequence: 1 },
      { id: "b", message_sequence: 2 },
    ],
  );
  assert.deepEqual(
    merged.map((message) => message.id),
    ["a", "b", "c"],
  );
});

test("prepending older history preserves visual scroll position", () => {
  assert.equal(
    prependScrollTop({
      previousScrollHeight: 1_000,
      nextScrollHeight: 1_600,
      previousScrollTop: 100,
    }),
    700,
  );
});

test("near-bottom detection controls automatic new-message scrolling", () => {
  assert.equal(
    isNearMessageBottom({
      scrollHeight: 1_000,
      scrollTop: 700,
      clientHeight: 250,
    }),
    true,
  );
  assert.equal(
    isNearMessageBottom({
      scrollHeight: 1_000,
      scrollTop: 200,
      clientHeight: 250,
    }),
    false,
  );
});

test("draft and scroll restoration keys are isolated per conversation", () => {
  assert.notEqual(
    conversationSessionKey("room-a", "draft"),
    conversationSessionKey("room-b", "draft"),
  );
  assert.notEqual(
    conversationSessionKey("room-a", "draft"),
    conversationSessionKey("room-a", "scroll"),
  );
});

test("summary search covers identity, wallet, title, escrow and filters", async () => {
  const route = await source(
    "apps/web/src/app/api/accord-chat/summary/route.ts",
  );
  assert.match(route, /serverUpbitNameService\.resolveForward/);
  assert.match(route, /wp\.display_name/);
  assert.match(route, /r\.title/);
  assert.match(route, /r\.escrow_id/);
  assert.match(route, /counterparty_address/);
  for (const filter of [
    "unread",
    "active",
    "completed",
    "support",
    "archived",
  ]) {
    assert.match(route, new RegExp(filter));
  }
});

test("inbox returns active, completed, archived and support conversations", async () => {
  const [route, launcher] = await Promise.all([
    source("apps/web/src/app/api/accord-chat/summary/route.ts"),
    source("apps/web/src/components/deal-room/accord-chat-launcher.tsx"),
  ]);
  assert.match(route, /supportConversations/);
  assert.match(route, /p\.archived_at/);
  assert.match(route, /r\.status in \('completed','refunded'\)/);
  assert.match(launcher, /No conversations yet/);
  assert.match(launcher, /No conversations match your search/);
});

test("message API loads newest 40 with cursor pagination and membership isolation", async () => {
  const route = await source(
    "apps/web/src/app/api/accord-chat/rooms/[roomId]/messages/route.ts",
  );
  assert.match(
    route,
    /Math\.min\(Math\.max\(Number\(search\.get\("limit"\) \?\? 40\), 1\), 40\)/,
  );
  assert.match(route, /message_sequence < \$2/);
  assert.match(route, /order by message_sequence desc/);
  assert.match(route, /reverse\(\)/);
  assert.match(route, /requireRoomParticipant/);
  assert.match(route, /hasMore/);
});

test("read marker advances only to an explicitly viewed sequence", async () => {
  const route = await source(
    "apps/web/src/app/api/accord-chat/rooms/[roomId]/read/route.ts",
  );
  assert.match(route, /body\.sequence/);
  assert.match(route, /greatest\(last_read_sequence, \$3\)/);
  assert.doesNotMatch(route, /set last_read_sequence = coalesce/);
});

test("workspace implements upward loading, first unread, new-message control and drafts", async () => {
  const room = await source("apps/web/src/components/deal-room/deal-room.tsx");
  assert.match(room, /beforeSequence/);
  assert.match(room, /firstUnread/);
  assert.match(room, /Beginning of conversation/);
  assert.match(room, /New messages/);
  assert.match(room, /isNearMessageBottom/);
  assert.match(room, /sessionStorage/);
  assert.match(room, /prependScrollTop/);
});

test("archive and draft state are participant scoped", async () => {
  const route = await source(
    "apps/web/src/app/api/accord-chat/rooms/[roomId]/state/route.ts",
  );
  assert.match(route, /requireRoomParticipant/);
  assert.match(route, /deal_room_participants/);
  assert.match(route, /lower\(wallet_address\) = lower\(\$2\)/);
  assert.match(route, /archived_at/);
  assert.match(route, /draft_text/);
});

test("future job conversations reuse the same participant pair and job context", async () => {
  const [route, migration] = await Promise.all([
    source("apps/web/src/app/api/deal-rooms/route.ts"),
    source("supabase/migrations/202607300003_phase21a_conversation_inbox.sql"),
  ]);
  assert.match(route, /contextType === "job"/);
  assert.match(route, /reused: true/);
  assert.match(migration, /job_participant_conversation_unique/);
  assert.match(migration, /least\(lower\(buyer_address\)/);
  assert.match(migration, /greatest\(lower\(buyer_address\)/);
  assert.match(migration, /context_type = 'job'/);
});

test("direct agreements remain distinct and support stays separate", async () => {
  const [route, migration] = await Promise.all([
    source("apps/web/src/app/api/deal-rooms/route.ts"),
    source("supabase/migrations/202607300003_phase21a_conversation_inbox.sql"),
  ]);
  assert.match(route, /crypto\.randomUUID\(\)/);
  assert.match(migration, /direct_agreement/);
  assert.match(migration, /support/);
});

test("migration preserves participant-only RLS and adds pagination/search indexes", async () => {
  const [base, migration] = await Promise.all([
    source("supabase/migrations/202607300001_phase20_deal_rooms.sql"),
    source("supabase/migrations/202607300003_phase21a_conversation_inbox.sql"),
  ]);
  assert.match(base, /messages_room_select/);
  assert.match(base, /public\.is_room_participant\(room_id\)/);
  assert.doesNotMatch(base, /for select\s+using\s+\(true\)/i);
  assert.match(migration, /room_message_sequence_page_idx/);
  assert.match(migration, /participant_inbox_idx/);
  assert.match(migration, /Rollback:/);
});

test("Realtime updates previews without changing focus and cleans subscriptions", async () => {
  const [launcher, room] = await Promise.all([
    source("apps/web/src/components/deal-room/accord-chat-launcher.tsx"),
    source("apps/web/src/components/deal-room/deal-room.tsx"),
  ]);
  assert.match(launcher, /postgres_changes/);
  assert.match(launcher, /void load\(\)/);
  assert.match(launcher, /unsubscribe/);
  assert.match(room, /setNewMessageCount/);
  assert.match(room, /nearBottom/);
  assert.match(room, /unsubscribe/);
});

test("Accord Chat stays in a compact or moderately maximized floating overlay", async () => {
  const [launcher, css, legacyList, legacyRoom] = await Promise.all([
    source("apps/web/src/components/deal-room/accord-chat-launcher.tsx"),
    source("apps/web/src/components/deal-room/accord-chat-launcher.module.css"),
    source("apps/web/src/app/app/deal-rooms/page.tsx"),
    source("apps/web/src/app/app/deal-rooms/[roomId]/page.tsx"),
  ]);
  assert.match(launcher, /Maximize Accord Chat/);
  assert.match(launcher, /Restore Accord Chat/);
  assert.match(launcher, /<DealRoom/);
  assert.doesNotMatch(launcher, /href=\{`\/app\/deal-rooms/);
  assert.match(css, /width: min\(calc\(100% - 2rem\), 26rem\)/);
  assert.match(css, /width: min\(52rem, calc\(100vw - 2rem\)\)/);
  assert.match(css, /position: fixed/);
  assert.match(legacyList, /redirect\("\/app\?accordChat=open"\)/);
  assert.match(legacyRoom, /accordChat=room/);
});

test("job marketplace and publishing pages replace the Phase 21A previews", async () => {
  const [browse, post] = await Promise.all([
    source("apps/web/src/app/app/jobs/page.tsx"),
    source("apps/web/src/app/app/jobs/post/page.tsx"),
  ]);
  assert.match(browse, /export default function JobsMarketplacePage/);
  assert.match(browse, /<JobsMarketplace \/>/);
  assert.match(post, /export default function PostJobPage/);
  assert.match(post, /<PostJobForm \/>/);
});

test("wallet authentication rejects HTML without blindly parsing JSON", async () => {
  const [client, hook, challenge, verify, session, realtime] =
    await Promise.all([
      source("apps/web/src/services/deal-room/client-api.ts"),
      source("apps/web/src/components/deal-room/use-wallet-session-auth.ts"),
      source("apps/web/src/app/api/accord-chat/auth/challenge/route.ts"),
      source("apps/web/src/app/api/accord-chat/auth/verify/route.ts"),
      source("apps/web/src/app/api/accord-chat/auth/session/route.ts"),
      source("apps/web/src/app/api/accord-chat/auth/realtime/route.ts"),
    ]);
  assert.match(client, /content-type/);
  assert.match(client, /application\/json/);
  assert.match(client, /endpoint was not found/);
  assert.match(hook, /readAccordChatJson/);
  assert.doesNotMatch(hook, /challengeResponse\.json\(\)/);
  assert.doesNotMatch(hook, /verifyResponse\.json\(\)/);
  for (const route of [challenge, verify, session, realtime]) {
    assert.match(route, /Response\.json|apiError/);
  }
});
