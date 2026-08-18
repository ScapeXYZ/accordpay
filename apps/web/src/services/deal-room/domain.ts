import { createHash, randomUUID } from "node:crypto";

export const roomRoles = ["buyer", "seller"] as const;
export type RoomRole = (typeof roomRoles)[number];

export const roomStatuses = [
  "draft",
  "awaiting_counterparty",
  "negotiating",
  "awaiting_buyer_approval",
  "awaiting_seller_approval",
  "approved",
  "awaiting_escrow_creation",
  "funded",
  "delivered",
  "disputed",
  "completed",
  "refunded",
  "archived",
] as const;
export type RoomStatus = (typeof roomStatuses)[number];

export type AgreementContent = {
  schemaVersion: "1.0";
  roomId: string;
  version: number;
  title: string;
  description: string;
  buyer: string;
  seller: string;
  amount: string;
  currency: "Test ETH";
  network: "GIWA Sepolia";
  chainId: 91342;
  contractAddress: string;
  deadline: string;
  deliverables: string[];
  acceptanceCriteria: string[];
  requiredDeliveryEvidence: string[];
  revisionConditions: string;
  refundConditions: string;
  disputeConditions: string;
  additionalTerms: string;
  privacyMode: "public" | "private";
};

export function canonicalize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashCanonicalAgreement(content: AgreementContent) {
  return `sha256:${createHash("sha256").update(canonicalize(content)).digest("hex")}`;
}

export function nextAgreementVersion(
  currentVersion: number,
  content: AgreementContent,
) {
  return {
    id: randomUUID(),
    version: currentVersion + 1,
    content,
    contentHash: hashCanonicalAgreement(content),
    buyerApproved: false,
    sellerApproved: false,
  };
}

export function mayApproveVersion({
  sessionAddress,
  participantAddress,
  requestedHash,
  currentHash,
}: {
  sessionAddress: string;
  participantAddress: string;
  requestedHash: string;
  currentHash: string;
}) {
  return (
    sessionAddress.toLowerCase() === participantAddress.toLowerCase() &&
    requestedHash === currentHash
  );
}

export function normalizeMessage(body: string) {
  const normalized = body.trim();
  if (!normalized || normalized.length > 4_000) {
    throw new Error("Message must contain 1–4,000 characters.");
  }
  return normalized;
}
