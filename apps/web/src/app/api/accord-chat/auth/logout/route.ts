import { clearWalletSession } from "@/services/deal-room/session";

export async function POST() {
  await clearWalletSession();
  return Response.json({ ok: true });
}
