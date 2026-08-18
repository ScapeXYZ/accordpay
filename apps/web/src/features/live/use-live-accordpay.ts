"use client";

import { useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getAddress } from "viem";
import { useConnection } from "wagmi";

import { giwaSepolia } from "@/config/web3";
import type {
  ActivityApiError,
  ActivityApiPage,
} from "@/services/activity/activity-types";

import {
  dashboardCounts,
  mapTransactions,
  type LiveEscrow,
  type RawEscrowEvent,
} from "./live-escrow-model";

export class ActivityRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly method: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ActivityRequestError";
  }
}

async function fetchActivityPage(wallet: string, cursor: string) {
  const cursorQuery =
    cursor === "start" ? "" : `&cursor=${encodeURIComponent(cursor)}`;
  const response = await fetch(
    `/api/accordpay/activity?wallet=${encodeURIComponent(wallet)}${cursorQuery}`,
    { cache: "no-store" },
  );
  const body = (await response.json()) as ActivityApiPage | ActivityApiError;
  if (!response.ok || "error" in body) {
    const error =
      "error" in body
        ? body.error
        : {
            code: "HTTP_ERROR",
            method: "activity API",
            retryable: response.status >= 500,
            message: "Activity could not be loaded.",
          };
    throw new ActivityRequestError(
      error.message,
      error.code,
      error.method,
      error.retryable,
    );
  }
  return body;
}

export function useLiveAccordPay() {
  const connection = useConnection();
  const wallet =
    connection.status === "connected" && connection.address
      ? getAddress(connection.address)
      : undefined;
  const query = useInfiniteQuery({
    queryKey: ["accordpay-live-wallet", giwaSepolia.id, wallet?.toLowerCase()],
    enabled: Boolean(wallet),
    initialPageParam: "start",
    queryFn: ({ pageParam }) => fetchActivityPage(wallet!, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    retry: (failureCount, error) =>
      error instanceof ActivityRequestError &&
      error.retryable &&
      failureCount < 2,
    staleTime: 10_000,
    refetchInterval: (state) => {
      const pages = state.state.data?.pages;
      const last = pages?.[pages.length - 1];
      return last?.sync?.complete ? 30_000 : 3_000;
    },
  });

  const {
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = query;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !queryError) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, queryError]);

  const normalized = useMemo(() => {
    const pages = query.data?.pages ?? [];
    if (pages.length === 0 || !wallet) return undefined;
    const resolver = pages[pages.length - 1].resolver
      ? getAddress(pages[pages.length - 1].resolver)
      : getAddress("0x0000000000000000000000000000000000000000");
    const escrowMap = new Map<bigint, LiveEscrow>();
    const rawLogs = new Map<string, RawEscrowEvent>();
    const timestamps = new Map<bigint, number>();
    for (const page of pages) {
      for (const value of page.escrows) {
        const escrow: LiveEscrow = {
          id: BigInt(value.id),
          buyer: getAddress(value.buyer),
          seller: getAddress(value.seller),
          amount: BigInt(value.amount),
          deadline: BigInt(value.deadline),
          status: value.status,
        };
        escrowMap.set(escrow.id, escrow);
      }
      for (const event of page.events) {
        rawLogs.set(event.key, {
          eventName: event.eventName,
          args: { escrowId: BigInt(event.escrowId) },
          transactionHash: event.transactionHash as `0x${string}`,
          blockNumber: BigInt(event.blockNumber),
          logIndex: event.logIndex,
        });
        if (event.timestamp != null) {
          timestamps.set(BigInt(event.blockNumber), event.timestamp);
        }
      }
    }
    const escrows = [...escrowMap.values()];
    const transactions = mapTransactions(
      [...rawLogs.values()],
      escrowMap,
      timestamps,
      wallet,
      resolver,
    );
    const lastPage = pages[pages.length - 1];
    return {
      wallet,
      resolver,
      escrows,
      transactions,
      counts: dashboardCounts(escrows, wallet, resolver),
      progress: lastPage.progress,
      partial: pages.some((page) => page.partial),
      warnings: [...new Set(pages.flatMap((page) => page.warnings))],
      sync: lastPage.sync,
    };
  }, [query.data?.pages, wallet]);

  const refetch = query.refetch;
  useEffect(() => {
    const refresh = () => {
      void refetch();
    };
    window.addEventListener("accordpay-lifecycle-confirmed", refresh);
    return () =>
      window.removeEventListener("accordpay-lifecycle-confirmed", refresh);
  }, [refetch]);

  return {
    connected: Boolean(wallet),
    wallet,
    counts: normalized?.counts,
    escrows: normalized?.escrows ?? [],
    transactions: normalized?.transactions ?? [],
    progress: normalized?.progress,
    partial: normalized?.partial ?? false,
    warnings: normalized?.warnings ?? [],
    syncing: normalized?.sync?.running ?? false,
    syncComplete: normalized?.sync?.complete ?? false,
    hasIndexedData:
      (normalized?.escrows.length ?? 0) > 0 ||
      (normalized?.transactions.length ?? 0) > 0,
    isLoading:
      query.isLoading || query.isFetchingNextPage || Boolean(query.hasNextPage),
    error: query.error,
    refresh: query.refetch,
  };
}
