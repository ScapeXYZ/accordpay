import { createClient } from "@supabase/supabase-js";

import { apiError } from "@/services/deal-room/http";
import {
  queryDealRoom,
  requireRoomParticipant,
} from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";
import { requireStepUpIfEnabled } from "@/services/deal-room/step-up";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  try {
    const session = await requireWalletSession();
    await requireStepUpIfEnabled(session.address);
    const { attachmentId } = await params;
    const result = await queryDealRoom<{
      room_id: string;
      storage_key: string;
      safe_filename: string;
      content_type: string;
      byte_size: string;
      content_hash: string;
    }>(
      `select room_id, storage_key, safe_filename, content_type,
              byte_size::text, content_hash
       from public.deal_room_attachments where id = $1`,
      [attachmentId],
    );
    const attachment = result.rows[0];
    if (!attachment) {
      return apiError(404, "ATTACHMENT_NOT_FOUND", "Attachment not found.");
    }
    await requireRoomParticipant(attachment.room_id, session.address);
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET;
    if (!url || !key || !bucket) throw new Error("Storage unavailable.");
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const signed = await client.storage
      .from(bucket)
      .createSignedUrl(attachment.storage_key, 60);
    if (signed.error) throw signed.error;
    return Response.redirect(signed.data.signedUrl, 307);
  } catch {
    return apiError(
      403,
      "ATTACHMENT_ACCESS_DENIED",
      "Attachment access denied.",
    );
  }
}
