"use client";

import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, Button, Spinner } from "@/components/ui";
import {
  formatFullTimestamp,
  formatRelativeTime,
} from "@/components/app-shell/relative-time";

import { AccordIdentity } from "./accord-identity";
import {
  ACCORD_CHAT_OPEN_EVENT,
  type AccordChatOpenDetail,
} from "./accord-chat-events";
import styles from "./accord-chat-launcher.module.css";
import { DealRoom } from "./deal-room";
import { NewConversation } from "./new-conversation";
import { SupportChat } from "./support-chat";
import { useWalletSessionAuth } from "./use-wallet-session-auth";
import { readAccordChatJson } from "@/services/deal-room/client-api";
import {
  conversationStatusLabel,
  type ConversationFilter,
} from "@/services/deal-room/conversation-model";

type Summary = {
  unreadCount: number;
  supportConfigured: boolean;
  conversations: Array<{
    id: string;
    title: string;
    role: "buyer" | "seller";
    counterparty_address: `0x${string}`;
    display_name: string | null;
    unread_count: string;
    last_message: string | null;
    last_message_at: string | null;
    status: string;
    context_type: "direct_agreement" | "job";
    escrow_id: string | null;
    archived: boolean;
  }>;
  supportConversations: Array<{
    id: string;
    title: string;
    status: string;
    unread_count: string;
    last_message: string | null;
    last_message_at: string | null;
  }>;
  invitations: Array<{ id: string; room_id: string; role: string }>;
  pendingInvitationCount: number;
};

export function AccordChatLauncher() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [summary, setSummary] = useState<Summary>();
  const [open, setOpen] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [maximized, setMaximized] = useState(false);
  const [view, setView] = useState<
    "inbox" | "new" | "conversation" | "support"
  >("inbox");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [pendingJobId, setPendingJobId] = useState("");
  const [jobContext, setJobContext] = useState<{
    title: string;
    clientWallet: `0x${string}`;
    budgetAmount: string;
    budgetType: string;
    deadline: string;
    suggestedMessage: string;
  }>();
  const auth = useWalletSessionAuth();

  const load = useCallback(async () => {
    const query = new URLSearchParams({ filter, search: search.trim() });
    const response = await fetch(`/api/accord-chat/summary?${query}`, {
      cache: "no-store",
    });
    try {
      const body = await readAccordChatJson<Summary>(
        response,
        "Conversations could not be loaded.",
      );
      setLoadError("");
      setSummary(body);
    } catch (caught) {
      setSummary(undefined);
      setLoadError(
        caught instanceof Error
          ? caught.message
          : "Conversations could not be loaded. Retry when ready.",
      );
    }
  }, [filter, search]);

  const contactJob = useCallback(
    async (jobId: string) => {
      try {
        const response = await fetch(`/api/jobs/${jobId}/contact`, {
          method: "POST",
        });
        const body = await readAccordChatJson<{
          roomId: string;
          job: {
            title: string;
            clientWallet: `0x${string}`;
            budgetAmount: string;
            budgetType: string;
            deadline: string;
          };
          suggestedMessage: string;
        }>(response, "The job conversation could not be opened.");
        setJobContext({ ...body.job, suggestedMessage: body.suggestedMessage });
        setPendingJobId("");
        setSelectedRoomId(body.roomId);
        setView("conversation");
        void load();
      } catch (caught) {
        setLoadError(
          caught instanceof Error
            ? caught.message
            : "The job conversation could not be opened.",
        );
      }
    },
    [load],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 15_000);
    const initialLoad =
      auth.state === "authenticated"
        ? window.setTimeout(() => void load(), 0)
        : undefined;
    return () => {
      window.clearInterval(timer);
      if (initialLoad !== undefined) window.clearTimeout(initialLoad);
    };
  }, [auth.state, load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get("accordChat");
    const requestedRoom = params.get("roomId");
    if (!requestedView) return;
    const timer = window.setTimeout(() => {
      if (requestedView === "new") setView("new");
      else if (requestedView === "support") setView("support");
      else if (requestedView === "room" && requestedRoom) {
        setSelectedRoomId(requestedRoom);
        setView("conversation");
      } else setView("inbox");
      setOpen(true);
      dialogRef.current?.showModal();
      params.delete("accordChat");
      params.delete("roomId");
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleOpen(event: Event) {
      const detail = (event as CustomEvent<AccordChatOpenDetail>).detail;
      setOpen(true);
      dialogRef.current?.showModal();
      if (detail.view === "job-contact") {
        setPendingJobId(detail.jobId);
        if (auth.state === "authenticated") void contactJob(detail.jobId);
        return;
      }
      if (detail.view === "conversation") {
        setSelectedRoomId(detail.roomId);
        setView("conversation");
      } else {
        setView(detail.view);
      }
    }
    window.addEventListener(ACCORD_CHAT_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(ACCORD_CHAT_OPEN_EVENT, handleOpen);
  }, [auth.state, contactJob]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon || auth.state !== "authenticated") return;
    let active = true;
    void fetch("/api/accord-chat/auth/realtime")
      .then(async (response) => {
        if (!response.ok || !active) return;
        const { token } = await readAccordChatJson<{ token: string }>(
          response,
          "Realtime updates are unavailable.",
        );
        const client = createClient(url, anon, {
          accessToken: async () => token,
        });
        channelRef.current = client
          .channel("accord-chat-unread")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "deal_room_messages",
            },
            () => void load(),
          )
          .subscribe();
      })
      .catch(() => undefined);
    return () => {
      active = false;
      if (channelRef.current) void channelRef.current.unsubscribe();
    };
  }, [auth.state, load]);

  function show() {
    setOpen(true);
    dialogRef.current?.showModal();
    if (auth.state === "authenticated") void load();
  }

  function close() {
    dialogRef.current?.close();
  }

  function openConversation(roomId: string) {
    setSelectedRoomId(roomId);
    setView("conversation");
  }

  const showInboxAlongside =
    maximized && (view === "conversation" || view === "support");

  function renderInbox() {
    if (!summary) return null;
    return (
      <div className={styles.inbox}>
        <section className={styles.inboxTools}>
          <label>
            <span>Search conversations</span>
            <input
              type="search"
              value={search}
              placeholder="Name, wallet, title, or agreement ID"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className={styles.filters} aria-label="Conversation filters">
            {(
              [
                "all",
                "unread",
                "active",
                "completed",
                "support",
                "archived",
              ] as ConversationFilter[]
            ).map((option) => (
              <button
                type="button"
                key={option}
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
              >
                {option[0].toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </section>
        {summary.invitations.length ? (
          <section>
            <h3>Pending invitations</h3>
            {summary.invitations.map((invite) => (
              <button
                key={invite.id}
                type="button"
                className={styles.invitation}
                onClick={() => openConversation(invite.room_id)}
              >
                Invitation to join as {invite.role}
              </button>
            ))}
          </section>
        ) : null}
        <section className={styles.conversationList}>
          <h3>Conversations</h3>
          {summary.conversations.length === 0 &&
          summary.supportConversations.length === 0 ? (
            search ? (
              <p>No conversations match your search.</p>
            ) : (
              <div>
                <strong>No conversations yet</strong>
                <p>
                  Start a secure conversation to agree on terms, exchange files,
                  and create a GIWA escrow agreement.
                </p>
              </div>
            )
          ) : (
            <ol>
              {summary.conversations.map((conversation) => {
                const timestamp = conversation.last_message_at
                  ? new Date(conversation.last_message_at).getTime() / 1000
                  : null;
                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => openConversation(conversation.id)}
                    >
                      <AccordIdentity
                        address={conversation.counterparty_address}
                        displayName={conversation.display_name}
                        role={
                          conversation.role === "buyer" ? "Seller" : "Buyer"
                        }
                      />
                      <strong>{conversation.title}</strong>
                      <span>
                        {conversationStatusLabel(conversation.status)}
                        {conversation.escrow_id
                          ? ` · ACP-${conversation.escrow_id.padStart(6, "0")}`
                          : ""}
                      </span>
                      <span>
                        {conversation.last_message ?? "No messages yet"}
                      </span>
                      <time
                        title={formatFullTimestamp(timestamp)}
                        dateTime={conversation.last_message_at ?? undefined}
                      >
                        {formatRelativeTime(timestamp, clock)}
                      </time>
                      {Number(conversation.unread_count) > 0 ? (
                        <b>{conversation.unread_count} unread</b>
                      ) : null}
                    </button>
                  </li>
                );
              })}
              {summary.supportConversations.map((conversation) => {
                const timestamp = conversation.last_message_at
                  ? new Date(conversation.last_message_at).getTime() / 1000
                  : null;
                return (
                  <li key={`support-${conversation.id}`}>
                    <button type="button" onClick={() => setView("support")}>
                      <strong>AccordPay Support</strong>
                      <span>{conversation.title}</span>
                      <span>
                        {conversation.last_message ?? "Support conversation"}
                      </span>
                      <time
                        title={formatFullTimestamp(timestamp)}
                        dateTime={conversation.last_message_at ?? undefined}
                      >
                        {formatRelativeTime(timestamp, clock)}
                      </time>
                      {Number(conversation.unread_count) > 0 ? (
                        <b>{conversation.unread_count} unread</b>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
        <footer>
          <Button type="button" onClick={() => setView("new")}>
            Start conversation
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setView("support")}
          >
            Contact AccordPay Support
          </Button>
        </footer>
      </div>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.floatingButton}
        aria-label="Open Accord Chat"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={show}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 5h16v11H8l-4 4V5Z" />
        </svg>
        {summary &&
        (summary.unreadCount > 0 || summary.pendingInvitationCount > 0) ? (
          <span className={styles.badge}>
            {summary.unreadCount + summary.pendingInvitationCount}
          </span>
        ) : null}
      </button>
      <dialog
        ref={dialogRef}
        className={`${styles.panel} ${maximized ? styles.maximized : ""}`}
        aria-labelledby="accord-chat-title"
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <header className={styles.panelHeader}>
          <div>
            <h2 id="accord-chat-title">
              {view === "new"
                ? "Start conversation"
                : view === "support"
                  ? "AccordPay Support"
                  : view === "conversation"
                    ? "Conversation"
                    : "Accord Chat"}
            </h2>
            <p>
              Chat, agree on terms, exchange files, and create secure GIWA
              escrow agreements.
            </p>
          </div>
          <div className={styles.headerControls}>
            <button
              type="button"
              aria-label={
                maximized ? "Restore Accord Chat" : "Maximize Accord Chat"
              }
              aria-pressed={maximized}
              onClick={() => setMaximized((value) => !value)}
            >
              {maximized ? "↙" : "↗"}
            </button>
            <button
              type="button"
              aria-label="Close Accord Chat"
              onClick={close}
            >
              ×
            </button>
          </div>
        </header>
        {auth.state === "checking-session" ? (
          <div className={styles.empty}>
            <Spinner label="Checking wallet session" />
          </div>
        ) : !auth.connected ? (
          <div className={styles.empty}>
            <h3>Connect your wallet</h3>
            <p>Connect a GIWA Sepolia wallet before opening private chat.</p>
          </div>
        ) : auth.state === "authentication-required" ||
          auth.state === "failed" ? (
          <div className={styles.authentication}>
            <h3>Authenticate your wallet</h3>
            <p>
              Sign a message to open your private Accord Chat conversations.
              This does not submit a transaction or spend gas.
            </p>
            <Button
              type="button"
              onClick={() =>
                void auth.authenticate().then((authenticated) => {
                  if (authenticated) {
                    if (pendingJobId) void contactJob(pendingJobId);
                    else void load();
                  }
                })
              }
            >
              Authenticate wallet
            </Button>
            {auth.error ? (
              <Alert
                variant="error"
                title="Authentication failed"
                description={auth.error}
              />
            ) : null}
          </div>
        ) : auth.state === "signing-challenge" ||
          auth.state === "verifying-signature" ? (
          <div className={styles.empty}>
            <Spinner
              label={
                auth.state === "signing-challenge"
                  ? "Awaiting wallet signature"
                  : "Verifying wallet signature"
              }
            />
            <p>No blockchain transaction or gas payment is involved.</p>
          </div>
        ) : loadError ? (
          <div className={styles.authentication}>
            <Alert
              variant="error"
              title="Accord Chat unavailable"
              description={loadError}
              action={<Button onClick={() => void load()}>Retry</Button>}
            />
          </div>
        ) : !summary ? (
          <div className={styles.empty}>
            <Spinner label="Loading Accord Chat" />
          </div>
        ) : (
          <div
            className={`${styles.panelBody} ${showInboxAlongside ? styles.twoColumn : ""}`}
          >
            {showInboxAlongside ? renderInbox() : null}
            <div className={styles.activeView}>
              {view !== "inbox" ? (
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => setView("inbox")}
                >
                  ← Back to conversations
                </button>
              ) : null}
              {view === "inbox" ? renderInbox() : null}
              {view === "new" ? (
                <NewConversation
                  onCreated={(roomId) => {
                    void load();
                    openConversation(roomId);
                  }}
                />
              ) : null}
              {view === "conversation" && selectedRoomId ? (
                <DealRoom
                  roomId={selectedRoomId}
                  embedded
                  maximized={maximized}
                  initialDraft={jobContext?.suggestedMessage}
                  contextCard={
                    jobContext
                      ? {
                          title: jobContext.title,
                          clientWallet: jobContext.clientWallet,
                          budget: `${jobContext.budgetAmount} Test ETH · ${jobContext.budgetType}`,
                          deadline: jobContext.deadline,
                        }
                      : undefined
                  }
                  onExit={() => {
                    setView("inbox");
                    void load();
                  }}
                />
              ) : null}
              {view === "support" ? <SupportChat /> : null}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
