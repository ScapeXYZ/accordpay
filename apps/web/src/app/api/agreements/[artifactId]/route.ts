import { apiError } from "@/services/deal-room/http";
import { queryDealRoom } from "@/services/deal-room/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  try {
    const { artifactId } = await params;
    const result = await queryDealRoom<{
      canonical_content: Record<string, unknown>;
      version: number;
      content_hash: string;
      finalized_at: Date;
      privacy_mode: "public" | "private";
    }>(
      `select v.canonical_content, v.version, v.content_hash, v.finalized_at,
              v.privacy_mode
       from public.agreement_artifacts a
       join public.agreement_versions v on v.id = a.agreement_version_id
       where a.id = $1 and a.immutable = true`,
      [artifactId],
    );
    const artifact = result.rows[0];
    if (!artifact || artifact.privacy_mode !== "public") {
      return apiError(404, "ARTIFACT_NOT_FOUND", "Agreement not found.");
    }
    const approvals = await queryDealRoom<{
      role: string;
      approver_address: string;
      approved_at: Date;
      signature: string | null;
    }>(
      `select ap.role, ap.approver_address, ap.approved_at, ap.signature
       from public.agreement_approvals ap
       join public.agreement_artifacts a
         on a.agreement_version_id = ap.agreement_version_id
       where a.id = $1 order by ap.role`,
      [artifactId],
    );
    return Response.json(
      {
        ...artifact.canonical_content,
        agreementVersion: artifact.version,
        finalContentHash: artifact.content_hash,
        creationTime: artifact.finalized_at.toISOString(),
        buyerApprovalEvidence:
          approvals.rows.find((approval) => approval.role === "buyer") ?? null,
        sellerApprovalEvidence:
          approvals.rows.find((approval) => approval.role === "seller") ?? null,
      },
      {
        headers: {
          "cache-control": "public, max-age=31536000, immutable",
          "content-disposition": `inline; filename="accordpay-agreement-${artifactId}.json"`,
          "x-content-type-options": "nosniff",
        },
      },
    );
  } catch {
    return apiError(404, "ARTIFACT_NOT_FOUND", "Agreement not found.");
  }
}
