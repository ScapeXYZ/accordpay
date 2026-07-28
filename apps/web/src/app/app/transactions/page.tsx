import { Container, PageHeader, Stack } from "@/components/layout";
import { Badge, Button, Input, Select } from "@/components/ui";

import styles from "../app-pages.module.css";

const events = [
  [
    "Created/Funded",
    "ACP-000001",
    "Buyer",
    "1.25 Test ETH",
    "completed",
    "Jul 28, 10:00",
  ],
  [
    "Delivered",
    "ACP-000002",
    "Seller",
    "0.80 Test ETH",
    "pending",
    "Jul 28, 11:30",
  ],
  [
    "Released",
    "ACP-000004",
    "Buyer",
    "0.45 Test ETH",
    "completed",
    "Jul 28, 12:15",
  ],
] as const;

export default function TransactionsPage() {
  return (
    <Container size="wide">
      <Stack gap={8}>
        <PageHeader
          eyebrow="Agreement workspace"
          title="Transactions"
          description="Transaction structure preview with no submitted hashes or explorer claims."
          showTestnetBadge
        />
        <p className={styles.disclosure}>
          Demonstration data — no transaction has been submitted.
        </p>
        <div className={styles.filters}>
          <Input label="Agreement ID" type="search" placeholder="ACP-000001" />
          <Select
            label="Event type"
            defaultValue="all"
            options={[{ label: "All events", value: "all" }]}
          />
          <Select
            label="Status"
            defaultValue="all"
            options={[{ label: "All statuses", value: "all" }]}
          />
        </div>
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
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map(([event, id, role, amount, status, time]) => (
                <tr key={`${event}-${id}`}>
                  <td>{event}</td>
                  <td>{id}</td>
                  <td>{role}</td>
                  <td>{amount}</td>
                  <td>
                    <Badge status={status} />
                  </td>
                  <td>
                    {time}
                    <br />
                    <small>Demonstration</small>
                  </td>
                  <td>Not submitted</td>
                  <td>
                    <Button variant="ghost" disabled>
                      Unavailable
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Stack>
    </Container>
  );
}
