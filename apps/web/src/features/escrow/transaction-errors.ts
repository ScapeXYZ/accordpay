import { BaseError } from "viem";

export type EscrowTransactionErrorKind =
  "walletRejected" | "reverted" | "rpc" | "unknown";

export function classifyEscrowTransactionError(error: unknown): {
  error: string;
  errorKind: EscrowTransactionErrorKind;
} {
  const message =
    error instanceof BaseError
      ? error.shortMessage || error.message
      : error instanceof Error
        ? error.message
        : "Unknown transaction error.";
  const normalized = message.toLowerCase();

  if (normalized.includes("gas limit too high")) {
    return {
      error:
        "GIWA rejected the gas limit. The transaction was not submitted; retry after the simulation succeeds.",
      errorKind: "rpc",
    };
  }
  if (
    normalized.includes("user rejected") ||
    normalized.includes("user denied") ||
    normalized.includes("rejected the request") ||
    normalized.includes("code 4001")
  ) {
    return {
      error: "The wallet request was rejected. No transaction was submitted.",
      errorKind: "walletRejected",
    };
  }
  if (
    normalized.includes("revert") ||
    normalized.includes("execution reverted")
  ) {
    return { error: message, errorKind: "reverted" };
  }
  if (
    normalized.includes("rpc") ||
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("timeout")
  ) {
    return { error: message, errorKind: "rpc" };
  }
  return {
    error:
      error instanceof BaseError
        ? error.shortMessage || error.message
        : message,
    errorKind: "unknown",
  };
}
