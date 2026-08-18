"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  getUnreadCount,
  markAllNotificationsRead,
  notificationStorageKey,
  notificationsFromTransactions,
} from "@/components/app-shell/notification-model";
import { giwaSepolia } from "@/config/web3";
import { useLiveAccordPay } from "@/features/live";

export function useAccordPayNotifications() {
  const activity = useLiveAccordPay();
  const storageKey = activity.wallet
    ? notificationStorageKey(giwaSepolia.id, activity.wallet)
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
  const notifications = useMemo(
    () => notificationsFromTransactions(activity.transactions),
    [activity.transactions],
  );
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
    connected: activity.connected,
    notifications,
    unreadCount,
    isLoading: activity.isLoading,
    error: activity.error,
    partial: activity.partial,
    progress: activity.progress,
    warnings: activity.warnings,
    syncing: activity.syncing || !activity.syncComplete,
    markAllRead,
    refresh: activity.refresh,
  };
}
