import { apiError, readJsonBody } from "@/services/deal-room/http";
import { requireWalletSession } from "@/services/deal-room/session";
import {
  createStepUpSession,
  setStepUpCookie,
} from "@/services/deal-room/step-up";

export async function POST(request: Request) {
  try {
    const wallet = await requireWalletSession();
    const body = (await readJsonBody(request, 16_384)) as {
      accessToken?: unknown;
    };
    if (typeof body.accessToken !== "string" || !body.accessToken) {
      return apiError(
        400,
        "MFA_TOKEN_REQUIRED",
        "A Supabase Auth MFA access token is required.",
      );
    }
    const session = await createStepUpSession({
      walletAddress: wallet.address,
      accessToken: body.accessToken,
    });
    await setStepUpCookie(session.token);
    return Response.json({
      verified: true,
      expiresAt: new Date(session.expires * 1000).toISOString(),
      disclosure:
        "Additional verification protects actions performed through AccordPay. A person controlling your wallet may still interact directly with the current smart contract.",
    });
  } catch (error) {
    return apiError(
      403,
      "STEP_UP_REJECTED",
      error instanceof Error
        ? error.message
        : "Additional verification failed.",
    );
  }
}
