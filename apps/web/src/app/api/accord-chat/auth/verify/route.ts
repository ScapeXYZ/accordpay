import { isAddress, isHex } from "viem";

import { apiError, readJsonBody } from "@/services/deal-room/http";
import {
  setWalletSessionCookie,
  verifyWalletChallenge,
} from "@/services/deal-room/session";

export async function POST(request: Request) {
  try {
    const body = (await readJsonBody(request, 16_384)) as Record<
      string,
      unknown
    >;
    if (
      typeof body.address !== "string" ||
      !isAddress(body.address) ||
      typeof body.challengeId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(body.challengeId) ||
      typeof body.message !== "string" ||
      typeof body.signature !== "string" ||
      !isHex(body.signature)
    ) {
      return apiError(400, "INVALID_AUTH_PROOF", "Wallet proof is malformed.");
    }
    const session = await verifyWalletChallenge({
      address: body.address,
      challengeId: body.challengeId,
      message: body.message,
      signature: body.signature,
    });
    await setWalletSessionCookie(session.token);
    return Response.json({
      ok: true,
      authenticated: true,
      wallet: session.wallet,
      expires: session.expires,
    });
  } catch (error) {
    return apiError(
      401,
      "AUTH_FAILED",
      error instanceof Error ? error.message : "Wallet authentication failed.",
    );
  }
}
