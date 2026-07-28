import { Container, PageHeader, Stack } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import { Badge, Button, Card, Input, Select } from "@/components/ui";

import styles from "../app-pages.module.css";

const rows = [
  [
    "ACP-000001",
    "Brand identity delivery",
    "0x…demo",
    "Buyer",
    "1.25 Test ETH",
    "Aug 14",
    "created",
  ],
  [
    "ACP-000002",
    "Application prototype",
    "0x…demo",
    "Seller",
    "0.80 Test ETH",
    "Aug 18",
    "funded",
  ],
  [
    "ACP-000003",
    "Research engagement",
    "0x…demo",
    "Buyer",
    "2.00 Test ETH",
    "Aug 21",
    "delivered",
  ],
  [
    "ACP-000004",
    "Content package",
    "0x…demo",
    "Seller",
    "0.45 Test ETH",
    "Aug 28",
    "completed",
  ],
  [
    "ACP-000005",
    "Design consultation",
    "0x…demo",
    "Buyer",
    "0.20 Test ETH",
    "Sep 02",
    "refunded",
  ],
  [
    "ACP-000006",
    "Technical audit demo",
    "0x…demo",
    "Seller",
    "1.75 Test ETH",
    "Sep 05",
    "disputed",
  ],
  [
    "ACP-000007",
    "Editorial engagement",
    "0x…demo",
    "Buyer",
    "0.35 Test ETH",
    "Sep 10",
    "cancelled",
  ],
] as const;

export default function AgreementsPage() {
  return (
    <Container size="wide">
      <Stack gap={8}>
        <PageHeader
          eyebrow="Agreement workspace"
          title="Agreements"
          description="Search and compare clearly labelled demonstration agreements."
          showTestnetBadge
          primaryAction={<Button href="/app/create">Create escrow</Button>}
        />
        <p className={styles.disclosure}>
          Demonstration data only — no agreement shown here exists on GIWA
          Sepolia.
        </p>
        <div className={styles.filters}>
          <Input
            label="Search agreements"
            type="search"
            placeholder="Agreement ID or title"
          />
          <Select
            label="Status"
            placeholder="All statuses"
            defaultValue=""
            options={[
              { label: "Created", value: "created" },
              { label: "Funded", value: "funded" },
              { label: "Completed", value: "completed" },
            ]}
          />
          <Select
            label="Role"
            defaultValue="all"
            options={[
              { label: "All roles", value: "all" },
              { label: "Buyer", value: "buyer" },
              { label: "Seller", value: "seller" },
            ]}
          />
          <Select
            label="Sort"
            defaultValue="action"
            options={[
              { label: "Action required", value: "action" },
              { label: "Recently updated", value: "recent" },
            ]}
          />
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {[
                  "Agreement",
                  "Counterparty",
                  "Role",
                  "Amount",
                  "Deadline",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(
                ([id, title, counterparty, role, amount, deadline, status]) => (
                  <tr key={id}>
                    <td>
                      <strong>{id}</strong>
                      <br />
                      {title}
                    </td>
                    <td>
                      {counterparty}
                      <br />
                      <small>Demonstration</small>
                    </td>
                    <td>{role}</td>
                    <td>{amount}</td>
                    <td>{deadline}</td>
                    <td>
                      <Badge status={status} />
                    </td>
                    <td>
                      <Button variant="ghost" disabled>
                        View
                      </Button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.mobileCards}>
          {rows.map(([id, title, , role, amount, deadline, status]) => (
            <Card key={id}>
              <Badge status={status} />
              <h3>
                {id} — {title}
              </h3>
              <p>
                {role} · {amount} · Deadline {deadline}
              </p>
              <small>Demonstration agreement</small>
            </Card>
          ))}
        </div>
        <Card padding={false}>
          <EmptyState
            title="Empty-state example"
            description="No agreements match a future empty result. This approved watermark is not behind the table."
            primaryAction={<Button disabled>Create escrow</Button>}
          />
        </Card>
      </Stack>
    </Container>
  );
}
