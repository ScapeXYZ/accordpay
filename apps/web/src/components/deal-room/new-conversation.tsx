"use client";

import { useState } from "react";

import { Button, Input, Select } from "@/components/ui";
import { readAccordChatJson } from "@/services/deal-room/client-api";

import styles from "./accord-chat-launcher.module.css";

export function NewConversation({
  onCreated,
}: {
  onCreated: (roomId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [invite, setInvite] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/deal-rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          invite: invite.trim(),
          role,
        }),
      });
      const body = await readAccordChatJson<{
        roomId?: string;
        inviteToken?: string;
      }>(response, "The conversation could not be created.");
      if (!body.roomId) throw new Error("The server did not return a room ID.");
      onCreated(body.roomId);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The conversation could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.newConversation} onSubmit={submit}>
      <h3>Start conversation</h3>
      <p>
        Invite the intended counterparty to discuss and approve a secure
        agreement.
      </p>
      <Input
        label="Agreement title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
      />
      <Select
        label="My intended role"
        value={role}
        onChange={(event) => setRole(event.target.value as "buyer" | "seller")}
        options={[
          { label: "Buyer", value: "buyer" },
          { label: "Seller", value: "seller" },
        ]}
      />
      <Input
        label="Counterparty wallet or UP ID"
        value={invite}
        onChange={(event) => setInvite(event.target.value)}
        placeholder="0x… or username.up.id"
        required
      />
      <Button type="submit" loading={submitting}>
        Start agreement chat
      </Button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
