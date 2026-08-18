import { Container, Grid, PageHeader, Stack } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import { Alert, Badge, Card, Skeleton } from "@/components/ui";

export default function LiveDataReviewPage() {
  return (
    <Container size="wide">
      <Stack gap={8}>
        <PageHeader
          eyebrow="Private review route"
          title="Live data and theme states"
          description="Internal review fixtures only. No value on this page is represented as live contract data."
          showTestnetBadge
        />
        <Alert
          variant="warning"
          title="Review fixtures"
          description="Use the production dashboard and Transactions route for confirmed on-chain values."
        />
        <section aria-labelledby="theme-review">
          <Stack gap={4}>
            <h2 id="theme-review">Light and dark mode</h2>
            <p>
              Use the header theme control to review this surface in both modes.
              The selected mode persists across reloads.
            </p>
            <Grid columns={3} gap={4}>
              <Card>
                <Badge status="funded">Funded fixture</Badge>
                <h3>Dashboard card surface</h3>
                <p>Contrast and focus review only.</p>
              </Card>
              <Card variant="tinted">
                <Badge status="completed">Completed fixture</Badge>
                <h3>Transaction surface</h3>
                <p>Not an on-chain record.</p>
              </Card>
              <Card variant="elevated">
                <Badge status="disputed">Disputed fixture</Badge>
                <h3>Elevated surface</h3>
                <p>Not an on-chain record.</p>
              </Card>
            </Grid>
          </Stack>
        </section>
        <section aria-labelledby="system-states">
          <Stack gap={4}>
            <h2 id="system-states">Loading, empty, and RPC failure</h2>
            <Grid columns={3} gap={4}>
              <Skeleton variant="card" label="Review loading state" />
              <EmptyState
                title="No confirmed events"
                description="Review fixture for a successful empty response."
              />
              <Alert
                variant="error"
                title="GIWA data unavailable"
                description="Review fixture for an RPC failure. No fallback data is displayed."
              />
            </Grid>
          </Stack>
        </section>
      </Stack>
    </Container>
  );
}
