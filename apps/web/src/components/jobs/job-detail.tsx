"use client";

import { useEffect, useState } from "react";

import { AccordIdentity } from "@/components/deal-room/accord-identity";
import { Alert, Badge, Button, Card, Spinner } from "@/components/ui";
import type { MarketplaceJob } from "@/services/jobs/job-model";

import { ContactClientButton } from "./contact-client-button";
import styles from "./jobs.module.css";

export function JobDetail({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<MarketplaceJob>();
  const [related, setRelated] = useState<MarketplaceJob[]>([]);
  const [attachments, setAttachments] = useState<
    Array<{
      id: string;
      safe_filename: string;
      content_type: string;
      byte_size: string;
      content_hash: string;
    }>
  >([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [published, setPublished] = useState(false);
  const [attachmentWarning, setAttachmentWarning] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusTimer = window.setTimeout(() => {
      setPublished(params.get("published") === "1");
      setAttachmentWarning(params.get("attachment") === "failed");
    }, 0);
    const controller = new AbortController();
    void fetch(`/api/jobs/${jobId}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as {
          job?: MarketplaceJob;
          related?: MarketplaceJob[];
          attachments?: typeof attachments;
          error?: { message?: string };
        };
        if (!response.ok || !body.job) {
          setError(body.error?.message ?? "The job could not be loaded.");
          return;
        }
        setJob(body.job);
        setRelated(body.related ?? []);
        setAttachments(body.attachments ?? []);
        setSaved(
          window.localStorage.getItem(`accordpay:saved-job:${jobId}`) === "1",
        );
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("The job could not be loaded.");
      });
    return () => {
      window.clearTimeout(statusTimer);
      controller.abort();
    };
  }, [jobId]);

  if (error)
    return (
      <Alert variant="error" title="Job unavailable" description={error} />
    );
  if (!job) return <Spinner label="Loading job details" />;

  return (
    <div className={styles.detailGrid}>
      <article className={styles.detailContent}>
        {published ? (
          <Alert
            variant="success"
            title="Job published"
            description="The listing is now available in Jobs & Services. No escrow was created."
          />
        ) : null}
        {attachmentWarning ? (
          <Alert
            variant="warning"
            title="Job published without attachment"
            description="The listing is live, but the optional attachment upload failed."
          />
        ) : null}
        <div className={styles.cardTop}>
          <Badge status="funded">Open</Badge>
          {job.isDemo ? <Badge status="testnet">Demo job</Badge> : null}
        </div>
        <div>
          <span>{job.category}</span>
          <h1>{job.title}</h1>
          <p>
            Posted {new Date(job.createdAt).toLocaleString()} · Job ID {job.id}
          </p>
        </div>
        <Card>
          <h2>About this job</h2>
          <p className={styles.description}>{job.description}</p>
        </Card>
        {attachments.length ? (
          <Card>
            <h2>Job attachments</h2>
            {attachments.map((attachment) => (
              <p key={attachment.id}>
                <a
                  href={`/api/jobs/attachments/${attachment.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {attachment.safe_filename}
                </a>{" "}
                · {attachment.content_type} ·{" "}
                {Math.ceil(Number(attachment.byte_size) / 1024)} KB
              </p>
            ))}
            <small>
              Malware scanning is not configured. Treat downloaded files as
              untrusted.
            </small>
          </Card>
        ) : null}
        <Card>
          <h2>Required skills</h2>
          <div className={styles.skills}>
            {job.skills.map((skill) => (
              <span key={skill} className={styles.skill}>
                {skill}
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <h2>Activity</h2>
          <p>
            {job.proposalCount} job conversation
            {job.proposalCount === 1 ? "" : "s"} started. Starting a
            conversation does not assign the job.
          </p>
        </Card>
        {related.length ? (
          <section>
            <h2>Related jobs</h2>
            {related.map((item) => (
              <Button
                key={item.id}
                href={`/app/jobs/${item.id}`}
                variant="ghost"
              >
                {item.title}
              </Button>
            ))}
          </section>
        ) : null}
      </article>
      <aside className={styles.sidebar}>
        <Card variant="elevated">
          <h2>{job.budgetAmount} Test ETH</h2>
          <p>{job.budgetType === "fixed" ? "Fixed budget" : "Hourly budget"}</p>
          <p>Deadline: {new Date(job.deadline).toLocaleString()}</p>
          <ContactClientButton jobId={job.id} />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const next = !saved;
              setSaved(next);
              if (next)
                window.localStorage.setItem(
                  `accordpay:saved-job:${jobId}`,
                  "1",
                );
              else
                window.localStorage.removeItem(`accordpay:saved-job:${jobId}`);
            }}
          >
            {saved ? "Saved" : "Save job"}
          </Button>
        </Card>
        <Card>
          <h2>Client</h2>
          <AccordIdentity
            address={job.clientWallet}
            displayName={job.clientDisplayName}
            role="Buyer"
          />
          <code>{job.clientWallet}</code>
        </Card>
      </aside>
    </div>
  );
}
