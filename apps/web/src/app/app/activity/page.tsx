import { Container, PageHeader, Stack } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import { Badge, Button, Card } from "@/components/ui";

import styles from "../app-pages.module.css";

const items = [
  ["09:00", "Agreement created", "ACP-000001", "created"],
  ["09:01", "Funds locked", "ACP-000001", "funded"],
  ["11:30", "Delivery marked", "ACP-000002", "delivered"],
  ["12:15", "Funds released", "ACP-000004", "completed"],
  ["13:00", "Refund approved", "ACP-000005", "refunded"],
  ["14:20", "Dispute raised", "ACP-000006", "disputed"],
] as const;

export default function ActivityPage() {
  return (
    <Container>
      <Stack gap={8}>
        <PageHeader
          eyebrow="Agreement workspace"
          title="Activity"
          description="Chronological examples of intended escrow lifecycle events."
          showTestnetBadge
        />
        <p className={styles.disclosure}>
          Demonstration timeline — no live GIWA events.
        </p>
        <ol className={styles.timeline}>
          {items.map(([time, title, id, status]) => (
            <li key={`${time}-${id}`}>
              <time>{time} · Example</time>
              <span className={styles.timelineDot} />
              <div>
                <h3>{title}</h3>
                <p>{id} · Demonstration data only</p>
              </div>
              <Badge status={status} />
            </li>
          ))}
        </ol>
        <Card padding={false}>
          <EmptyState
            title="Empty activity example"
            description="The approved watermark appears only in this empty panel, never behind the timeline."
            secondaryAction={
              <Button variant="secondary" disabled>
                Refresh unavailable
              </Button>
            }
          />
        </Card>
      </Stack>
    </Container>
  );
}
