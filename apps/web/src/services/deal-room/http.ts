import { NextResponse } from "next/server";

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

export async function readJsonBody(request: Request, maximumBytes = 32_768) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maximumBytes) {
    throw new Error("Request body is too large.");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maximumBytes) {
    throw new Error("Request body is too large.");
  }
  return JSON.parse(text) as unknown;
}
