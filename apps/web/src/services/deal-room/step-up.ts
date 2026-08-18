import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { queryDealRoom } from "./database";
import {
  decodeStepUpClaims,
  STEP_UP_SECONDS,
  validateStepUpClaims,
} from "./step-up-model";

const COOKIE = "accordpay_step_up";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function sessionSecret() {
  const value = process.env.WALLET_SESSION_SECRET?.trim();
  if (!value || value.length < 32) {
    throw new Error("Step-up security is temporarily unavailable.");
  }
  return value;
}

function signature(value: string) {
  return createHmac("sha256", sessionSecret())
    .update(value)
    .digest("base64url");
}

export async function createStepUpSession(input: {
  walletAddress: string;
  accessToken: string;
}) {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new Error("Supabase Auth MFA is not configured.");
  }
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(input.accessToken);
  if (error || !data.user) throw new Error("Supabase MFA identity is invalid.");
  const claims = validateStepUpClaims(decodeStepUpClaims(input.accessToken));
  if (claims.sub !== data.user.id) {
    throw new Error("Supabase MFA identity does not match its token.");
  }
  const identity = await queryDealRoom<{
    wallet_address: string;
    supabase_user_id: string;
    enabled: boolean;
  }>(
    `select wallet_address, supabase_user_id, enabled
     from public.wallet_mfa_identities
     where lower(wallet_address) = lower($1) or supabase_user_id = $2`,
    [input.walletAddress, data.user.id],
  );
  const linked = identity.rows[0];
  if (
    linked &&
    (linked.wallet_address.toLowerCase() !==
      input.walletAddress.toLowerCase() ||
      linked.supabase_user_id !== data.user.id)
  ) {
    throw new Error("This MFA identity is already linked to another wallet.");
  }
  if (!linked) {
    await queryDealRoom(
      `insert into public.wallet_mfa_identities
       (wallet_address, supabase_user_id, enabled) values ($1, $2, true)`,
      [input.walletAddress, data.user.id],
    );
  } else if (!linked.enabled) {
    await queryDealRoom(
      `update public.wallet_mfa_identities set enabled = true, updated_at = now()
       where lower(wallet_address) = lower($1) and supabase_user_id = $2`,
      [input.walletAddress, data.user.id],
    );
  }
  const tokenId = claims.jti ?? hash(input.accessToken);
  const jtiHash = hash(tokenId);
  const replay = await queryDealRoom(
    "select id from public.step_up_sessions where token_jti_hash = $1",
    [jtiHash],
  );
  if (replay.rows[0]) {
    throw new Error("This MFA verification has already been used.");
  }
  const expires = Math.min(
    claims.exp!,
    Math.floor(Date.now() / 1000) + STEP_UP_SECONDS,
  );
  const payload = `${input.walletAddress.toLowerCase()}.${data.user.id}.${expires}.${jtiHash}`;
  const token = `${payload}.${signature(payload)}`;
  await queryDealRoom(
    `insert into public.step_up_sessions
     (wallet_address, supabase_user_id, assurance_level, token_jti_hash, expires_at)
     values ($1, $2, 'aal2', $3, to_timestamp($4))`,
    [input.walletAddress, data.user.id, jtiHash, expires],
  );
  return { token, expires };
}

export async function setStepUpCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: STEP_UP_SECONDS,
  });
}

export async function requireStepUpIfEnabled(walletAddress: string) {
  const identity = await queryDealRoom<{ enabled: boolean }>(
    `select enabled from public.wallet_mfa_identities
     where lower(wallet_address) = lower($1)`,
    [walletAddress],
  );
  if (!identity.rows[0]?.enabled) return { required: false };
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) throw new Error("Recent additional verification is required.");
  const parts = token.split(".");
  if (parts.length !== 5) throw new Error("Step-up session is invalid.");
  const [wallet, userId, expiresText, jtiHash, supplied] = parts;
  const payload = `${wallet}.${userId}.${expiresText}.${jtiHash}`;
  const expected = Buffer.from(signature(payload));
  const actual = Buffer.from(supplied);
  if (
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual) ||
    wallet !== walletAddress.toLowerCase() ||
    Number(expiresText) <= Math.floor(Date.now() / 1000)
  ) {
    throw new Error("Step-up session is invalid or expired.");
  }
  const active = await queryDealRoom(
    `select id from public.step_up_sessions
     where token_jti_hash = $1 and lower(wallet_address) = lower($2)
       and consumed_at is null and expires_at > now()`,
    [jtiHash, walletAddress],
  );
  if (!active.rows[0]) throw new Error("Step-up session is no longer active.");
  return { required: true };
}
