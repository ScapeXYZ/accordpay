"use client";

import Link from "next/link";
import { useReducer, useRef } from "react";

import { Button, Spinner } from "@/components/ui";
import { giwaSepolia } from "@/config/web3";
import { useAccordPayNotifications } from "@/hooks/use-accordpay-notifications";

import { notificationPanelReducer } from "./notification-model";
import styles from "./app-shell.module.css";

export function NotificationPanel() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [panel, dispatch] = useReducer(notificationPanelReducer, {
    open: false,
  });
  const feed = useAccordPayNotifications();

  function openPanel() {
    dispatch({ type: "open" });
    dialogRef.current?.showModal();
  }

  function closePanel() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        ref={triggerRef}
        className={styles.iconButton}
        type="button"
        aria-label={
          feed.unreadCount
            ? `Notifications, ${feed.unreadCount} unread`
            : "Notifications"
        }
        aria-haspopup="dialog"
        aria-expanded={panel.open}
        onClick={openPanel}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {feed.unreadCount > 0 ? (
          <span className={styles.unreadBadge}>{feed.unreadCount}</span>
        ) : null}
      </button>

      <dialog
        ref={dialogRef}
        className={styles.notificationDialog}
        aria-labelledby="notification-title"
        aria-describedby="notification-description"
        onClose={() => {
          dispatch({ type: "close" });
          triggerRef.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closePanel();
        }}
      >
        <div className={styles.notificationContent}>
          <div className={styles.notificationHeading}>
            <div>
              <h2 id="notification-title">Notifications</h2>
              <p id="notification-description">
                Confirmed AccordPay events for the connected wallet.
              </p>
            </div>
            <button
              className={styles.notificationClose}
              type="button"
              aria-label="Close notifications"
              onClick={closePanel}
            >
              ×
            </button>
          </div>

          <div className={styles.notificationToolbar}>
            <span>
              {feed.unreadCount
                ? `${feed.unreadCount} unread`
                : "No unread notifications"}
            </span>
            <button
              type="button"
              onClick={feed.markAllRead}
              disabled={!feed.unreadCount}
            >
              Mark all as read
            </button>
          </div>

          {feed.isLoading ? (
            <div className={styles.notificationState} aria-live="polite">
              <Spinner size="medium" label="Loading contract notifications" />
              <p>Reading confirmed events from GIWA Sepolia.</p>
            </div>
          ) : feed.error ? (
            <div className={styles.notificationState} role="alert">
              <strong>Notifications unavailable</strong>
              <p>
                GIWA Sepolia events could not be read. No notification data was
                fabricated.
              </p>
              <Button variant="secondary" onClick={() => feed.refresh()}>
                Retry
              </Button>
            </div>
          ) : !feed.connected ? (
            <div className={styles.notificationState}>
              <strong>Connect a wallet</strong>
              <p>
                Notifications are derived from confirmed AccordPay events for
                the connected address.
              </p>
            </div>
          ) : feed.notifications.length === 0 ? (
            <div className={styles.notificationState}>
              <strong>No notifications yet</strong>
              <p>
                No confirmed AccordPay contract events were found for this
                wallet.
              </p>
            </div>
          ) : (
            <ol className={styles.notificationList}>
              {feed.notifications.map((notification) => (
                <li key={notification.id}>
                  <div className={styles.notificationItemHeading}>
                    <strong>{notification.title}</strong>
                    <span>Block {notification.blockNumber.toString()}</span>
                  </div>
                  <p>{notification.description}</p>
                  <div className={styles.notificationLinks}>
                    <Link
                      href={`/app/agreements?id=${notification.escrowId.toString()}`}
                      onClick={closePanel}
                    >
                      Open agreement
                    </Link>
                    <a
                      href={`${giwaSepolia.blockExplorers.default.url}/tx/${notification.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GIWA Explorer
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </dialog>
    </>
  );
}
