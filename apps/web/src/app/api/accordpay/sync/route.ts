import {
  getSyncProgress,
  runActivitySync,
} from "@/services/activity/activity-sync";

export const runtime = "nodejs";

function authorized(request: Request) {
  if (process.env.NODE_ENV !== "production") return true;
  const expected = process.env.GIWA_SYNC_SECRET?.trim();
  if (!expected) return false;
  const bearer = request.headers.get("authorization");
  const header = request.headers.get("x-accordpay-sync-secret");
  return bearer === `Bearer ${expected}` || header === expected;
}

export async function GET() {
  return Response.json(await getSyncProgress());
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json(
      {
        error: {
          code: "SYNC_UNAUTHORIZED",
          method: "authorization",
          retryable: false,
          message: "Synchronization authorization failed.",
        },
      },
      { status: 401 },
    );
  }
  try {
    return Response.json(await runActivitySync(10));
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[AccordPay index] synchronization failed", error);
    }
    return Response.json(
      {
        error: {
          code: "SYNC_FAILED",
          method: "GIWA activity synchronization",
          retryable: true,
          message: "GIWA activity synchronization did not complete.",
        },
      },
      { status: 502 },
    );
  }
}
