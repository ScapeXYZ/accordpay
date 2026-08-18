import type { QueryResultRow } from "pg";

import { queryDealRoom } from "@/services/deal-room/database";
import { resolveJobClientIdentity, type MarketplaceJob } from "./job-model";

export type JobRow = QueryResultRow & {
  id: string;
  client_wallet: `0x${string}`;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  skills: string[];
  budget_amount: string;
  budget_type: "fixed" | "hourly";
  currency: "Test ETH";
  deadline: Date;
  status: MarketplaceJob["status"];
  proposal_count: number;
  is_demo: boolean;
  created_at: Date;
};

type ProfileRow = QueryResultRow & {
  wallet_address: string;
  display_name: string | null;
};

export const publicJobSelect = `select j.id, j.client_wallet,
  j.title, j.slug, j.short_description, j.description, j.category, j.skills,
  j.budget_amount::text, j.budget_type, j.currency, j.deadline, j.status,
  j.proposal_count, j.is_demo, j.created_at
  from public.jobs j`;

export function mapJob(
  row: JobRow,
  displayName: string | null = null,
): MarketplaceJob {
  return {
    id: row.id,
    clientWallet: row.client_wallet,
    clientDisplayName: displayName,
    clientIdentity: resolveJobClientIdentity(row.client_wallet, displayName),
    title: row.title,
    slug: row.slug,
    shortDescription: row.short_description,
    description: row.description,
    category: row.category,
    skills: row.skills,
    budgetAmount: row.budget_amount,
    budgetType: row.budget_type,
    currency: row.currency,
    deadline: row.deadline.toISOString(),
    status: row.status,
    proposalCount: row.proposal_count,
    isDemo: row.is_demo,
    createdAt: row.created_at.toISOString(),
  };
}

async function readOptionalProfileNames(walletAddresses: readonly string[]) {
  const wallets = [
    ...new Set(walletAddresses.map((wallet) => wallet.toLowerCase())),
  ];
  if (!wallets.length) return new Map<string, string>();

  try {
    const availability = await queryDealRoom<{ relation: string | null }>(
      `select to_regclass('public.wallet_profiles')::text as relation`,
    );
    if (!availability.rows[0]?.relation) return new Map<string, string>();

    const profiles = await queryDealRoom<ProfileRow>(
      `select wallet_address, display_name
       from public.wallet_profiles
       where lower(wallet_address) = any($1::text[])
         and display_name is not null`,
      [wallets],
    );
    return new Map(
      profiles.rows.map((profile) => [
        profile.wallet_address.toLowerCase(),
        profile.display_name ?? "",
      ]),
    );
  } catch {
    // Profile enrichment is optional. A partially migrated database must still
    // return jobs using the canonical client wallet as its identity fallback.
    return new Map<string, string>();
  }
}

async function mapJobsWithOptionalProfiles(rows: readonly JobRow[]) {
  const profiles = await readOptionalProfileNames(
    rows.map((row) => row.client_wallet),
  );
  return rows.map((row) =>
    mapJob(row, profiles.get(row.client_wallet.toLowerCase()) || null),
  );
}

export async function readJobClientIdentity(walletAddress: `0x${string}`) {
  const profiles = await readOptionalProfileNames([walletAddress]);
  const displayName = profiles.get(walletAddress.toLowerCase()) || null;
  return {
    displayName,
    identity: resolveJobClientIdentity(walletAddress, displayName),
  };
}

export async function readPublicJobs() {
  const result = await queryDealRoom<JobRow>(
    `${publicJobSelect}
     where j.visibility = 'public' and j.status = 'open'
     order by j.created_at desc limit 100`,
  );
  return mapJobsWithOptionalProfiles(result.rows);
}

export async function readPublicJob(jobId: string) {
  const result = await queryDealRoom<JobRow>(
    `${publicJobSelect}
     where j.id = $1 and j.visibility = 'public' and j.status = 'open'
     limit 1`,
    [jobId],
  );
  return result.rows[0]
    ? (await mapJobsWithOptionalProfiles(result.rows))[0]
    : null;
}

export async function readOwnedJob(jobId: string, wallet: string) {
  const result = await queryDealRoom<JobRow>(
    `${publicJobSelect}
     where j.id = $1 and lower(j.client_wallet) = lower($2)
     limit 1`,
    [jobId, wallet],
  );
  return result.rows[0]
    ? (await mapJobsWithOptionalProfiles(result.rows))[0]
    : null;
}
