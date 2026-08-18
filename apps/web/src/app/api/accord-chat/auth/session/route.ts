import { apiError } from "@/services/deal-room/http";
import { requireWalletSession } from "@/services/deal-room/session";

export async function GET() {
  try {
    const session = await requireWalletSession();
    return Response.json({
      ok: true,
      authenticated: true,
      wallet: session.address,
    });
  } catch {
    return apiError(
      401,
      "WALLET_AUTH_REQUIRED",
      "Authenticate your wallet to open Accord Chat.",
    );
  }
}
