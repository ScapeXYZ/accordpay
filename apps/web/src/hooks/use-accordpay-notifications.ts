"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAddress } from "viem";
import { useConnection, usePublicClient } from "wagmi";

import {
  getUnreadCount,
  markAllNotificationsRead,
  notificationStorageKey,
  notificationsFromContractLogs,
  type AccordPayEventLog,
} from "@/components/app-shell/notification-model";
import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";

export function useAccordPayNotifications() {
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: giwaSepolia.id });
  const address =
    connection.status === "connected" && connection.address
      ? getAddress(connection.address)
      : undefined;
  const storageKey = address
    ? notificationStorageKey(giwaSepolia.id, address)
    : undefined;
  const readSnapshot = useSyncExternalStore(
    (onStoreChange) => {
      function handleStorage(event: StorageEvent) {
        if (event.key === storageKey) onStoreChange();
      }
      window.addEventListener("storage", handleStorage);
      window.addEventListener(
        "accordpay-notification-read-change",
        onStoreChange,
      );
      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(
          "accordpay-notification-read-change",
          onStoreChange,
        );
      };
    },
    () =>
      storageKey ? (window.localStorage.getItem(storageKey) ?? "[]") : "[]",
    () => "[]",
  );
  const readIds = useMemo(() => {
    try {
      const parsed = JSON.parse(readSnapshot) as unknown;
      return new Set(
        Array.isArray(parsed)
          ? parsed.filter((value): value is string => typeof value === "string")
          : [],
      );
    } catch {
      return new Set<string>();
    }
  }, [readSnapshot]);

  const query = useQuery({
    queryKey: [
      "accordpay-notifications",
      giwaSepolia.id,
      address?.toLowerCase(),
    ],
    queryFn: async () => {
      if (!publicClient || !address) return [];
      const logs = await publicClient.getContractEvents({
        address: accordPayEscrowContract.address,
        abi: accordPayEscrowContract.abi,
        fromBlock: BigInt(accordPayEscrowContract.deploymentBlock),
        toBlock: "latest",
        strict: true,
      });
      return notificationsFromContractLogs(
        logs as AccordPayEventLog[],
        address,
      );
    },
    enabled: Boolean(publicClient && address),
    retry: 1,
    staleTime: 15_000,
  });

  const notifications = useMemo(() => query.data ?? [], [query.data]);
  const unreadCount = useMemo(
    () => getUnreadCount(notifications, readIds),
    [notifications, readIds],
  );

  function markAllRead() {
    if (!storageKey) return;
    const next = markAllNotificationsRead(notifications);
    window.localStorage.setItem(storageKey, JSON.stringify([...next]));
    window.dispatchEvent(new Event("accordpay-notification-read-change"));
  }

  return {
    connected: Boolean(address),
    notifications,
    unreadCount,
    isLoading: query.isFetching,
    error: query.error,
    markAllRead,
    refresh: query.refetch,
  };
}
