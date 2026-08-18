import { formatEther, getAddress, type Address, type Hex } from "viem";

import type { EscrowStatus } from "@/features/escrow/escrow-lifecycle";

export const supportedEventNames = [
  "EscrowCreated",
  "DeliveryMarked",
  "FundsReleased",
  "EscrowRefunded",
  "DisputeRaised",
  "DisputeResolved",
] as const;

export type SupportedEventName = (typeof supportedEventNames)[number];
export type WalletRole = "Buyer" | "Seller" | "Resolver";

export type LiveEscrow = {
  id: bigint;
  buyer: Address;
  seller: Address;
  amount: bigint;
  deadline: bigint;
  status: EscrowStatus;
};

export type RawEscrowEvent = {
  eventName?: string;
  args?: Record<string, unknown>;
  transactionHash?: Hex | null;
  blockNumber?: bigint | null;
  logIndex?: number | null;
};

export type LiveTransaction = {
  key: string;
  eventName: SupportedEventName;
  eventLabel: string;
  escrowId: bigint;
  agreementId: string;
  role: WalletRole;
  amount: bigint;
  amountLabel: string;
  status: EscrowStatus;
  blockNumber: bigint;
  timestamp: number | null;
  transactionHash: Hex;
  explorerUrl: string;
  logIndex: number;
};

const eventLabels: Record<SupportedEventName, string> = {
  EscrowCreated: "Escrow created",
  DeliveryMarked: "Delivery marked",
  FundsReleased: "Funds released",
  EscrowRefunded: "Escrow refunded",
  DisputeRaised: "Dispute raised",
  DisputeResolved: "Dispute resolved",
};

export function isSupportedEventName(
  value: string | undefined,
): value is SupportedEventName {
  return supportedEventNames.includes(value as SupportedEventName);
}

export function formatAgreementId(id: bigint) {
  return `ACP-${id.toString().padStart(6, "0")}`;
}

export function parseAgreementId(value: string): bigint | undefined {
  const normalized = value.trim().toUpperCase();
  const match = /^(?:ACP-)?0*(\d+)$/.exec(normalized);
  if (!match) return undefined;
  return BigInt(match[1]);
}

export function transactionExplorerUrl(hash: Hex) {
  return `https://sepolia-explorer.giwa.io/tx/${hash}`;
}

export function escrowIdsFromLogs(logs: RawEscrowEvent[]) {
  const ids = new Set<bigint>();
  for (const log of logs) {
    const id = log.args?.escrowId;
    if (typeof id === "bigint") ids.add(id);
  }
  return [...ids];
}

export function walletRoleForEscrow(
  escrow: LiveEscrow,
  wallet: Address,
  resolver: Address,
): WalletRole | undefined {
  const account = wallet.toLowerCase();
  if (escrow.buyer.toLowerCase() === account) return "Buyer";
  if (escrow.seller.toLowerCase() === account) return "Seller";
  if (resolver.toLowerCase() === account) return "Resolver";
  return undefined;
}

export function canWalletAct(
  escrow: LiveEscrow,
  wallet: Address,
  resolver: Address,
) {
  const role = walletRoleForEscrow(escrow, wallet, resolver);
  if (!role) return false;
  if (escrow.status === "disputed") return role === "Resolver";
  if (escrow.status === "funded") {
    return role === "Seller" || role === "Buyer";
  }
  return (
    escrow.status === "delivered" && (role === "Buyer" || role === "Seller")
  );
}

export function dashboardCounts(
  escrows: LiveEscrow[],
  wallet: Address,
  resolver: Address,
) {
  const unique = [...new Map(escrows.map((item) => [item.id, item])).values()];
  return {
    requiresAction: unique.filter((escrow) =>
      canWalletAct(escrow, wallet, resolver),
    ).length,
    active: unique.filter((escrow) =>
      ["funded", "delivered", "disputed"].includes(escrow.status),
    ).length,
    completed: unique.filter((escrow) => escrow.status === "completed").length,
    disputed: unique.filter((escrow) => escrow.status === "disputed").length,
  };
}

export function mapTransactions(
  logs: RawEscrowEvent[],
  escrows: ReadonlyMap<bigint, LiveEscrow>,
  timestamps: ReadonlyMap<bigint, number>,
  wallet: Address,
  resolver: Address,
) {
  const seen = new Set<string>();
  const rows: LiveTransaction[] = [];

  for (const log of logs) {
    if (
      !isSupportedEventName(log.eventName) ||
      !log.transactionHash ||
      log.blockNumber == null ||
      log.logIndex == null
    ) {
      continue;
    }
    const escrowId = log.args?.escrowId;
    if (typeof escrowId !== "bigint") continue;
    const escrow = escrows.get(escrowId);
    const timestamp = timestamps.get(log.blockNumber) ?? null;
    if (!escrow) continue;
    const role = walletRoleForEscrow(escrow, wallet, resolver);
    if (!role) continue;
    if (
      role === "Resolver" &&
      !["DisputeRaised", "DisputeResolved"].includes(log.eventName)
    ) {
      continue;
    }
    const key = `${log.transactionHash}:${log.logIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      key,
      eventName: log.eventName,
      eventLabel: eventLabels[log.eventName],
      escrowId,
      agreementId: formatAgreementId(escrowId),
      role,
      amount: escrow.amount,
      amountLabel: `${formatEther(escrow.amount)} Test ETH`,
      status: escrow.status,
      blockNumber: log.blockNumber,
      timestamp,
      transactionHash: log.transactionHash,
      explorerUrl: transactionExplorerUrl(log.transactionHash),
      logIndex: log.logIndex,
    });
  }

  return rows.sort((left, right) =>
    left.blockNumber === right.blockNumber
      ? right.logIndex - left.logIndex
      : left.blockNumber > right.blockNumber
        ? -1
        : 1,
  );
}

export function filterTransactions(
  rows: LiveTransaction[],
  filters: { agreement?: string; eventType?: string; status?: string },
) {
  const parsedId = filters.agreement
    ? parseAgreementId(filters.agreement)
    : undefined;
  return rows.filter(
    (row) =>
      (!filters.agreement || row.escrowId === parsedId) &&
      (!filters.eventType ||
        filters.eventType === "all" ||
        row.eventName === filters.eventType) &&
      (!filters.status ||
        filters.status === "all" ||
        row.status === filters.status),
  );
}

export function normalizeAddress(value: string) {
  return getAddress(value);
}
