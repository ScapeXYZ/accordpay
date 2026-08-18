import { isAddress } from "viem";

import { requireApprovedAuthenticationOrigin } from "@/services/deal-room/auth-origin";
import { queryDealRoom } from "@/services/deal-room/database";
import { apiError, readJsonBody } from "@/services/deal-room/http";
import {
  createWalletChallenge,
  walletChallengeDigest,
} from "@/services/deal-room/session";

function trustedOrigin(request: Request) {
  return requireApprovedAuthenticationOrigin(
    process.env.APP_URL,
    request.headers.get("origin"),
  );
}

export async function POST(request: Request) {
  try {
    const body = (await readJsonBody(request, 2_048)) as {
      address?: unknown;
      chainId?: unknown;
    };
    if (typeof body.address !== "string" || !isAddress(body.address)) {
      return apiError(400, "INVALID_ADDRESS", "Enter a valid wallet address.");
    }
    if (body.chainId !== 91342) {
      return apiError(
        400,
        "UNSUPPORTED_CHAIN",
        "Switch to GIWA Sepolia before authenticating.",
      );
    }
    const challenge = createWalletChallenge({
      address: body.address,
      chainId: body.chainId,
      origin: trustedOrigin(request),
    });
    await queryDealRoom(
      `insert into public.wallet_auth_challenges
       (id, wallet_address, nonce_hash, expires_at)
       values ($1, $2, $3, $4)`,
      [
        challenge.challengeId,
        challenge.wallet,
        walletChallengeDigest(challenge.message),
        challenge.expiresAt,
      ],
    );
    return Response.json({
      ok: true,
      challengeId: challenge.challengeId,
      message: challenge.message,
      expiresAt: challenge.expiresAt.toISOString(),
    });
  } catch (error) {
    return apiError(
      503,
      "AUTH_UNAVAILABLE",
      error instanceof Error
        ? error.message
        : "Wallet authentication is unavailable.",
    );
  }
}
