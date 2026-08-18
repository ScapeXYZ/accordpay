import { randomUUID } from "node:crypto";

import { apiError, readJsonBody } from "@/services/deal-room/http";
import { queryDealRoom } from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";
import { jobSlug, validateJobDraft } from "@/services/jobs/job-model";
import {
  readJobClientIdentity,
  readPublicJobs,
} from "@/services/jobs/job-database";

export async function GET() {
  try {
    return Response.json({ ok: true, jobs: await readPublicJobs() });
  } catch {
    return apiError(
      503,
      "JOBS_UNAVAILABLE",
      "Public jobs could not be loaded. Please retry.",
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireWalletSession();
    const body = (await readJsonBody(request, 16_384)) as Record<
      string,
      unknown
    >;
    const validated = validateJobDraft(body);
    if (!validated.valid) {
      return apiError(400, "INVALID_JOB", validated.error);
    }
    const input = validated.value;
    const id = randomUUID();
    const slug = `${jobSlug(input.title)}-${id.slice(0, 8)}`;
    const result = await queryDealRoom<{ id: string }>(
      `insert into public.jobs
       (id, client_wallet, title, slug, short_description, description,
        category, skills, budget_amount, budget_type, deadline, status,
        visibility, is_demo)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'open',$12,false)
       returning id`,
      [
        id,
        session.address,
        input.title,
        slug,
        input.shortDescription,
        input.description,
        input.category,
        input.skills,
        input.budgetAmount,
        input.budgetType,
        input.deadline,
        input.visibility,
      ],
    );
    const client = await readJobClientIdentity(session.address);
    return Response.json(
      {
        ok: true,
        jobId: result.rows[0].id,
        clientIdentity: client.identity,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(
      401,
      "JOB_PUBLISH_FAILED",
      error instanceof Error ? error.message : "The job was not published.",
    );
  }
}
