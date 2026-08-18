"use client";

import { useEffect, useState } from "react";

import { Alert, Button, Card, Input, Textarea } from "@/components/ui";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  unread_count: string;
  updated_at: string;
};

type SupportMessage = {
  id: string;
  sender_kind: "user" | "support";
  body: string;
  created_at: string;
};

export function SupportChat() {
  const [configured, setConfigured] = useState<boolean>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");

  useEffect(() => {
    void fetch("/api/support", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as {
          configured?: boolean;
          conversations?: Ticket[];
        };
        setConfigured(response.ok ? Boolean(body.configured) : false);
        setTickets(body.conversations ?? []);
      })
      .catch(() => setConfigured(false));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });
    const body = (await response.json()) as { error?: { message: string } };
    if (!response.ok) {
      setError(body.error?.message ?? "Support request failed.");
      return;
    }
    window.location.reload();
  }

  async function openTicket(id: string) {
    setSelected(id);
    const response = await fetch(`/api/support/${id}/messages`, {
      cache: "no-store",
    });
    const body = (await response.json()) as {
      messages?: SupportMessage[];
      error?: { message: string };
    };
    if (!response.ok) {
      setError(body.error?.message ?? "Support conversation unavailable.");
      return;
    }
    setMessages(body.messages ?? []);
  }

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    const response = await fetch(`/api/support/${selected}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientId: crypto.randomUUID(),
        message: reply.trim(),
      }),
    });
    const body = (await response.json()) as { error?: { message: string } };
    if (!response.ok) {
      setError(body.error?.message ?? "Support reply failed.");
      return;
    }
    setReply("");
    await openTicket(selected);
  }

  if (configured === false) {
    return (
      <Alert
        variant="info"
        title="AccordPay Support is offline"
        description="A staffed support-agent system is not configured. Do not share private keys, recovery phrases, OTP codes, or confidential agreement content."
      />
    );
  }

  return (
    <div>
      <Card>
        <form onSubmit={submit}>
          <Input
            label="Subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            required
          />
          <Textarea
            label="Message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
          />
          <Button type="submit">Contact AccordPay Support</Button>
          {error ? <p role="alert">{error}</p> : null}
        </form>
      </Card>
      {tickets.map((ticket) => (
        <Card key={ticket.id}>
          <strong>{ticket.subject}</strong>
          <p>Status: {ticket.status.replaceAll("_", " ")}</p>
          {Number(ticket.unread_count) > 0 ? (
            <span>{ticket.unread_count} unread</span>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => void openTicket(ticket.id)}
          >
            Open conversation
          </Button>
        </Card>
      ))}
      {selected ? (
        <Card>
          <h2>Support conversation</h2>
          {messages.length ? (
            <ol>
              {messages.map((item) => (
                <li key={item.id}>
                  <strong>
                    {item.sender_kind === "support"
                      ? "AccordPay Support"
                      : "You"}
                  </strong>
                  <p>{item.body}</p>
                  <time dateTime={item.created_at}>
                    {new Date(item.created_at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <p>No support messages yet.</p>
          )}
          <form onSubmit={sendReply}>
            <Textarea
              label="Reply"
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              maxLength={4000}
              showCharacterCount
            />
            <Button type="submit" disabled={!reply.trim()}>
              Send reply
            </Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
