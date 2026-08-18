import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

import { apiError } from "@/services/deal-room/http";
import { queryDealRoom } from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";
import {
  safeFilename,
  sha256Bytes,
  validateAttachment,
} from "@/services/deal-room/storage";

function storage() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!url || !key || !bucket) {
    throw new Error("Job attachment storage is not configured.");
  }
  return {
    client: createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    bucket,
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await requireWalletSession();
    const { jobId } = await context.params;
    const owned = await queryDealRoom(
      `select id from public.jobs
       where id = $1 and lower(client_wallet) = lower($2)`,
      [jobId, session.address],
    );
    if (!owned.rows[0]) {
      return apiError(
        403,
        "JOB_OWNER_REQUIRED",
        "Only the job poster may attach files.",
      );
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return apiError(400, "FILE_REQUIRED", "Choose an attachment.");
    }
    if (file.size > 10 * 1024 * 1024) {
      return apiError(
        400,
        "FILE_TOO_LARGE",
        "Job attachments cannot exceed 10 MB.",
      );
    }
    const validated = validateAttachment({
      size: file.size,
      contentType: file.type,
      filename: file.name,
    });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const filename = safeFilename(validated.filename);
    const hash = sha256Bytes(bytes);
    const key = `jobs/${jobId}/${randomUUID()}-${filename}`;
    const configured = storage();
    const uploaded = await configured.client.storage
      .from(configured.bucket)
      .upload(key, bytes, {
        contentType: validated.contentType,
        upsert: false,
      });
    if (uploaded.error) throw uploaded.error;
    const inserted = await queryDealRoom<{ id: string }>(
      `insert into public.job_attachments
       (job_id, uploader_wallet, storage_key, safe_filename, content_type,
        byte_size, content_hash)
       values ($1,$2,$3,$4,$5,$6,$7) returning id`,
      [
        jobId,
        session.address,
        key,
        filename,
        validated.contentType,
        validated.size,
        hash,
      ],
    );
    return Response.json(
      {
        ok: true,
        attachment: {
          id: inserted.rows[0].id,
          filename,
          contentType: validated.contentType,
          byteSize: validated.size,
          contentHash: hash,
        },
        warning:
          "Malware scanning is not configured. Do not execute untrusted files.",
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(
      400,
      "JOB_ATTACHMENT_FAILED",
      error instanceof Error
        ? error.message
        : "The attachment was not uploaded.",
    );
  }
}
