import { apiError } from "@/services/deal-room/http";
import {
  createSupabaseWalletToken,
  requireWalletSession,
} from "@/services/deal-room/session";

export async function GET() {
  try {
    const session = await requireWalletSession();
    return Response.json({
      ok: true,
      token: createSupabaseWalletToken(session.address),
      expiresIn: 900,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Realtime is unavailable.";
    const unauthorized =
      /wallet authentication is required|wallet session is invalid|wallet session is no longer active/i.test(
        message,
      );
    return apiError(
      unauthorized ? 401 : 503,
      unauthorized ? "WALLET_AUTH_REQUIRED" : "REALTIME_UNAVAILABLE",
      message,
    );
  }
}
