export type ConversationFilter =
  "all" | "unread" | "active" | "completed" | "support" | "archived";

export function conversationStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Negotiating",
    awaiting_counterparty: "Negotiating",
    negotiating: "Negotiating",
    awaiting_buyer_approval: "Awaiting approval",
    awaiting_seller_approval: "Awaiting approval",
    approved: "Approved",
    awaiting_escrow_creation: "Approved",
    funded: "Funded",
    delivered: "Delivered",
    disputed: "Disputed",
    completed: "Completed",
    refunded: "Refunded",
    archived: "Archived",
    open: "Support",
    waiting_for_user: "Support",
    waiting_for_support: "Support",
    closed: "Support",
  };
  return labels[status] ?? "Negotiating";
}

export function mergeMessages<
  T extends { id: string; message_sequence: number },
>(current: readonly T[], incoming: readonly T[]) {
  const messages = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) messages.set(message.id, message);
  return [...messages.values()].sort(
    (left, right) => left.message_sequence - right.message_sequence,
  );
}

export function prependScrollTop(input: {
  previousScrollHeight: number;
  nextScrollHeight: number;
  previousScrollTop: number;
}) {
  return (
    input.previousScrollTop +
    (input.nextScrollHeight - input.previousScrollHeight)
  );
}

export function isNearMessageBottom(input: {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
  threshold?: number;
}) {
  return (
    input.scrollHeight - input.scrollTop - input.clientHeight <=
    (input.threshold ?? 96)
  );
}

export function conversationSessionKey(
  roomId: string,
  kind: "draft" | "scroll",
) {
  return `accordpay:conversation:${roomId}:${kind}`;
}
