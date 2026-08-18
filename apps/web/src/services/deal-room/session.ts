import {
  createHash,
  createHmac,
  randomUUID,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { getAddress, verifyMessage } from "viem";

import { queryDealRoom } from "./database";

const COOKIE_NAME = "accordpay_wallet_session";
const SESSION_SECONDS = 60 * 60 * 24;

export function validateWalletSessionSecret(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized || normalized.length < 32) {
    return {
      valid: false as const,
      error:
        "Accord Chat wallet sessions are not configured. Set a server-only WALLET_SESSION_SECRET with at least 32 characters.",
    };
  }
  return { valid: true as const, value: normalized };
}

function secret() {
  const validated = validateWalletSessionSecret(
    process.env.WALLET_SESSION_SECRET,
  );
  if (!validated.valid) {
    throw new Error(
      process.env.NODE_ENV === "development"
        ? validated.error
        : "Accord Chat wallet authentication is temporarily unavailable.",
    );
  }
  return validated.value;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createWalletChallenge(input: {
  address: string;
  chainId: number;
  origin: string;
}) {
  if (input.chainId !== 91342) {
    throw new Error("Switch to GIWA Sepolia before authenticating.");
  }
  const applicationUrl = new URL(input.origin);
  const origin = applicationUrl.origin;
  const challengeId = randomUUID();
  const wallet = getAddress(input.address);
  const nonce = randomBytes(24).toString("base64url");
  const issuedAt = new Date();
  const expiresAt = new Date(Date.now() + 5 * 60_000);
  const message = [
    "Accord Chat authentication",
    `Domain: ${applicationUrl.host}`,
    `URI: ${origin}`,
    `Wallet: ${wallet}`,
    `Chain ID: ${input.chainId}`,
    `Challenge ID: ${challengeId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt.toISOString()}`,
    `Expires: ${expiresAt.toISOString()}`,
    "This signature authenticates a private AccordPay session. It does not submit a transaction.",
  ].join("\n");
  return {
    challengeId,
    wallet,
    chainId: input.chainId,
    origin,
    nonce,
    issuedAt,
    expiresAt,
    message,
  };
}

export async function verifyWalletChallenge(input: {
  address: string;
  challengeId: string;
  message: string;
  signature: `0x${string}`;
}) {
  const wallet = getAddress(input.address);
  const challenge = await queryDealRoom<{
    id: string;
    wallet_address: string;
    nonce_hash: string;
    expires_at: Date;
    consumed_at: Date | null;
  }>(
    `select id, wallet_address, nonce_hash, expires_at, consumed_at
     from public.wallet_auth_challenges where id = $1`,
    [input.challengeId],
  );
  const row = challenge.rows[0];
  if (!row) throw new Error("The wallet challenge does not exist.");
  if (row.consumed_at)
    throw new Error("The wallet challenge has already been used.");
  if (row.expires_at.getTime() <= Date.now())
    throw new Error("The wallet challenge has expired.");
  if (row.wallet_address.toLowerCase() !== wallet.toLowerCase()) {
    throw new Error("The connected wallet does not match this challenge.");
  }
  const suppliedMessageHash = digest(input.message);
  if (
    suppliedMessageHash.length !== row.nonce_hash.length ||
    !timingSafeEqual(
      Buffer.from(suppliedMessageHash),
      Buffer.from(row.nonce_hash),
    )
  ) {
    throw new Error("The signed message does not match the server challenge.");
  }
  const valid = await verifyMessage({
    address: wallet,
    message: input.message,
    signature: input.signature,
  });
  if (!valid) throw new Error("The signature came from the wrong wallet.");

  const consumed = await queryDealRoom(
    `update public.wallet_auth_challenges set consumed_at = now()
     where id = $1 and consumed_at is null and expires_at > now()
     returning id`,
    [input.challengeId],
  );
  if (!consumed.rows[0]) {
    throw new Error("The wallet challenge was already used or expired.");
  }

  const sessionId = randomBytes(32).toString("base64url");
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${sessionId}.${wallet}.${expires}`;
  const token = `${payload}.${sign(payload)}`;
  await queryDealRoom(
    `insert into public.wallet_sessions(wallet_address, token_hash, expires_at)
     values ($1, $2, to_timestamp($3))`,
    [wallet, digest(token), expires],
  );
  return { token, wallet, expires };
}

export async function setWalletSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function requireWalletSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) throw new Error("Wallet authentication is required.");
  const parts = token.split(".");
  if (parts.length !== 4) throw new Error("Wallet session is invalid.");
  const [sessionId, wallet, expiresText, suppliedSignature] = parts;
  const payload = `${sessionId}.${wallet}.${expiresText}`;
  const expected = Buffer.from(sign(payload));
  const supplied = Buffer.from(suppliedSignature);
  if (
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied) ||
    Number(expiresText) <= Math.floor(Date.now() / 1000)
  ) {
    throw new Error("Wallet session is invalid or expired.");
  }
  const result = await queryDealRoom<{ wallet_address: string }>(
    `select wallet_address from public.wallet_sessions
     where token_hash = $1 and revoked_at is null and expires_at > now()`,
    [digest(token)],
  );
  if (!result.rows[0]) throw new Error("Wallet session is no longer active.");
  return { address: getAddress(result.rows[0].wallet_address) };
}

export async function clearWalletSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await queryDealRoom(
      "update public.wallet_sessions set revoked_at = now() where token_hash = $1",
      [digest(token)],
    );
  }
  store.delete(COOKIE_NAME);
}

export const walletChallengeDigest = digest;

export function createSupabaseWalletToken(address: string) {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET?.trim();
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("Supabase Realtime authentication is not configured.");
  }
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    aud: "authenticated",
    role: "authenticated",
    sub: getAddress(address).toLowerCase(),
    wallet_address: getAddress(address),
    iat: now,
    exp: now + 15 * 60,
  });
  const signature = createHmac("sha256", jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}
