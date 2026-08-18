"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Button, Input, Select, Textarea } from "@/components/ui";
import { useWalletSessionAuth } from "@/components/deal-room/use-wallet-session-auth";
import { jobCategories, validateJobDraft } from "@/services/jobs/job-model";

import styles from "./jobs.module.css";

const allowedAttachments = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
]);

export function PostJobForm() {
  const router = useRouter();
  const auth = useWalletSessionAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetType, setBudgetType] = useState("fixed");
  const [deadline, setDeadline] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [confirmed, setConfirmed] = useState(false);
  const [attachment, setAttachment] = useState<File>();
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (publishing) return;
    if (auth.state !== "authenticated") {
      setError("Authenticate your wallet before publishing a job.");
      return;
    }
    if (
      attachment &&
      (!allowedAttachments.has(attachment.type) ||
        attachment.size > 10 * 1024 * 1024)
    ) {
      setError(
        "Attachments must be PDF, PNG, JPEG, or text and no larger than 10 MB.",
      );
      return;
    }
    const payload = {
      title,
      category,
      description,
      skills,
      budgetAmount,
      budgetType,
      deadline,
      visibility,
      confirmed,
    };
    const validated = validateJobDraft(payload);
    if (!validated.valid) {
      setError(validated.error);
      return;
    }
    setPublishing(true);
    setError("");
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        jobId?: string;
        error?: { message?: string };
      };
      if (!response.ok || !body.jobId) {
        throw new Error(body.error?.message ?? "The job was not published.");
      }
      let attachmentWarning = "";
      if (attachment) {
        const form = new FormData();
        form.set("file", attachment);
        const upload = await fetch(`/api/jobs/${body.jobId}/attachments`, {
          method: "POST",
          body: form,
        });
        if (!upload.ok) attachmentWarning = "&attachment=failed";
      }
      router.push(`/app/jobs/${body.jobId}?published=1${attachmentWarning}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The job was not published.",
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <form className={styles.postForm} onSubmit={submit}>
      {auth.state !== "authenticated" ? (
        <Alert
          variant="info"
          title="Wallet authentication required"
          description="Connect your wallet, then authenticate it through Accord Chat before publishing. Signing does not spend gas."
          action={
            auth.connected ? (
              <Button type="button" onClick={() => void auth.authenticate()}>
                Authenticate wallet
              </Button>
            ) : undefined
          }
        />
      ) : null}
      <Input
        label="Job title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
      />
      <Select
        label="Category"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        placeholder="Choose a category"
        options={jobCategories.map((item) => ({ label: item, value: item }))}
        required
      />
      <Textarea
        label="Full description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        helperText="Describe the work, deliverables, and acceptance expectations."
        maxLength={8000}
        showCharacterCount
        required
      />
      <Input
        label="Required skills"
        value={skills}
        onChange={(event) => setSkills(event.target.value)}
        helperText="Separate skills with commas."
        required
      />
      <Input
        type="number"
        min="0"
        step="0.00000001"
        label="Budget amount"
        suffix="Test ETH"
        value={budgetAmount}
        onChange={(event) => setBudgetAmount(event.target.value)}
        required
      />
      <Select
        label="Budget type"
        value={budgetType}
        onChange={(event) => setBudgetType(event.target.value)}
        options={[
          { label: "Fixed", value: "fixed" },
          { label: "Hourly", value: "hourly" },
        ]}
      />
      <Input
        type="datetime-local"
        label="Deadline"
        value={deadline}
        onChange={(event) => setDeadline(event.target.value)}
        required
      />
      <Input
        type="file"
        label="Optional attachment"
        accept=".pdf,.png,.jpg,.jpeg,.txt"
        helperText="Optional review attachment. PDF, PNG, JPEG, or text; maximum 10 MB. Malware scanning is not configured."
        onChange={(event) => setAttachment(event.target.files?.[0])}
      />
      <Select
        label="Visibility"
        value={visibility}
        onChange={(event) => setVisibility(event.target.value)}
        options={[
          { label: "Public", value: "public" },
          { label: "Private draft", value: "private" },
        ]}
      />
      <label>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          required
        />{" "}
        I confirm this job accurately describes the intended work.
      </label>
      <Alert
        variant="info"
        title="No escrow is created"
        description="Publishing starts an open job listing only. Payment protection is prepared later after both parties agree."
      />
      {error ? (
        <Alert variant="error" title="Job not published" description={error} />
      ) : null}
      <Button
        type="submit"
        loading={publishing}
        disabled={auth.state !== "authenticated"}
      >
        Publish job
      </Button>
    </form>
  );
}
