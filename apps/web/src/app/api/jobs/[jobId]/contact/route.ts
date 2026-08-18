import { randomUUID } from "node:crypto";

import { apiError } from "@/services/deal-room/http";
import { withDealRoomTransaction } from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";
import { readJobClientIdentity } from "@/services/jobs/job-database";

export async function POST(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await requireWalletSession();
    const { jobId } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(jobId)) {
      return apiError(400, "INVALID_JOB_ID", "The job ID is invalid.");
    }
    const result = await withDealRoomTransaction(async (client) => {
      await client.query(
        "select pg_advisory_xact_lock(hashtextextended($1, 0))",
        [`${jobId}:${session.address.toLowerCase()}`],
      );
      const jobResult = await client.query<{
        id: string;
        title: string;
        client_wallet: string;
        budget_amount: string;
        budget_type: string;
        deadline: Date;
      }>(
        `select id, title, client_wallet, budget_amount::text, budget_type, deadline
         from public.jobs
         where id = $1 and visibility = 'public' and status = 'open'
         for update`,
        [jobId],
      );
      const job = jobResult.rows[0];
      if (!job) throw new Error("This job is not open for conversations.");
      if (job.client_wallet.toLowerCase() === session.address.toLowerCase()) {
        throw new Error("The job poster cannot contact themselves.");
      }
      const existing = await client.query<{ id: string }>(
        `select id from public.deal_rooms
         where context_type = 'job' and context_id = $1
           and lower(buyer_address) = lower($2)
           and lower(seller_address) = lower($3)
         limit 1`,
        [jobId, job.client_wallet, session.address],
      );
      if (existing.rows[0]) {
        return { roomId: existing.rows[0].id, reused: true, job };
      }
      const roomId = randomUUID();
      await client.query(
        `insert into public.deal_rooms
         (id, created_by, buyer_address, seller_address, status, title,
          context_type, context_id)
         values ($1,$2,$3,$4,'negotiating',$5,'job',$6)`,
        [
          roomId,
          session.address,
          job.client_wallet,
          session.address,
          job.title,
          jobId,
        ],
      );
      await client.query(
        `insert into public.deal_room_participants
         (room_id, wallet_address, role)
         values ($1,$2,'buyer'),($1,$3,'seller')`,
        [roomId, job.client_wallet, session.address],
      );
      await client.query(
        `insert into public.deal_room_messages
         (room_id, sender_address, client_id, message_type, body, message_payload)
         values ($1,$2,$3,'system',$4,$5::jsonb)`,
        [
          roomId,
          session.address,
          randomUUID(),
          `Conversation started for: ${job.title}`,
          JSON.stringify({ kind: "job-context", jobId }),
        ],
      );
      await client.query(
        `update public.jobs
         set proposal_count = proposal_count + 1, updated_at = now()
         where id = $1`,
        [jobId],
      );
      return { roomId, reused: false, job };
    });
    const client = await readJobClientIdentity(
      result.job.client_wallet as `0x${string}`,
    );
    return Response.json({
      ok: true,
      roomId: result.roomId,
      reused: result.reused,
      job: {
        id: jobId,
        title: result.job.title,
        clientWallet: result.job.client_wallet,
        clientDisplayName: client.displayName,
        clientIdentity: client.identity,
        budgetAmount: result.job.budget_amount,
        budgetType: result.job.budget_type,
        deadline: result.job.deadline.toISOString(),
      },
      suggestedMessage:
        "Hi, I’m interested in this job. Is it still available?",
    });
  } catch (error) {
    return apiError(
      400,
      "JOB_CONTACT_FAILED",
      error instanceof Error
        ? error.message
        : "The conversation could not be opened.",
    );
  }
}
