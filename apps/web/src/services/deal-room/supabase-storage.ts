import { createClient } from "@supabase/supabase-js";

import {
  sha256Bytes,
  validateAttachment,
  type MetadataStorage,
} from "./storage";

function serverStorageClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRole) {
    throw new Error("Supabase Storage is not configured.");
  }
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export class SupabasePublicMetadataStorage implements MetadataStorage {
  readonly provider = "supabase-public-metadata";

  async putImmutable(input: {
    bytes: Uint8Array;
    filename: string;
    contentType: string;
  }) {
    validateAttachment({
      size: input.bytes.byteLength,
      contentType: input.contentType,
      filename: input.filename,
    });
    const hash = sha256Bytes(input.bytes);
    const bucket = process.env.SUPABASE_PUBLIC_METADATA_BUCKET?.trim();
    if (!bucket) throw new Error("Public metadata bucket is not configured.");
    const key = `${hash.slice(7, 23)}/${hash.slice(7)}-${input.filename}`;
    const client = serverStorageClient();
    const uploaded = await client.storage
      .from(bucket)
      .upload(key, input.bytes, {
        contentType: input.contentType,
        upsert: false,
        cacheControl: "31536000",
      });
    if (uploaded.error && !uploaded.error.message.includes("already exists")) {
      throw uploaded.error;
    }
    const { data } = client.storage.from(bucket).getPublicUrl(key);
    if (!data.publicUrl) throw new Error("Public metadata URL is unavailable.");
    return { uri: data.publicUrl, hash };
  }
}
