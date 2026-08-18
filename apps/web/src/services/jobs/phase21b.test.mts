import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  jobMatchesFilters,
  parsePositiveBudget,
  resolveJobClientIdentity,
  validateJobDraft,
  type MarketplaceJob,
} from "./job-model.ts";

const root = new URL("../../../../../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");
const job = (overrides: Partial<MarketplaceJob> = {}): MarketplaceJob => ({
  id: "21000000-0000-4000-8000-000000000001",
  clientWallet: "0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d",
  clientDisplayName: null,
  clientIdentity: "0x7748…290d",
  title: "Build an accessible product website",
  slug: "accessible-product-website",
  shortDescription: "A responsive TypeScript and accessibility project.",
  description:
    "Build a responsive website with accessible navigation, clear content structure, and documented setup.",
  category: "Web Development",
  skills: ["TypeScript", "Accessibility"],
  budgetAmount: "1.5",
  budgetType: "fixed",
  currency: "Test ETH",
  deadline: "2027-12-31T00:00:00.000Z",
  status: "open",
  proposalCount: 2,
  isDemo: true,
  createdAt: "2026-07-30T00:00:00.000Z",
  ...overrides,
});

test("Service Hub marks Jobs & Services available", async () => {
  const hub = await source("apps/web/src/app/app/page.tsx");
  assert.match(hub, /Jobs & Services/);
  assert.match(hub, /Browse jobs, contact clients/);
  assert.match(hub, /status: "Available"/);
});

test("marketplace and detail routes exist", async () => {
  const [browse, detail, post] = await Promise.all([
    source("apps/web/src/app/app/jobs/page.tsx"),
    source("apps/web/src/app/app/jobs/[jobId]/page.tsx"),
    source("apps/web/src/app/app/jobs/post/page.tsx"),
  ]);
  assert.match(browse, /JobsMarketplace/);
  assert.match(detail, /JobDetail/);
  assert.match(post, /PostJobForm/);
});

test("seed contains twelve realistic idempotent demo jobs", async () => {
  const migration = await source(
    "supabase/migrations/202607300004_phase21b_jobs_marketplace.sql",
  );
  assert.equal((migration.match(/true,now\(\) - interval/g) ?? []).length, 12);
  assert.match(migration, /on conflict \(id\) do nothing/);
  for (const category of [
    "Web Development",
    "Design",
    "Writing",
    "Marketing",
    "Blockchain",
    "Video Editing",
    "Data Entry",
    "Mobile Development",
  ]) {
    assert.match(migration, new RegExp(category));
  }
});

test("search, category, budget, type, and open filters work", () => {
  assert.equal(
    jobMatchesFilters(job(), {
      search: "accessibility",
      category: "Web Development",
      budgetType: "fixed",
      minimumBudget: 1,
      openOnly: true,
    }),
    true,
  );
  assert.equal(
    jobMatchesFilters(job({ status: "closed" }), {
      search: "",
      category: "",
      budgetType: "",
      minimumBudget: 0,
      openOnly: true,
    }),
    false,
  );
});

test("budget and deadline validation reject invalid jobs", () => {
  assert.equal(parsePositiveBudget("0").valid, false);
  assert.equal(parsePositiveBudget("-2").valid, false);
  const invalid = validateJobDraft({
    title: "Valid job title",
    description: "A".repeat(60),
    category: "Design",
    skills: "Figma",
    budgetAmount: "1",
    budgetType: "fixed",
    deadline: "2020-01-01T00:00:00.000Z",
    confirmed: true,
  });
  assert.equal(invalid.valid, false);
});

test("valid job input is normalized without a client wallet field", () => {
  const valid = validateJobDraft({
    title: "Design a useful mobile experience",
    description:
      "Create a complete mobile UX flow with accessible screens and clear handoff notes.",
    category: "Design",
    skills: "Figma, UX Design, Figma",
    budgetAmount: "0.75",
    budgetType: "fixed",
    deadline: "2027-12-31T00:00:00.000Z",
    visibility: "public",
    confirmed: true,
  });
  assert.equal(valid.valid, true);
  if (valid.valid) assert.deepEqual(valid.value.skills, ["Figma", "UX Design"]);
  assert.equal("clientWallet" in (valid.valid ? valid.value : {}), false);
});

test("public browsing does not require a wallet session", async () => {
  const route = await source("apps/web/src/app/api/jobs/route.ts");
  const getBody = route.slice(
    route.indexOf("export async function GET"),
    route.indexOf("export async function POST"),
  );
  assert.doesNotMatch(getBody, /requireWalletSession/);
  assert.match(getBody, /readPublicJobs/);
});

test("job reads do not require wallet_profiles to exist", async () => {
  const database = await source("apps/web/src/services/jobs/job-database.ts");
  const primarySelect = database.slice(
    database.indexOf("export const publicJobSelect"),
    database.indexOf("export function mapJob"),
  );
  assert.doesNotMatch(primarySelect, /wallet_profiles|display_name|left join/i);
  assert.match(database, /to_regclass\('public\.wallet_profiles'\)/);
  assert.match(database, /Profile enrichment is optional/);
});

test("client identity falls back to shortened wallet without a profile", () => {
  assert.equal(
    resolveJobClientIdentity("0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d"),
    "0x7748…290d",
  );
});

test("an existing profile display name is used when available", () => {
  assert.equal(
    resolveJobClientIdentity(
      "0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d",
      "Verified client",
    ),
    "Verified client",
  );
});

test("job detail and related jobs succeed without profile data", async () => {
  const [route, database] = await Promise.all([
    source("apps/web/src/app/api/jobs/[jobId]/route.ts"),
    source("apps/web/src/services/jobs/job-database.ts"),
  ]);
  assert.match(route, /readPublicJob\(jobId\)/);
  assert.match(route, /readPublicJobs\(\)/);
  assert.doesNotMatch(route, /wallet_profiles|wallet_profiles wp/);
  assert.match(database, /return mapJobsWithOptionalProfiles\(result\.rows\)/);
});

test("publishing derives the poster from the authenticated session", async () => {
  const route = await source("apps/web/src/app/api/jobs/route.ts");
  assert.match(route, /const session = await requireWalletSession/);
  assert.match(route, /session\.address/);
  assert.match(route, /readJobClientIdentity\(session\.address\)/);
  assert.doesNotMatch(route, /body\.clientWallet|body\.client_wallet/);
});

test("job owner update cannot edit another wallet's job", async () => {
  const route = await source("apps/web/src/app/api/jobs/[jobId]/route.ts");
  assert.match(route, /lower\(client_wallet\) = lower\(\$2\)/);
  assert.match(route, /JOB_OWNER_REQUIRED/);
});

test("contact opens floating chat without navigation", async () => {
  const [button, launcher] = await Promise.all([
    source("apps/web/src/components/jobs/contact-client-button.tsx"),
    source("apps/web/src/components/deal-room/accord-chat-launcher.tsx"),
  ]);
  assert.match(button, /openAccordChat/);
  assert.doesNotMatch(button, /href|router\.push|location\./);
  assert.match(launcher, /job-contact/);
  assert.match(launcher, /contactJob/);
});

test("contact binds the live job client and current session worker", async () => {
  const route = await source(
    "apps/web/src/app/api/jobs/[jobId]/contact/route.ts",
  );
  assert.match(route, /job\.client_wallet/);
  assert.match(route, /session\.address/);
  assert.match(route, /context_type = 'job'/);
  assert.match(route, /context_id = \$1/);
  assert.match(route, /readJobClientIdentity/);
});

test("same job and worker reuse one room while different jobs remain distinct", async () => {
  const [route, migration] = await Promise.all([
    source("apps/web/src/app/api/jobs/[jobId]/contact/route.ts"),
    source("supabase/migrations/202607300003_phase21a_conversation_inbox.sql"),
  ]);
  assert.match(route, /reused: true/);
  assert.match(route, /pg_advisory_xact_lock/);
  assert.match(migration, /job_participant_conversation_unique/);
  assert.match(migration, /context_id/);
});

test("client is inserted as a participant and system context is persistent", async () => {
  const route = await source(
    "apps/web/src/app/api/jobs/[jobId]/contact/route.ts",
  );
  assert.match(route, /values \(\$1,\$2,'buyer'\),\(\$1,\$3,'seller'\)/);
  assert.match(route, /Conversation started for:/);
  assert.match(route, /message_payload/);
});

test("job context appears in floating conversation with editable suggestion", async () => {
  const [launcher, room] = await Promise.all([
    source("apps/web/src/components/deal-room/accord-chat-launcher.tsx"),
    source("apps/web/src/components/deal-room/deal-room.tsx"),
  ]);
  assert.match(launcher, /suggestedMessage/);
  assert.match(launcher, /initialDraft/);
  assert.match(room, /contextCard/);
  assert.match(room, /body\.draft \|\|\s+initialDraft/);
});

test("RLS limits public reads and owner writes", async () => {
  const [marketplace, correction] = await Promise.all([
    source("supabase/migrations/202607300004_phase21b_jobs_marketplace.sql"),
    source("supabase/migrations/202607300005_fix_jobs_wallet_rls.sql"),
  ]);
  assert.match(marketplace, /enable row level security/);
  assert.match(correction, /visibility = 'public' and status = 'open'/);
  assert.match(correction, /to anon, authenticated/);
  assert.match(correction, /to authenticated/);
  assert.doesNotMatch(correction, /using \(true\)/);
});

test("corrective migration bootstraps a missing signed-wallet helper", async () => {
  const migration = await source(
    "supabase/migrations/202607300005_fix_jobs_wallet_rls.sql",
  );
  const helper = migration.indexOf(
    "create or replace function public.request_wallet_address()",
  );
  const policies = migration.indexOf("do $policies$");
  assert.ok(helper >= 0 && helper < policies);
  assert.match(migration, /auth\.jwt\(\) ->> 'role'/);
  assert.match(migration, /auth\.jwt\(\) ->> 'wallet_address'/);
  assert.match(migration, /\^0x\[0-9a-fA-F\]\{40\}\$/);
  assert.match(migration, /to_regclass\('public\.jobs'\) is not null/);
  assert.match(
    migration,
    /to_regclass\('public\.job_attachments'\) is not null/,
  );
  assert.doesNotMatch(
    migration,
    /current_setting\(|request\.headers|x-wallet|wallet-address/i,
  );
});

test("job ownership cannot be spoofed and cross-wallet writes are denied", async () => {
  const migration = await source(
    "supabase/migrations/202607300005_fix_jobs_wallet_rls.sql",
  );
  assert.match(
    migration,
    /lower\(client_wallet\) = public\.request_wallet_address\(\)/,
  );
  assert.match(
    migration,
    /with check \(\s*public\.request_wallet_address\(\) is not null\s*and lower\(client_wallet\) = public\.request_wallet_address\(\)/,
  );
  assert.doesNotMatch(migration, /create policy jobs_owner_delete/);
  assert.match(
    migration,
    /lower\(uploader_wallet\) = public\.request_wallet_address\(\)[\s\S]*lower\(j\.client_wallet\) = public\.request_wallet_address\(\)/,
  );
});

test("job attachment ownership covers read, insert, and delete", async () => {
  const migration = await source(
    "supabase/migrations/202607300005_fix_jobs_wallet_rls.sql",
  );
  assert.match(migration, /create policy job_attachments_owner_read/);
  assert.match(migration, /create policy job_attachments_owner_insert/);
  assert.match(migration, /create policy job_attachments_owner_delete/);
  assert.doesNotMatch(migration, /create policy job_attachments_owner_update/);
});

test("posting does not create an escrow", async () => {
  const [form, route] = await Promise.all([
    source("apps/web/src/components/jobs/post-job-form.tsx"),
    source("apps/web/src/app/api/jobs/route.ts"),
  ]);
  assert.match(form, /No escrow is created/);
  assert.doesNotMatch(route, /createEscrow|AccordPayEscrow|writeContract/);
});

test("job attachments enforce ownership, type, size, hashing, and private storage", async () => {
  const [route, migration] = await Promise.all([
    source("apps/web/src/app/api/jobs/[jobId]/attachments/route.ts"),
    source("supabase/migrations/202607300004_phase21b_jobs_marketplace.sql"),
  ]);
  assert.match(route, /lower\(client_wallet\) = lower\(\$2\)/);
  assert.match(route, /10 \* 1024 \* 1024/);
  assert.match(route, /validateAttachment/);
  assert.match(route, /sha256Bytes/);
  assert.match(route, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(migration, /create table public\.job_attachments/);
  assert.match(migration, /job_attachments_owner_insert/);
});
