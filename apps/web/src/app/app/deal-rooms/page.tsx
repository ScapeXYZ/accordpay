import { redirect } from "next/navigation";

export default function LegacyAccordChatPage() {
  redirect("/app?accordChat=open");
}
