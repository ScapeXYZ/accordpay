"use client";

import { useState } from "react";

import { Button, Input, Textarea } from "@/components/ui";

export function DeliveryProofBuilder({
  escrowId,
  onReady,
}: {
  escrowId: bigint;
  onReady: (uri: string) => void;
}) {
  const [file, setFile] = useState<File>();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function upload() {
    if (!file) return;
    setPending(true);
    setError("");
    const form = new FormData();
    form.set("file", file);
    form.set("escrowId", escrowId.toString());
    form.set("note", note);
    try {
      const response = await fetch("/api/deliveries/upload", {
        method: "POST",
        body: form,
      });
      const body = (await response.json()) as {
        evidenceUri?: string;
        error?: { message: string };
      };
      if (!response.ok || !body.evidenceUri) {
        throw new Error(body.error?.message ?? "Upload failed.");
      }
      onReady(body.evidenceUri);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Input
        label="Completed work or proof"
        type="file"
        accept=".json,.pdf,.jpg,.jpeg,.png,.txt,.md,.zip"
        onChange={(event) => setFile(event.target.files?.[0])}
        helperText="Maximum 25 MB. Uploaded files are never executed. Malware scanning is not currently available."
      />
      <Textarea
        label="Delivery note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={2000}
        helperText="Optional note included in the structured evidence record."
      />
      <Button
        type="button"
        onClick={() => void upload()}
        loading={pending}
        disabled={!file}
      >
        Upload and generate proof
      </Button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
