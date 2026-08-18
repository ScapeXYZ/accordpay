import { createClient } from "@supabase/supabase-js";

import { apiError } from "@/services/deal-room/http";
import { queryDealRoom } from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  try {
    const { attachmentId } = await context.params;
    const result = await queryDealRoom<{
      storage_key: string;
      visibility: string;
      status: string;
      client_wallet: string;
    }>(
      `select a.storage_key, j.visibility, j.status, j.client_wallet
       from public.job_attachments a join public.jobs j on j.id = a.job_id
       where a.id = $1`,
      [attachmentId],
    );
    const row = result.rows[0];
    if (!row)
      return apiError(404, "ATTACHMENT_NOT_FOUND", "Attachment not found.");
    const publicOpen = row.visibility === "public" && row.status === "open";
    if (!publicOpen) {
      const session = await requireWalletSession();
      if (session.address.toLowerCase() !== row.client_wallet.toLowerCase()) {
        return apiError(
          403,
          "ATTACHMENT_ACCESS_DENIED",
          "Attachment access was denied.",
        );
      }
    }
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET;
    if (!url || !key || !bucket)
      throw new Error("Job attachment storage is not configured.");
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const signed = await client.storage
      .from(bucket)
      .createSignedUrl(row.storage_key, 60);
    if (signed.error || !signed.data.signedUrl)
      throw signed.error ?? new Error("Signed URL unavailable.");
    return Response.redirect(signed.data.signedUrl, 307);
  } catch (error) {
    return apiError(
      403,
      "ATTACHMENT_ACCESS_DENIED",
      error instanceof Error ? error.message : "Attachment access was denied.",
    );
  }
}
