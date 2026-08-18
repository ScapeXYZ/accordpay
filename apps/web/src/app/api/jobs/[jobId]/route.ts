import { apiError, readJsonBody } from "@/services/deal-room/http";
import { queryDealRoom } from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";
import {
  readOwnedJob,
  readPublicJob,
  readPublicJobs,
} from "@/services/jobs/job-database";

const jobIdPattern = /^[0-9a-f-]{36}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await context.params;
    if (!jobIdPattern.test(jobId)) {
      return apiError(400, "INVALID_JOB_ID", "The job ID is invalid.");
    }
    let job = await readPublicJob(jobId);
    if (!job) {
      try {
        const session = await requireWalletSession();
        job = await readOwnedJob(jobId, session.address);
      } catch {
        // Public browsing does not require a wallet session.
      }
    }
    if (!job)
      return apiError(404, "JOB_NOT_FOUND", "This public job was not found.");
    const related = (await readPublicJobs())
      .filter(
        (candidate) =>
          candidate.id !== job.id && candidate.category === job.category,
      )
      .slice(0, 3);
    const attachments = await queryDealRoom<{
      id: string;
      safe_filename: string;
      content_type: string;
      byte_size: string;
      content_hash: string;
    }>(
      `select id, safe_filename, content_type, byte_size::text, content_hash
       from public.job_attachments where job_id = $1 order by created_at`,
      [jobId],
    );
    return Response.json({
      ok: true,
      job,
      related,
      attachments: attachments.rows,
    });
  } catch {
    return apiError(503, "JOB_UNAVAILABLE", "The job could not be loaded.");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await requireWalletSession();
    const { jobId } = await context.params;
    const body = (await readJsonBody(request, 2_048)) as {
      status?: unknown;
    };
    if (!jobIdPattern.test(jobId)) {
      return apiError(400, "INVALID_JOB_ID", "The job ID is invalid.");
    }
    if (!["open", "closed", "cancelled"].includes(String(body.status))) {
      return apiError(
        400,
        "INVALID_JOB_STATUS",
        "The requested job status is invalid.",
      );
    }
    const updated = await queryDealRoom<{ id: string }>(
      `update public.jobs set status = $3, updated_at = now()
       where id = $1 and lower(client_wallet) = lower($2)
       returning id`,
      [jobId, session.address, body.status],
    );
    if (!updated.rows[0]) {
      return apiError(
        403,
        "JOB_OWNER_REQUIRED",
        "Only the job poster may update this job.",
      );
    }
    return Response.json({ ok: true, jobId });
  } catch (error) {
    return apiError(
      401,
      "JOB_UPDATE_FAILED",
      error instanceof Error ? error.message : "The job was not updated.",
    );
  }
}
