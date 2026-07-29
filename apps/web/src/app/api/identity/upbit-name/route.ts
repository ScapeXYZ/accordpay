import { NextResponse } from "next/server";

import { serverUpbitNameService } from "@/services/names/server-upbit-name-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const direction = url.searchParams.get("direction");
  const value = url.searchParams.get("value") ?? "";
  const bypassCache = url.searchParams.get("refresh") === "true";

  if (direction === "forward") {
    return NextResponse.json(
      await serverUpbitNameService.resolveForward(value, bypassCache),
    );
  }

  if (direction === "reverse") {
    return NextResponse.json(
      await serverUpbitNameService.resolveReverse(value, bypassCache),
    );
  }

  return NextResponse.json(
    {
      status: "unavailable",
      message: "Choose forward or reverse name resolution.",
    },
    { status: 400 },
  );
}
