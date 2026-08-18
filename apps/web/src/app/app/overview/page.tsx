"use client";

import Link from "next/link";

import { Container, Grid, PageHeader, Stack } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import { Alert, Badge, Button, Card, Skeleton } from "@/components/ui";
import { formatAgreementId, useLiveAccordPay } from "@/features/live";

import styles from "../app-pages.module.css";

const metrics = [
  {
    key: "requiresAction",
    label: "Requires Action",
    definition: "Escrows where this wallet currently has a permitted action.",
    filter: "action",
  },
  {
    key: "active",
    label: "Active Escrows",
    definition: "Funded, Delivered, or Disputed escrows for this wallet.",
    filter: "active",
  },
  {
    key: "completed",
    label: "Completed Escrows",
    definition: "Escrows currently in the Completed state.",
    filter: "completed",
  },
  {
    key: "disputed",
    label: "Disputed Escrows",
    definition: "Escrows currently frozen in the Disputed state.",
    filter: "disputed",
  },
] as const;

export default function OverviewPage() {
  const live = useLiveAccordPay();
  const actionEscrows = live.escrows
    .filter((escrow) =>
      ["funded", "delivered", "disputed"].includes(escrow.status),
    )
    .slice(0, 5);

  return (
    <Container size="wide">
      <Stack gap={8}>
        <PageHeader
          eyebrow="Agreement workspace"
          title="Overview"
          description="Wallet-scoped AccordPay activity read from confirmed GIWA Sepolia contract state."
          showTestnetBadge
          primaryAction={<Button href="/app/create">Create escrow</Button>}
          secondaryAction={
            <Button href="/app/agreements" variant="secondary">
              View agreements
            </Button>
          }
        />

        {!live.connected ? (
          <Alert
            variant="info"
            title="Connect a wallet"
            description="Overview values appear only after a wallet is connected. AccordPay never substitutes global totals for personal activity."
          />
        ) : live.error ? (
          <Alert
            variant="error"
            title="GIWA data unavailable"
            description="AccordPay could not read confirmed contract activity. No fallback values are shown."
            action={
              <Button variant="secondary" onClick={() => void live.refresh()}>
                Retry
              </Button>
            }
          />
        ) : live.isLoading && !live.hasIndexedData ? (
          <Alert
            variant="info"
            title="Loading confirmed activity"
            description={
              live.progress
                ? `${live.progress.completedRanges} of ${live.progress.totalRanges} ranges synchronized.`
                : "Preparing the confirmed GIWA Sepolia activity scan."
            }
          />
        ) : live.syncing || !live.syncComplete ? (
          <Alert
            variant="info"
            title="Updating GIWA activity in the background"
            description={
              live.progress
                ? `${live.progress.completedRanges} of ${live.progress.totalRanges} ranges synchronized. Indexed records remain available while updating.`
                : "The first persistent activity synchronization is starting."
            }
          />
        ) : live.partial ? (
          <Alert
            variant="warning"
            title="Some optional details are unavailable"
            description={live.warnings.join(" ")}
          />
        ) : null}

        <Grid columns={4} gap={4}>
          {metrics.map((metric) =>
            live.connected && live.isLoading && !live.hasIndexedData ? (
              <Skeleton
                variant="card"
                label={`Loading ${metric.label}`}
                key={metric.key}
              />
            ) : (
              <Link
                className={styles.metricLink}
                href={`/app/agreements?filter=${metric.filter}`}
                key={metric.key}
              >
                <Card variant="interactive" className={styles.metric}>
                  <span>Live wallet data</span>
                  <strong>
                    {live.connected &&
                    live.counts &&
                    (live.hasIndexedData || live.syncComplete)
                      ? live.counts[metric.key]
                      : "—"}
                  </strong>
                  <p>{metric.label}</p>
                  <p>{metric.definition}</p>
                </Card>
              </Link>
            ),
          )}
        </Grid>

        <Stack gap={4}>
          <h2 className={styles.sectionTitle}>Active agreements</h2>
          {live.connected && live.isLoading && !live.hasIndexedData ? (
            <Skeleton variant="card" label="Loading active agreements" />
          ) : actionEscrows.length > 0 ? (
            <ul className={styles.agreementList}>
              {actionEscrows.map((escrow) => (
                <li className={styles.agreementItem} key={escrow.id.toString()}>
                  <div>
                    <h3>{formatAgreementId(escrow.id)}</h3>
                    <p>
                      Confirmed contract state · Deadline{" "}
                      {new Date(
                        Number(escrow.deadline) * 1000,
                      ).toLocaleString()}
                    </p>
                  </div>
                  <Badge status={escrow.status} />
                  <Button
                    href={`/app/agreements?id=${escrow.id}`}
                    variant="ghost"
                  >
                    Open
                  </Button>
                </li>
              ))}
            </ul>
          ) : live.connected && !live.error && !live.isLoading ? (
            <EmptyState
              title="No active escrows"
              description="No confirmed Funded, Delivered, or Disputed escrow currently involves this wallet."
              primaryAction={<Button href="/app/create">Create escrow</Button>}
            />
          ) : null}
        </Stack>
      </Stack>
    </Container>
  );
}
