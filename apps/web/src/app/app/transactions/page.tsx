"use client";

import { useMemo, useState } from "react";

import { Container, PageHeader, Stack } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import { Alert, Badge, Button, Input, Select, Skeleton } from "@/components/ui";
import {
  filterTransactions,
  parseAgreementId,
  supportedEventNames,
  useLiveAccordPay,
} from "@/features/live";

import styles from "../app-pages.module.css";

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  const live = useLiveAccordPay();
  const [agreement, setAgreement] = useState("");
  const [eventType, setEventType] = useState("all");
  const [status, setStatus] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const parsedAgreement = agreement ? parseAgreementId(agreement) : undefined;

  const filtered = useMemo(
    () =>
      filterTransactions(live.transactions, {
        agreement,
        eventType,
        status,
      }),
    [agreement, eventType, live.transactions, status],
  );
  const rows = filtered.slice(0, visible);

  return (
    <Container size="wide">
      <Stack gap={8}>
        <PageHeader
          eyebrow="Agreement workspace"
          title="Transactions"
          description="Confirmed wallet-relevant AccordPay events from GIWA Sepolia."
          showTestnetBadge
        />

        {!live.connected ? (
          <Alert
            variant="info"
            title="Connect a wallet"
            description="AccordPay shows only confirmed events for the connected buyer, seller, or configured resolver."
          />
        ) : live.error ? (
          <Alert
            variant="error"
            title="Transaction history unavailable"
            description="The GIWA RPC request failed. AccordPay does not show fabricated fallback events."
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
                ? `${live.progress.completedRanges} of ${live.progress.totalRanges} ranges synchronized. Confirmed rows appear after synchronization.`
                : "Preparing the confirmed GIWA Sepolia activity scan."
            }
          />
        ) : live.syncing || !live.syncComplete ? (
          <Alert
            variant="info"
            title="Updating GIWA activity in the background"
            description={
              live.progress
                ? `${live.progress.completedRanges} of ${live.progress.totalRanges} ranges synchronized. Existing indexed transactions remain available.`
                : "The first persistent activity synchronization is starting."
            }
          />
        ) : live.partial ? (
          <Alert
            variant="warning"
            title="Some transaction details are pending"
            description={live.warnings.join(" ")}
          />
        ) : null}

        <div className={styles.filters}>
          <Input
            label="Agreement ID"
            type="search"
            placeholder="5 or ACP-000005"
            value={agreement}
            error={
              agreement && parsedAgreement === undefined
                ? "Enter a numeric ID or ACP-000005 format."
                : undefined
            }
            onChange={(event) => {
              setAgreement(event.target.value);
              setVisible(PAGE_SIZE);
            }}
          />
          <Select
            label="Event type"
            value={eventType}
            onChange={(event) => {
              setEventType(event.target.value);
              setVisible(PAGE_SIZE);
            }}
            options={[
              { label: "All events", value: "all" },
              ...supportedEventNames.map((name) => ({
                label: name,
                value: name,
              })),
            ]}
          />
          <Select
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setVisible(PAGE_SIZE);
            }}
            options={[
              { label: "All statuses", value: "all" },
              ...[
                "funded",
                "delivered",
                "completed",
                "refunded",
                "disputed",
              ].map((value) => ({
                label: value[0].toUpperCase() + value.slice(1),
                value,
              })),
            ]}
          />
        </div>

        {live.connected && live.isLoading && !live.hasIndexedData ? (
          <Stack gap={3}>
            <Skeleton variant="table-row" label="Loading transactions" />
            <Skeleton variant="table-row" label="Loading transactions" />
            <Skeleton variant="table-row" label="Loading transactions" />
          </Stack>
        ) : rows.length > 0 ? (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {[
                      "Event type",
                      "Agreement ID",
                      "Role",
                      "Amount",
                      "Status",
                      "Timestamp",
                      "Transaction hash",
                      "Explorer",
                    ].map((heading) => (
                      <th key={heading}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.eventLabel}</td>
                      <td>{row.agreementId}</td>
                      <td>{row.role}</td>
                      <td>{row.amountLabel}</td>
                      <td>
                        <Badge status={row.status} />
                      </td>
                      <td>
                        {row.timestamp == null ? (
                          <span>Timestamp pending</span>
                        ) : (
                          <time
                            dateTime={new Date(
                              row.timestamp * 1000,
                            ).toISOString()}
                          >
                            {new Date(row.timestamp * 1000).toLocaleString()}
                          </time>
                        )}
                      </td>
                      <td title={row.transactionHash}>
                        <code>
                          {row.transactionHash.slice(0, 10)}…
                          {row.transactionHash.slice(-8)}
                        </code>
                      </td>
                      <td>
                        <a
                          className={styles.tableLink}
                          href={row.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visible < filtered.length && (
              <div className={styles.loadMore}>
                <Button
                  variant="secondary"
                  onClick={() => setVisible((count) => count + PAGE_SIZE)}
                >
                  Load more
                </Button>
              </div>
            )}
          </>
        ) : live.connected && !live.error && !live.isLoading ? (
          <EmptyState
            title={
              agreement
                ? "No matching confirmed transactions"
                : "No confirmed events"
            }
            description="No confirmed AccordPay events match this wallet and the selected filters."
          />
        ) : null}
      </Stack>
    </Container>
  );
}
