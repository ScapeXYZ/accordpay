import { createPublicClient, http } from "viem";

import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";
import { apiError } from "@/services/deal-room/http";
import { requireWalletSession } from "@/services/deal-room/session";
import { SupabasePublicMetadataStorage } from "@/services/deal-room/supabase-storage";
import { safeFilename, validateAttachment } from "@/services/deal-room/storage";

const client = createPublicClient({
  chain: giwaSepolia,
  transport: http(
    process.env.GIWA_RPC_URL || giwaSepolia.rpcUrls.default.http[0],
  ),
});

export async function POST(request: Request) {
  try {
    const session = await requireWalletSession();
    const form = await request.formData();
    const file = form.get("file");
    const escrowId = String(form.get("escrowId") ?? "");
    const note = String(form.get("note") ?? "").trim();
    if (!(file instanceof File) || !/^[1-9]\d*$/.test(escrowId)) {
      return apiError(
        400,
        "INVALID_DELIVERY",
        "Choose a file and a valid agreement ID.",
      );
    }
    if (note.length > 2_000) {
      return apiError(400, "NOTE_TOO_LONG", "Delivery note is too long.");
    }
    const validated = validateAttachment({
      size: file.size,
      contentType: file.type,
      filename: file.name,
    });
    const escrow = (await client.readContract({
      ...accordPayEscrowContract,
      functionName: "getEscrow",
      args: [BigInt(escrowId)],
    })) as { seller: string; status: number };
    if (escrow.seller.toLowerCase() !== session.address.toLowerCase()) {
      return apiError(
        403,
        "SELLER_ONLY",
        "Only the escrow seller may submit delivery proof.",
      );
    }
    if (Number(escrow.status) !== 0) {
      return apiError(
        409,
        "INVALID_ESCROW_STATE",
        "Delivery proof may be submitted only while the escrow is Funded.",
      );
    }
    const storage = new SupabasePublicMetadataStorage();
    const uploaded = await storage.putImmutable({
      bytes: new Uint8Array(await file.arrayBuffer()),
      filename: safeFilename(validated.filename),
      contentType: validated.contentType,
    });
    const manifest = {
      schemaVersion: "1.0",
      agreementId: `ACP-${escrowId.padStart(6, "0")}`,
      escrowId,
      submitter: session.address,
      deliveryTime: new Date().toISOString(),
      evidenceItems: [
        {
          uri: uploaded.uri,
          filename: validated.filename,
          contentType: validated.contentType,
          byteSize: validated.size,
          contentHash: uploaded.hash,
        },
      ],
      privacyMode: "public",
      note,
    };
    const manifestUpload = await storage.putImmutable({
      bytes: new TextEncoder().encode(JSON.stringify(manifest)),
      filename: `accordpay-delivery-${escrowId}.json`,
      contentType: "application/json",
    });
    return Response.json({
      evidenceUri: manifestUpload.uri,
      evidenceHash: manifestUpload.hash,
      manifest,
      warning:
        "Automated malware scanning is not configured. Treat downloaded files as untrusted.",
    });
  } catch (error) {
    return apiError(
      400,
      "DELIVERY_UPLOAD_FAILED",
      error instanceof Error ? error.message : "Delivery upload failed.",
    );
  }
}
