import { redirect } from "next/navigation";

export default async function LegacyAccordChatConversationPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  redirect(`/app?accordChat=room&roomId=${encodeURIComponent(roomId)}`);
}
