import { createHash } from "node:crypto";

export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/json",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "text/markdown",
  "application/zip",
]);

export interface MetadataStorage {
  readonly provider: string;
  putImmutable(input: {
    bytes: Uint8Array;
    filename: string;
    contentType: string;
  }): Promise<{ uri: string; hash: string }>;
}

export function safeFilename(input: string) {
  return (
    input
      .normalize("NFKC")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120) || "attachment"
  );
}

export function validateAttachment(input: {
  size: number;
  contentType: string;
  filename: string;
}) {
  if (input.size < 1 || input.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("Attachment must be between 1 byte and 25 MB.");
  }
  if (!ALLOWED_ATTACHMENT_TYPES.has(input.contentType)) {
    throw new Error("This attachment type is not supported.");
  }
  return { ...input, filename: safeFilename(input.filename) };
}

export function sha256Bytes(bytes: Uint8Array) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export function metadataStorageConfigured() {
  return Boolean(
    process.env.METADATA_STORAGE_PROVIDER &&
    (process.env.IPFS_PROVIDER_URL ||
      process.env.ARWEAVE_PROVIDER_URL ||
      process.env.APP_URL),
  );
}
