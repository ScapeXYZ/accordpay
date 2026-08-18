import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

import { apiError } from "@/services/deal-room/http";
import {
  queryDealRoom,
  requireRoomParticipant,
} from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";
import { requireStepUpIfEnabled } from "@/services/deal-room/step-up";
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
    throw new Error("Private attachment storage is not configured.");
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
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const session = await requireWalletSession();
    await requireStepUpIfEnabled(session.address);
    const { roomId } = await params;
    await requireRoomParticipant(roomId, session.address);
    const recent = await queryDealRoom<{ count: string }>(
      `select count(*)::text as count from public.deal_room_attachments
       where room_id = $1 and lower(uploader_address) = lower($2)
         and created_at > now() - interval '10 minutes'`,
      [roomId, session.address],
    );
    if (Number(recent.rows[0]?.count ?? 0) >= 10) {
      return apiError(429, "UPLOAD_RATE_LIMIT", "Wait before uploading again.");
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return apiError(400, "FILE_REQUIRED", "Choose an attachment.");
    }
    const validated = validateAttachment({
      size: file.size,
      contentType: file.type,
      filename: file.name,
    });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const hash = sha256Bytes(bytes);
    const filename = safeFilename(validated.filename);
    const key = `${roomId}/${randomUUID()}-${filename}`;
    const configured = storage();
    const uploaded = await configured.client.storage
      .from(configured.bucket)
      .upload(key, bytes, {
        contentType: validated.contentType,
        upsert: false,
      });
    if (uploaded.error) throw uploaded.error;
    const inserted = await queryDealRoom<{ id: string }>(
      `insert into public.deal_room_attachments
       (room_id, uploader_address, storage_key, safe_filename, content_type,
        byte_size, content_hash, visibility)
       values ($1, $2, $3, $4, $5, $6, $7, 'private') returning id`,
      [
        roomId,
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
        attachment: {
          id: inserted.rows[0].id,
          filename,
          contentType: validated.contentType,
          byteSize: validated.size,
          contentHash: hash,
        },
        warning:
          "Malware scanning is not configured. Never execute untrusted files.",
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(
      400,
      "ATTACHMENT_UPLOAD_FAILED",
      error instanceof Error ? error.message : "Attachment upload failed.",
    );
  }
}
