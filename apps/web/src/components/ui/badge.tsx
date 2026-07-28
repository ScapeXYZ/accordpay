import type { ReactNode } from "react";

import styles from "./ui.module.css";

export type BadgeStatus =
  | "created"
  | "funded"
  | "delivered"
  | "completed"
  | "refunded"
  | "disputed"
  | "cancelled"
  | "pending"
  | "testnet";

const statusTone: Record<BadgeStatus, string> = {
  created: styles.badgeNeutral,
  funded: styles.badgeInfo,
  delivered: styles.badgeWarning,
  completed: styles.badgeSuccess,
  refunded: styles.badgeSuccess,
  disputed: styles.badgeError,
  cancelled: styles.badgeNeutral,
  pending: styles.badgeWarning,
  testnet: styles.badgeTestnet,
};

const defaultLabels: Record<BadgeStatus, string> = {
  created: "Created",
  funded: "Funded",
  delivered: "Delivered",
  completed: "Completed",
  refunded: "Refunded",
  disputed: "Disputed",
  cancelled: "Cancelled",
  pending: "Pending",
  testnet: "Testnet",
};

export function Badge({
  status,
  children,
}: {
  status: BadgeStatus;
  children?: ReactNode;
}) {
  return (
    <span className={`${styles.badge} ${statusTone[status]}`}>
      {children ?? defaultLabels[status]}
    </span>
  );
}
