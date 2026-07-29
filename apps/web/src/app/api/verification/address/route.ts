import { NextResponse } from "next/server";

import { VerificationServiceError } from "@/services/verification/address-verification";
import { serverDojangVerificationService } from "@/services/verification/server-dojang-verification-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address") ?? "";

  try {
    const result = await serverDojangVerificationService.verifyAddress(address);
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof VerificationServiceError) {
      const status = error.code === "INVALID_ADDRESS" ? 400 : 502;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status },
      );
    }

    return NextResponse.json(
      {
        error: "Address verification is temporarily unavailable.",
        code: "UPSTREAM_ERROR",
      },
      { status: 502 },
    );
  }
}
