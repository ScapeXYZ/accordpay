import { Container, Grid, PageHeader, Stack } from "@/components/layout";
import { WalletPlaceholder, WatermarkSurface } from "@/components/shared";
import { Web3Identity } from "@/components/shared/web3-identity";
import { Badge, Button, Card } from "@/components/ui";

import styles from "./app-pages.module.css";

const agreements = [
  [
    "ACP-000001",
    "Brand identity delivery",
    "Seller",
    "delivered",
    "1.25 Test ETH",
    "Aug 14, 2026",
    "0xFC1DC0f5C79a0a47E733476d61209E734a649094",
  ],
  [
    "ACP-000002",
    "Application prototype",
    "Buyer",
    "pending",
    "0.80 Test ETH",
    "Aug 18, 2026",
    "0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d",
  ],
  [
    "ACP-000003",
    "Research engagement",
    "Seller",
    "disputed",
    "2.00 Test ETH",
    "Aug 21, 2026",
    "0xFC1DC0f5C79a0a47E733476d61209E734a649094",
  ],
] as const;

export default function DashboardPage() {
  return (
    <Container size="wide">
      <Stack gap={8}>
        <PageHeader
          eyebrow="Agreement workspace"
          title="Dashboard"
          description="Live GIWA data is not connected. This shell demonstrates the intended operational hierarchy."
          showTestnetBadge
          primaryAction={<Button href="/app/create">Create escrow</Button>}
          secondaryAction={
            <Button href="/app/agreements" variant="secondary">
              View agreements
            </Button>
          }
        />
        <p className={styles.disclosure}>
          Demonstration data — no live wallet or blockchain connection
        </p>
        <section className={styles.walletPanel}>
          <div>
            <h2>Wallet disconnected</h2>
            <p>
              Wallet integration is not active yet. No address or balance is
              available.
            </p>
          </div>
          <WalletPlaceholder />
        </section>
        <Grid columns={4} gap={4}>
          {[
            [
              "3",
              "Agreements requiring action",
              "Items where this demonstration role must act",
            ],
            [
              "4",
              "Active demonstration escrows",
              "Non-terminal example agreements",
            ],
            [
              "12",
              "Completed demonstration escrows",
              "Released example agreements only",
            ],
            ["1", "Disputed demonstration escrows", "Frozen example agreement"],
          ].map(([value, label, definition]) => (
            <Card variant="interactive" className={styles.metric} key={label}>
              <span>Demonstration</span>
              <strong>{value}</strong>
              <p>{label}</p>
              <p>{definition}; not sourced from GIWA.</p>
            </Card>
          ))}
        </Grid>
        <Stack gap={4}>
          <h2 className={styles.sectionTitle}>Agreements requiring action</h2>
          <ul className={styles.agreementList}>
            {agreements.map(
              ([id, title, role, status, amount, deadline, counterparty]) => (
                <li className={styles.agreementItem} key={id}>
                  <div>
                    <h3>
                      {id} — {title}
                    </h3>
                    <p>
                      {role} role · Demonstration status · Deadline {deadline}
                    </p>
                    <Web3Identity
                      address={counterparty}
                      label="Counterparty identity (live name lookup)"
                    />
                  </div>
                  <Badge status={status}>
                    {status === "delivered"
                      ? "Buyer review required"
                      : status === "pending"
                        ? "Awaiting seller delivery"
                        : "Dispute demonstration"}
                  </Badge>
                  <span className={styles.amount}>{amount}</span>
                </li>
              ),
            )}
          </ul>
        </Stack>
        <Grid columns={2} gap={6}>
          <Card>
            <h2 className={styles.sectionTitle}>Recent activity</h2>
            <div className={styles.activityList}>
              {[
                "Escrow created · ACP-000003",
                "Delivery marked · ACP-000001",
                "Funds released · ACP-000009",
              ].map((event) => (
                <div className={styles.activityItem} key={event}>
                  <span />
                  <div>
                    <strong>{event}</strong>
                    <p>Demonstration event only</p>
                  </div>
                  <time>Example</time>
                </div>
              ))}
            </div>
          </Card>
          <WatermarkSurface
            position="bottom-right"
            variant="lockup"
            opacity={0.02}
            className={styles.quietPanel}
          >
            <div className={styles.quietContent}>
              <h2 className={styles.sectionTitle}>Quiet workspace</h2>
              <p>
                A full AccordPay lockup watermark is reserved for a future large
                empty-dashboard region. It never sits behind values or actions.
              </p>
            </div>
          </WatermarkSurface>
        </Grid>
      </Stack>
    </Container>
  );
}
