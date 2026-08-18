export const STEP_UP_SECONDS = 10 * 60;

export type StepUpClaims = {
  sub?: string;
  aal?: string;
  exp?: number;
  iat?: number;
  jti?: string;
};

export function decodeStepUpClaims(token: string): StepUpClaims {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("The MFA token is malformed.");
  try {
    return JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as StepUpClaims;
  } catch {
    throw new Error("The MFA token claims are malformed.");
  }
}

export function validateStepUpClaims(
  claims: StepUpClaims,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (
    claims.aal !== "aal2" ||
    !claims.sub ||
    !claims.exp ||
    claims.exp <= nowSeconds ||
    !claims.iat ||
    nowSeconds - claims.iat > STEP_UP_SECONDS
  ) {
    throw new Error("Recent Supabase Auth MFA verification is required.");
  }
  return claims;
}
