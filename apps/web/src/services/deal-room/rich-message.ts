export function validateChatLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export type RichMessagePayload =
  | { kind: "text" }
  | {
      kind: "attachment";
      attachmentId: string;
      filename: string;
      contentType: string;
    }
  | { kind: "agreement-draft"; version: number; contentHash: string }
  | { kind: "delivery-proof"; evidenceUri: string }
  | { kind: "escrow-status"; escrowId: string; status: string };

export function safeMessageParts(value: string) {
  const candidates = value.split(/(https:\/\/[^\s]+)/g);
  return candidates.map((text) => ({
    text,
    link: validateChatLink(text),
  }));
}
