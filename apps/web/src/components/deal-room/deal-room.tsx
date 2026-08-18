"use client";

import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConnection } from "wagmi";

import { Stack } from "@/components/layout";
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { accordPayEscrowContract } from "@/config/contracts";
import { canFinalizePrivateAgreement } from "@/services/deal-room/private-agreement";
import {
  conversationSessionKey,
  isNearMessageBottom,
  mergeMessages,
  prependScrollTop,
} from "@/services/deal-room/conversation-model";

import styles from "./deal-room.module.css";
import { RichMessage } from "./rich-message";

type Message = {
  id: string;
  sender_address: string;
  message_type: "text" | "system" | "assistant";
  body: string;
  created_at: string;
  message_sequence: number;
  message_payload?: {
    kind?: string;
    attachmentId?: string;
    filename?: string;
    missingFields?: string[];
    final?: boolean;
  };
};

type RoomPayload = {
  room: {
    id: string;
    title: string;
    status: string;
    buyer_address: string;
    seller_address: string;
    current_version: number;
    escrow_id: string | null;
    context_type: "direct_agreement" | "job";
    context_id: string | null;
  };
  role: "buyer" | "seller";
  messages: Message[];
  versions: Array<{
    id: string;
    version: number;
    canonical_content: Record<string, unknown>;
    content_hash: string;
    privacy_mode: "public" | "private";
    finalized_at: string | null;
  }>;
  approvals: Array<{
    agreement_version_id: string;
    role: "buyer" | "seller";
    content_hash: string;
  }>;
  artifacts: Array<{ document_uri: string }>;
  lastReadSequence: number;
  archived: boolean;
  draft: string;
};

export function DealRoom({
  roomId,
  embedded = false,
  maximized = false,
  onExit,
  initialDraft,
  contextCard,
}: {
  roomId: string;
  embedded?: boolean;
  maximized?: boolean;
  onExit?: () => void;
  initialDraft?: string;
  contextCard?: {
    title: string;
    clientWallet: `0x${string}`;
    budget: string;
    deadline: string;
  };
}) {
  const connection = useConnection();
  const [data, setData] = useState<RoomPayload>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [criteria, setCriteria] = useState("");
  const [privacyMode, setPrivacyMode] = useState<"public" | "private">(
    "public",
  );
  const [artifactUri, setArtifactUri] = useState("");
  const [assistantResult, setAssistantResult] = useState("");
  const [attachment, setAttachment] = useState<File>();
  const [attachmentState, setAttachmentState] = useState<
    "idle" | "uploading" | "error"
  >("idle");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const messageListRef = useRef<HTMLOListElement>(null);
  const initializedScroll = useRef(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [storedContextCard, setStoredContextCard] =
    useState<typeof contextCard>();

  const load = useCallback(async () => {
    const response = await fetch(`/api/deal-rooms/${roomId}`, {
      cache: "no-store",
    });
    const body = (await response.json()) as RoomPayload & {
      error?: { message: string };
    };
    if (!response.ok) {
      setError(body.error?.message ?? "Accord Chat unavailable.");
      return;
    }
    setData((previous) =>
      previous
        ? {
            ...body,
            messages: mergeMessages(previous.messages, body.messages),
          }
        : body,
    );
  }, [roomId]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/deal-rooms/${roomId}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as RoomPayload & {
          error?: { message: string };
        };
        if (!response.ok) {
          setError(body.error?.message ?? "Accord Chat unavailable.");
          return;
        }
        setData(body);
        setMessage(
          window.sessionStorage.getItem(
            conversationSessionKey(roomId, "draft"),
          ) ||
            body.draft ||
            initialDraft ||
            "",
        );
        setHasMoreMessages(body.messages.length === 40);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("Accord Chat unavailable.");
      });
    return () => controller.abort();
  }, [initialDraft, roomId]);

  useEffect(() => {
    const jobId =
      data?.room.context_type === "job" ? data.room.context_id : null;
    if (!jobId || contextCard) return;
    const controller = new AbortController();
    void fetch(`/api/jobs/${jobId}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as {
          job?: {
            title: string;
            clientWallet: `0x${string}`;
            budgetAmount: string;
            budgetType: string;
            deadline: string;
          };
        };
        if (body.job) {
          setStoredContextCard({
            title: body.job.title,
            clientWallet: body.job.clientWallet,
            budget: `${body.job.budgetAmount} Test ETH · ${body.job.budgetType}`,
            deadline: body.job.deadline,
          });
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [contextCard, data?.room.context_id, data?.room.context_type]);

  useEffect(() => {
    if (!data || initializedScroll.current || !messageListRef.current) return;
    initializedScroll.current = true;
    const list = messageListRef.current;
    const stored = Number(
      window.sessionStorage.getItem(conversationSessionKey(roomId, "scroll")),
    );
    const firstUnread = data.messages.find(
      (item) => item.message_sequence > data.lastReadSequence,
    );
    window.requestAnimationFrame(() => {
      if (Number.isFinite(stored) && stored > 0) list.scrollTop = stored;
      else if (firstUnread) {
        list
          .querySelector(`[data-sequence="${firstUnread.message_sequence}"]`)
          ?.scrollIntoView({ block: "start" });
      } else list.scrollTop = list.scrollHeight;
    });
  }, [data, roomId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(
        conversationSessionKey(roomId, "draft"),
        message,
      );
      void fetch(`/api/accord-chat/rooms/${roomId}/state`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draft: message }),
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [message, roomId]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon || !data) return;
    let active = true;
    void (async () => {
      const tokenResponse = await fetch("/api/accord-chat/auth/realtime");
      if (!tokenResponse.ok || !active) return;
      const { token } = (await tokenResponse.json()) as { token: string };
      const client = createClient(url, anon, {
        accessToken: async () => token,
      });
      channelRef.current = client
        .channel(`deal-room:${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "deal_room_messages",
            filter: `room_id=eq.${roomId}`,
          },
          () => {
            const nearBottom = messageListRef.current
              ? isNearMessageBottom(messageListRef.current)
              : true;
            void load().then(() => {
              if (nearBottom && messageListRef.current) {
                messageListRef.current.scrollTop =
                  messageListRef.current.scrollHeight;
              } else {
                setNewMessageCount((count) => count + 1);
              }
            });
          },
        )
        .subscribe();
    })();
    return () => {
      active = false;
      if (channelRef.current) void channelRef.current.unsubscribe();
    };
  }, [data, load, roomId]);

  async function loadOlderMessages() {
    if (!data || loadingOlder || !hasMoreMessages) return;
    const first = data.messages[0]?.message_sequence;
    if (!first) return;
    const list = messageListRef.current;
    const previousScrollHeight = list?.scrollHeight ?? 0;
    const previousScrollTop = list?.scrollTop ?? 0;
    setLoadingOlder(true);
    const response = await fetch(
      `/api/accord-chat/rooms/${roomId}/messages?beforeSequence=${first}&limit=40`,
      { cache: "no-store" },
    );
    const body = (await response.json()) as {
      messages?: Message[];
      hasMore?: boolean;
    };
    if (response.ok && body.messages) {
      setData((currentData) =>
        currentData
          ? {
              ...currentData,
              messages: mergeMessages(body.messages!, currentData.messages),
            }
          : currentData,
      );
      setHasMoreMessages(Boolean(body.hasMore));
      window.requestAnimationFrame(() => {
        if (list) {
          list.scrollTop = prependScrollTop({
            previousScrollHeight,
            nextScrollHeight: list.scrollHeight,
            previousScrollTop,
          });
        }
      });
    }
    setLoadingOlder(false);
  }

  async function markViewed(sequence: number) {
    await fetch(`/api/accord-chat/rooms/${roomId}/read`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sequence }),
    });
  }

  function handleMessageScroll() {
    const list = messageListRef.current;
    if (!list || !data) return;
    window.sessionStorage.setItem(
      conversationSessionKey(roomId, "scroll"),
      String(list.scrollTop),
    );
    if (list.scrollTop < 64) void loadOlderMessages();
    if (isNearMessageBottom(list)) {
      const latest = data.messages.at(-1)?.message_sequence ?? 0;
      void markViewed(latest);
      setNewMessageCount(0);
    }
  }

  const current = data?.versions[0];
  const activeArtifactUri =
    artifactUri || data?.artifacts[0]?.document_uri || "";
  const approvedRoles = useMemo(
    () =>
      new Set(
        data?.approvals
          .filter(
            (approval) =>
              approval.agreement_version_id === current?.id &&
              approval.content_hash === current?.content_hash,
          )
          .map((approval) => approval.role),
      ),
    [current, data?.approvals],
  );

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const body = message.trim();
    if (!body) return;
    const response = await fetch(`/api/deal-rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: crypto.randomUUID(), message: body }),
    });
    if (response.ok) {
      setMessage("");
      window.sessionStorage.removeItem(conversationSessionKey(roomId, "draft"));
      await load();
    }
  }

  async function uploadAttachment() {
    if (!attachment) return;
    setAttachmentState("uploading");
    const form = new FormData();
    form.set("file", attachment);
    try {
      const uploadResponse = await fetch(
        `/api/accord-chat/rooms/${roomId}/attachments`,
        { method: "POST", body: form },
      );
      const uploaded = (await uploadResponse.json()) as {
        attachment?: { id: string; filename: string; contentType: string };
        error?: { message: string };
      };
      if (!uploadResponse.ok || !uploaded.attachment) {
        throw new Error(uploaded.error?.message ?? "Upload failed.");
      }
      const messageResponse = await fetch(
        `/api/deal-rooms/${roomId}/messages`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            clientId: crypto.randomUUID(),
            message: `Shared attachment: ${uploaded.attachment.filename}`,
            messagePayload: {
              kind: "attachment",
              attachmentId: uploaded.attachment.id,
              filename: uploaded.attachment.filename,
              contentType: uploaded.attachment.contentType,
            },
          }),
        },
      );
      if (!messageResponse.ok) throw new Error("Attachment message failed.");
      setAttachment(undefined);
      setAttachmentState("idle");
      await load();
    } catch {
      setAttachmentState("error");
    }
  }

  async function proposeAgreement(event: React.FormEvent) {
    event.preventDefault();
    if (!data || !connection.address) return;
    if (privacyMode === "private" && !canFinalizePrivateAgreement()) {
      setError(
        "Private agreement key delivery is not yet supported for this wallet. The draft remains private and cannot be finalized or silently made public.",
      );
      return;
    }
    const version = data.room.current_version + 1;
    const content = {
      schemaVersion: "1.0",
      roomId,
      version,
      title: data.room.title,
      description,
      buyer: data.room.buyer_address,
      seller: data.room.seller_address,
      amount,
      currency: "Test ETH",
      network: "GIWA Sepolia",
      chainId: 91342,
      contractAddress: accordPayEscrowContract.address,
      deadline,
      deliverables: deliverables
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      acceptanceCriteria: criteria
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      requiredDeliveryEvidence: ["Public delivery proof URI"],
      revisionConditions:
        "Any edit creates a new version and resets approvals.",
      refundConditions:
        "The seller may immediately refund the full escrow amount while Funded or Delivered.",
      disputeConditions:
        "Either party may freeze a Funded or Delivered escrow. Only the designated testnet resolver may finalize a payout split.",
      additionalTerms: "",
      privacyMode,
    };
    const response = await fetch(`/api/deal-rooms/${roomId}/agreements`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (response.ok) await load();
  }

  async function approve() {
    if (!current) return;
    const response = await fetch(
      `/api/deal-rooms/${roomId}/agreements/${current.version}/approve`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentHash: current.content_hash }),
      },
    );
    const body = (await response.json()) as {
      bothApproved?: boolean;
      error?: { message: string };
    };
    if (!response.ok) {
      setError(body.error?.message ?? "Approval failed.");
      return;
    }
    if (body.bothApproved) {
      await generateArtifact();
      return;
    }
    await load();
  }

  async function generateArtifact() {
    const response = await fetch(`/api/deal-rooms/${roomId}/artifacts`, {
      method: "POST",
    });
    const body = (await response.json()) as {
      artifact?: { document_uri: string };
      error?: { message: string };
    };
    if (!response.ok || !body.artifact) {
      setError(body.error?.message ?? "Agreement artifact was not generated.");
      return;
    }
    setArtifactUri(body.artifact.document_uri);
    await load();
  }

  async function runAssistant() {
    if (!data) return;
    const version = data.room.current_version + 1;
    const currentDraft = {
      schemaVersion: "1.0",
      roomId,
      version,
      title: data.room.title,
      description,
      buyer: data.room.buyer_address,
      seller: data.room.seller_address,
      amount,
      currency: "Test ETH",
      network: "GIWA Sepolia",
      chainId: 91342,
      contractAddress: accordPayEscrowContract.address,
      deadline,
      deliverables: deliverables.split("\n").filter(Boolean),
      acceptanceCriteria: criteria.split("\n").filter(Boolean),
      requiredDeliveryEvidence: ["Public delivery proof URI"],
      revisionConditions: "",
      refundConditions: "",
      disputeConditions: "",
      additionalTerms: "",
      privacyMode,
    };
    const response = await fetch(`/api/deal-rooms/${roomId}/assistant`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        current: currentDraft,
        includeConversation: false,
        externalProcessingConsent: false,
      }),
    });
    const body = (await response.json()) as {
      proposal?: { missingFields: string[] };
      error?: { message: string };
    };
    setAssistantResult(
      response.ok
        ? body.proposal?.missingFields.length
          ? `Missing: ${body.proposal.missingFields.join(", ")}`
          : "The structured draft contains all required core fields."
        : (body.error?.message ?? "Assistant unavailable."),
    );
  }

  async function roomAction(action: "leave" | "archive") {
    const response = await fetch(`/api/deal-rooms/${roomId}/actions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: { message: string } };
      setError(body.error?.message ?? "Room action was rejected.");
      return;
    }
    if (onExit) onExit();
  }

  if (error && !data) {
    return (
      <Alert
        variant="error"
        title="Accord Chat unavailable"
        description={error}
      />
    );
  }
  if (!data) return <p>Loading private Accord Chat workspace…</p>;

  return (
    <div
      className={`${styles.dealRoom} ${embedded ? styles.embedded : ""} ${
        maximized ? styles.embeddedMaximized : ""
      }`}
    >
      <section className={styles.conversation} aria-label="Agreement chat">
        <div className={styles.roomHeading}>
          <div>
            <h2>{data.room.title}</h2>
            <p>
              You are the {data.role}. Private content is restricted to the
              buyer and seller.
            </p>
          </div>
          <Badge
            status={data.room.status === "funded" ? "funded" : "pending"}
          />
        </div>
        {contextCard || storedContextCard ? (
          <Card variant="tinted">
            <strong>{(contextCard ?? storedContextCard)?.title}</strong>
            <p>{(contextCard ?? storedContextCard)?.budget}</p>
            <p>
              Deadline:{" "}
              {new Date(
                (contextCard ?? storedContextCard)!.deadline,
              ).toLocaleString()}
            </p>
            <small title={(contextCard ?? storedContextCard)?.clientWallet}>
              Client: {(contextCard ?? storedContextCard)?.clientWallet}
            </small>
          </Card>
        ) : null}
        <div className={styles.historyBoundary} aria-live="polite">
          {loadingOlder ? <span>Loading earlier messages…</span> : null}
          {!hasMoreMessages ? <span>Beginning of conversation</span> : null}
        </div>
        <ol
          ref={messageListRef}
          className={styles.messages}
          onScroll={handleMessageScroll}
        >
          {data.messages.length === 0 ? (
            <li>No messages yet. Start the agreement discussion.</li>
          ) : (
            data.messages.map((item) => (
              <li
                key={item.id}
                data-sequence={item.message_sequence}
                className={
                  item.message_type === "system" ? styles.systemMessage : ""
                }
              >
                <strong>
                  {item.message_type === "system"
                    ? "AccordPay"
                    : item.sender_address === connection.address
                      ? "You"
                      : "Counterparty"}
                </strong>
                <RichMessage body={item.body} />
                {item.message_payload?.kind === "agreement-draft" ? (
                  <Card variant="tinted">
                    <strong>AI agreement draft</strong>
                    <p>Proposal only—not final metadata and not an approval.</p>
                    {item.message_payload.missingFields?.length ? (
                      <p>
                        Needs review:{" "}
                        {item.message_payload.missingFields.join(", ")}
                      </p>
                    ) : (
                      <p>Core fields are present and still require review.</p>
                    )}
                  </Card>
                ) : null}
                {item.message_payload?.kind === "attachment" &&
                item.message_payload.attachmentId ? (
                  <a
                    href={`/api/accord-chat/attachments/${item.message_payload.attachmentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open {item.message_payload.filename ?? "attachment"}
                  </a>
                ) : null}
                <time dateTime={item.created_at}>
                  {new Date(item.created_at).toLocaleString()}
                </time>
              </li>
            ))
          )}
        </ol>
        {newMessageCount > 0 ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (messageListRef.current) {
                messageListRef.current.scrollTop =
                  messageListRef.current.scrollHeight;
              }
              setNewMessageCount(0);
            }}
          >
            New messages ({newMessageCount})
          </Button>
        ) : null}
        <form onSubmit={sendMessage} className={styles.messageComposer}>
          <Textarea
            label="Message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={4000}
            showCharacterCount
          />
          <Button type="submit" disabled={!message.trim()}>
            Send
          </Button>
          <Input
            label="Attach file"
            type="file"
            accept=".json,.pdf,.jpg,.jpeg,.png,.txt,.md,.zip"
            onChange={(event) => setAttachment(event.target.files?.[0])}
            helperText="Maximum 25 MB. Malware scanning is not configured."
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void uploadAttachment()}
            disabled={!attachment}
            loading={attachmentState === "uploading"}
          >
            Upload attachment
          </Button>
          {attachmentState === "error" ? (
            <p role="alert">
              Upload failed. Check the file and retry; it has not been sent.
            </p>
          ) : null}
        </form>
      </section>

      <aside className={styles.agreementPanel} aria-label="Agreement draft">
        <Stack gap={4}>
          <div>
            <span>Current version</span>
            <h2>{current ? `Version ${current.version}` : "No draft yet"}</h2>
            {current ? <code>{current.content_hash}</code> : null}
          </div>
          <div className={styles.approvals}>
            <span>
              Buyer: {approvedRoles.has("buyer") ? "Approved" : "Pending"}
            </span>
            <span>
              Seller: {approvedRoles.has("seller") ? "Approved" : "Pending"}
            </span>
          </div>
          {["draft", "awaiting_counterparty", "negotiating"].includes(
            data.room.status,
          ) ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => void roomAction("leave")}
            >
              Leave room
            </Button>
          ) : null}
          {["completed", "refunded"].includes(data.room.status) ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                void fetch(`/api/accord-chat/rooms/${roomId}/state`, {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ archived: !data.archived }),
                }).then(() => load())
              }
            >
              {data.archived
                ? "Unarchive conversation"
                : "Archive conversation"}
            </Button>
          ) : null}
          {current ? (
            <Card variant="tinted">
              <p>
                You are approving this exact version of the agreement. Any
                future edit will invalidate both approvals.
              </p>
              <Button
                type="button"
                onClick={() => void approve()}
                disabled={approvedRoles.has(data.role)}
              >
                {approvedRoles.has(data.role)
                  ? `${data.role} approved`
                  : `Approve as ${data.role}`}
              </Button>
            </Card>
          ) : null}
          {current?.finalized_at ? (
            <Card variant="tinted">
              <Stack gap={3}>
                <strong>Agreement finalized</strong>
                <span>Version {current.version}</span>
                <code>{current.content_hash}</code>
                {activeArtifactUri ? (
                  <>
                    <a
                      href={activeArtifactUri}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View agreement document
                    </a>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        void navigator.clipboard.writeText(activeArtifactUri)
                      }
                    >
                      Copy secure document link
                    </Button>
                    <a href={activeArtifactUri} download>
                      Download copy
                    </a>
                    <Button href={`/app/create?room=${roomId}`}>
                      Create escrow
                    </Button>
                  </>
                ) : (
                  <p role="status">
                    Generating the immutable agreement artifact…
                  </p>
                )}
              </Stack>
            </Card>
          ) : null}
          <form onSubmit={proposeAgreement} className={styles.draftForm}>
            <Card variant="tinted">
              <strong>AccordPay Agreement Assistant</strong>
              <p>
                Deterministic drafting help identifies missing fields. It cannot
                approve, finalize, or submit transactions.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void runAssistant()}
              >
                Review structured draft
              </Button>
              {assistantResult ? <p role="status">{assistantResult}</p> : null}
            </Card>
            <Textarea
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
            <Input
              label="Amount"
              type="number"
              min="0"
              step="any"
              suffix="Test ETH"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
            <Input
              label="Deadline"
              type="datetime-local"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              required
            />
            <Textarea
              label="Deliverables"
              helperText="One deliverable per line."
              value={deliverables}
              onChange={(event) => setDeliverables(event.target.value)}
              required
            />
            <Textarea
              label="Acceptance criteria"
              helperText="One criterion per line."
              value={criteria}
              onChange={(event) => setCriteria(event.target.value)}
              required
            />
            <Select
              label="Privacy mode"
              value={privacyMode}
              onChange={(event) =>
                setPrivacyMode(event.target.value as "public" | "private")
              }
              options={[
                { label: "Public agreement", value: "public" },
                { label: "Private agreement", value: "private" },
              ]}
            />
            {privacyMode === "public" ? (
              <Alert
                variant="warning"
                title="Public agreement"
                description="Anyone who obtains the on-chain URI may be able to read this agreement."
              />
            ) : (
              <Alert
                variant="warning"
                title="Private finalization unavailable"
                description="Private agreement key delivery is not yet supported for this wallet. AccordPay will not silently make it public."
              />
            )}
            <Button type="submit">Propose new version</Button>
          </form>
        </Stack>
      </aside>
    </div>
  );
}
