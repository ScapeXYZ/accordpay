"use client";

import { useCallback, useRef, useState } from "react";
import { BaseError, type Hash, type TransactionReceipt } from "viem";
import { useConnection, usePublicClient, useWriteContract } from "wagmi";

import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";

export type TransactionState = {
  phase: "idle" | "awaitingSignature" | "submitted" | "confirmed" | "error";
  hash?: Hash;
  confirmations: number;
  error?: string;
  errorKind?: "walletRejected" | "reverted" | "rpc" | "unknown";
  refreshError?: string;
};

const initialState: TransactionState = {
  phase: "idle",
  confirmations: 0,
};

function classifyError(error: unknown): {
  error: string;
  errorKind: NonNullable<TransactionState["errorKind"]>;
} {
  const message =
    error instanceof BaseError
      ? error.shortMessage || error.message
      : error instanceof Error
        ? error.message
        : "Unknown transaction error.";
  const normalized = message.toLowerCase();

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
    return {
      error: message,
      errorKind: "reverted",
    };
  }
  if (
    normalized.includes("rpc") ||
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("timeout")
  ) {
    return {
      error: message,
      errorKind: "rpc",
    };
  }
  if (error instanceof BaseError) {
    return { error: error.shortMessage || error.message, errorKind: "unknown" };
  }
  return { error: message, errorKind: "unknown" };
}

export function useEscrowTransaction(
  onConfirmed?: (receipt: TransactionReceipt) => void | Promise<void>,
) {
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: giwaSepolia.id });
  const writeContract = useWriteContract();
  const pendingRef = useRef(false);
  const [transaction, setTransaction] =
    useState<TransactionState>(initialState);

  const execute = useCallback(
    async ({
      functionName,
      args = [],
      value,
    }: {
      functionName: string;
      args?: readonly unknown[];
      value?: bigint;
    }) => {
      if (pendingRef.current) return;
      if (connection.status !== "connected") {
        setTransaction({
          phase: "error",
          confirmations: 0,
          error: "Connect a wallet before submitting a transaction.",
          errorKind: "unknown",
        });
        return;
      }
      if (connection.chainId !== giwaSepolia.id) {
        setTransaction({
          phase: "error",
          confirmations: 0,
          error: "Switch the wallet to GIWA Sepolia before continuing.",
          errorKind: "unknown",
        });
        return;
      }
      if (!publicClient) {
        setTransaction({
          phase: "error",
          confirmations: 0,
          error: "GIWA Sepolia RPC is currently unavailable.",
          errorKind: "rpc",
        });
        return;
      }

      try {
        pendingRef.current = true;
        setTransaction({ phase: "awaitingSignature", confirmations: 0 });
        const hash = await writeContract.mutateAsync({
          address: accordPayEscrowContract.address,
          abi: accordPayEscrowContract.abi,
          functionName,
          args,
          value,
          chainId: giwaSepolia.id,
        });
        setTransaction({ phase: "submitted", hash, confirmations: 0 });
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });
        if (receipt.status !== "success") {
          throw new Error("The transaction reverted on GIWA Sepolia.");
        }
        try {
          await onConfirmed?.(receipt);
          setTransaction({ phase: "confirmed", hash, confirmations: 1 });
        } catch (refreshError) {
          setTransaction({
            phase: "confirmed",
            hash,
            confirmations: 1,
            refreshError: classifyError(refreshError).error,
          });
        }
        return receipt;
      } catch (error) {
        const classified = classifyError(error);
        setTransaction({
          phase: "error",
          confirmations: 0,
          ...classified,
        });
      } finally {
        pendingRef.current = false;
      }
    },
    [
      connection.chainId,
      connection.status,
      onConfirmed,
      publicClient,
      writeContract,
    ],
  );

  return {
    execute,
    transaction,
    reset: () => setTransaction(initialState),
    isPending:
      transaction.phase === "awaitingSignature" ||
      transaction.phase === "submitted",
  };
}
