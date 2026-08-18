import { formatEther, type Address, type Hex } from "viem";
import type { LiveTransaction } from "@/features/live/live-escrow-model";

export type AccordPayNotificationKind =
  | "escrow-funded"
  | "delivery-submitted"
  | "funds-released"
  | "refund-completed"
  | "dispute-opened"
  | "dispute-resolved";

export type AccordPayNotification = {
  id: string;
  kind: AccordPayNotificationKind;
  title: string;
  description: string;
  escrowId: bigint;
  transactionHash: Hex;
  blockNumber: bigint;
  logIndex: number;
  timestamp: number | null;
};

export type AccordPayEventLog = {
  eventName?: string;
  args?: Record<string, unknown>;
  transactionHash?: Hex | null;
  blockNumber?: bigint | null;
  logIndex?: number | null;
};

export type NotificationPanelState = { open: boolean };
export type NotificationPanelAction = { type: "open" | "close" };

export function notificationPanelReducer(
  state: NotificationPanelState,
  action: NotificationPanelAction,
): NotificationPanelState {
  if (action.type === "open") return { open: true };
  if (action.type === "close") return { open: false };
  return state;
}

export function notificationStorageKey(chainId: number, address: string) {
  return `accordpay:notifications:read:${chainId}:${address.toLowerCase()}`;
}

export function getUnreadCount(
  notifications: AccordPayNotification[],
  readIds: ReadonlySet<string>,
) {
  return notifications.filter((notification) => !readIds.has(notification.id))
    .length;
}

export function markAllNotificationsRead(
  notifications: AccordPayNotification[],
) {
  return new Set(notifications.map((notification) => notification.id));
}

function participantMatches(args: Record<string, unknown>, address: Address) {
  const target = address.toLowerCase();
  return ["buyer", "seller", "raisedBy"].some((key) => {
    const value = args[key];
    return typeof value === "string" && value.toLowerCase() === target;
  });
}

function amountText(value: unknown) {
  return typeof value === "bigint"
    ? `${formatEther(value)} Test ETH`
    : "the escrowed Test ETH";
}

export function notificationsFromContractLogs(
  logs: AccordPayEventLog[],
  address: Address,
): AccordPayNotification[] {
  const notifications: AccordPayNotification[] = [];

  for (const log of logs) {
    if (
      !log.eventName ||
      !log.args ||
      !log.transactionHash ||
      log.blockNumber == null ||
      log.logIndex == null ||
      !participantMatches(log.args, address)
    ) {
      continue;
    }

    const escrowId = log.args.escrowId;
    if (typeof escrowId !== "bigint") continue;

    const shared = {
      id: `${log.transactionHash}:${log.logIndex}`,
      escrowId,
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
      timestamp: null,
    };

    switch (log.eventName) {
      case "EscrowCreated":
        notifications.push({
          ...shared,
          kind: "escrow-funded",
          title: "Escrow funded",
          description: `Transaction confirmed. ${amountText(log.args.amount)} was locked in escrow.`,
        });
        break;
      case "DeliveryMarked":
        notifications.push({
          ...shared,
          kind: "delivery-submitted",
          title: "Delivery submitted",
          description:
            "Transaction confirmed. Delivery evidence was recorded for this agreement.",
        });
        break;
      case "FundsReleased":
        notifications.push({
          ...shared,
          kind: "funds-released",
          title: "Funds released",
          description: `Transaction confirmed. ${amountText(log.args.amount)} was released to the seller.`,
        });
        break;
      case "EscrowRefunded":
        notifications.push({
          ...shared,
          kind: "refund-completed",
          title: "Refund completed",
          description: `Transaction confirmed. ${amountText(log.args.amount)} was refunded to the buyer.`,
        });
        break;
      case "DisputeRaised":
        notifications.push({
          ...shared,
          kind: "dispute-opened",
          title: "Dispute opened",
          description:
            "Transaction confirmed. Escrow funds are frozen pending resolution.",
        });
        break;
      case "DisputeResolved":
        notifications.push({
          ...shared,
          kind: "dispute-resolved",
          title: "Dispute resolved",
          description: `Transaction confirmed. Buyer payout: ${amountText(log.args.buyerPayout)}; seller payout: ${amountText(log.args.sellerPayout)}.`,
        });
        break;
    }
  }

  return notifications.sort((left, right) =>
    left.blockNumber === right.blockNumber
      ? right.logIndex - left.logIndex
      : left.blockNumber > right.blockNumber
        ? -1
        : 1,
  );
}

export function notificationsFromTransactions(
  transactions: LiveTransaction[],
): AccordPayNotification[] {
  return transactions.map((transaction) => {
    const shared = {
      id: transaction.key,
      escrowId: transaction.escrowId,
      transactionHash: transaction.transactionHash,
      blockNumber: transaction.blockNumber,
      logIndex: transaction.logIndex,
      timestamp: transaction.timestamp,
    };
    switch (transaction.eventName) {
      case "EscrowCreated":
        return {
          ...shared,
          kind: "escrow-funded",
          title: "Escrow funded",
          description: `Transaction confirmed. ${transaction.amountLabel} was locked in escrow.`,
        };
      case "DeliveryMarked":
        return {
          ...shared,
          kind: "delivery-submitted",
          title: "Delivery submitted",
          description:
            "Transaction confirmed. Delivery evidence was recorded for this agreement.",
        };
      case "FundsReleased":
        return {
          ...shared,
          kind: "funds-released",
          title: "Funds released",
          description: `Transaction confirmed. ${transaction.amountLabel} was released to the seller.`,
        };
      case "EscrowRefunded":
        return {
          ...shared,
          kind: "refund-completed",
          title: "Refund completed",
          description: `Transaction confirmed. ${transaction.amountLabel} was refunded to the buyer.`,
        };
      case "DisputeRaised":
        return {
          ...shared,
          kind: "dispute-opened",
          title: "Dispute opened",
          description:
            "Transaction confirmed. Escrow funds are frozen pending resolution.",
        };
      case "DisputeResolved":
        return {
          ...shared,
          kind: "dispute-resolved",
          title: "Dispute resolved",
          description:
            "Transaction confirmed. The resolver finalized the dispute.",
        };
    }
  });
}
