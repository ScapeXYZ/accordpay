"use client";

import { useCallback, useState } from "react";
import { BaseError, type Hash, type TransactionReceipt } from "viem";
import { useConnection, usePublicClient, useWriteContract } from "wagmi";

import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";

export type TransactionState = {
  phase: "idle" | "awaitingSignature" | "submitted" | "confirmed" | "error";
  hash?: Hash;
  confirmations: number;
  error?: string;
};

const initialState: TransactionState = {
  phase: "idle",
  confirmations: 0,
};

function readableError(error: unknown) {
  if (error instanceof BaseError) {
    return error.shortMessage || error.message;
  }
  return error instanceof Error ? error.message : "Unknown transaction error.";
}

export function useEscrowTransaction(
  onConfirmed?: (receipt: TransactionReceipt) => void | Promise<void>,
) {
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: giwaSepolia.id });
  const writeContract = useWriteContract();
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
      if (connection.status !== "connected") {
        setTransaction({
          phase: "error",
          confirmations: 0,
          error: "Connect a wallet before submitting a transaction.",
        });
        return;
      }
      if (connection.chainId !== giwaSepolia.id) {
        setTransaction({
          phase: "error",
          confirmations: 0,
          error: "Switch the wallet to GIWA Sepolia before continuing.",
        });
        return;
      }
      if (!publicClient) {
        setTransaction({
          phase: "error",
          confirmations: 0,
          error: "GIWA Sepolia RPC is currently unavailable.",
        });
        return;
      }

      try {
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
        setTransaction({ phase: "confirmed", hash, confirmations: 1 });
        await onConfirmed?.(receipt);
        return receipt;
      } catch (error) {
        setTransaction({
          phase: "error",
          confirmations: 0,
          error: readableError(error),
        });
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
