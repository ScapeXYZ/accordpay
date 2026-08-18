"use client";

import { useCallback, useRef, useState } from "react";
import { type Hash, type TransactionReceipt } from "viem";
import { useConnection, usePublicClient, useWriteContract } from "wagmi";

import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";
import { classifyEscrowTransactionError } from "./transaction-errors";

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
        const account = connection.address;
        if (!account)
          throw new Error("The connected wallet address is unavailable.");
        await publicClient.simulateContract({
          address: accordPayEscrowContract.address,
          abi: accordPayEscrowContract.abi,
          functionName,
          args,
          value,
          account,
        });
        const estimatedGas = await publicClient.estimateContractGas({
          address: accordPayEscrowContract.address,
          abi: accordPayEscrowContract.abi,
          functionName,
          args,
          value,
          account,
        });
        const latestBlock = await publicClient.getBlock({
          blockTag: "latest",
        });
        const bufferedGas = (estimatedGas * 120n) / 100n;
        const safeBlockMaximum =
          latestBlock.gasLimit > 100_000n
            ? latestBlock.gasLimit - 100_000n
            : latestBlock.gasLimit;
        const gas =
          bufferedGas < safeBlockMaximum ? bufferedGas : safeBlockMaximum;
        setTransaction({ phase: "awaitingSignature", confirmations: 0 });
        const hash = await writeContract.mutateAsync({
          address: accordPayEscrowContract.address,
          abi: accordPayEscrowContract.abi,
          functionName,
          args,
          value,
          gas,
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
          window.dispatchEvent(new Event("accordpay-lifecycle-confirmed"));
          setTransaction({ phase: "confirmed", hash, confirmations: 1 });
        } catch (refreshError) {
          setTransaction({
            phase: "confirmed",
            hash,
            confirmations: 1,
            refreshError: classifyEscrowTransactionError(refreshError).error,
          });
        }
        return receipt;
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[AccordPay transaction]", error);
        }
        const classified = classifyEscrowTransactionError(error);
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
      connection.address,
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
