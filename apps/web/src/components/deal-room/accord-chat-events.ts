"use client";

export const ACCORD_CHAT_OPEN_EVENT = "accordpay:open-chat";

export type AccordChatOpenDetail =
  | { view: "inbox" | "new" | "support" }
  | { view: "conversation"; roomId: string }
  | { view: "job-contact"; jobId: string };

export function openAccordChat(detail: AccordChatOpenDetail) {
  window.dispatchEvent(
    new CustomEvent<AccordChatOpenDetail>(ACCORD_CHAT_OPEN_EVENT, { detail }),
  );
}
