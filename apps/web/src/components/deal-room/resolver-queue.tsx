"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert, Card, Spinner } from "@/components/ui";

type DisputeCase = {
  id: string;
  escrow_id: string;
  raised_by: string;
  reason: string;
  created_at: string;
  proposed_buyer_share_bps: number | null;
};

export function ResolverQueue() {
  const [cases, setCases] = useState<DisputeCase[]>();
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/disputes", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as {
          cases?: DisputeCase[];
          error?: { message: string };
        };
        if (!response.ok) throw new Error(body.error?.message);
        setCases(body.cases ?? []);
      })
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Resolver queue unavailable.",
        ),
      );
  }, []);

  if (error) {
    return (
      <Alert
        variant="warning"
        title="Designated resolver access only"
        description={error}
      />
    );
  }
  if (!cases) return <Spinner label="Loading disputed escrows" />;
  if (cases.length === 0) {
    return (
      <Card variant="tinted">
        <strong>No open dispute cases</strong>
        <p>No authenticated off-chain cases currently require review.</p>
      </Card>
    );
  }
  return (
    <div>
      {cases.map((item) => (
        <Card key={item.id}>
          <strong>ACP-{item.escrow_id.padStart(6, "0")}</strong>
          <p>{item.reason}</p>
          <p>
            Raising a dispute moved no funds. Review both parties’ evidence
            before selecting a 0–10,000 BPS buyer share.
          </p>
          <Link href={`/app/agreements?id=${item.escrow_id}`}>
            Open resolution controls
          </Link>
        </Card>
      ))}
    </div>
  );
}
