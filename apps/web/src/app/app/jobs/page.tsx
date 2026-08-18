import { JobsMarketplace } from "@/components/jobs/jobs-marketplace";
import { Container, PageHeader, Stack } from "@/components/layout";
import { Button } from "@/components/ui";

export default function JobsMarketplacePage() {
  return (
    <Container size="wide">
      <Stack gap={6}>
        <PageHeader
          eyebrow="Jobs & Services"
          title="Find work. Hire talent. Pay securely."
          description="Discover opportunities, contact clients, agree on terms, and prepare protected payments through AccordPay."
          primaryAction={<Button href="/app/jobs/post">Post a job</Button>}
          secondaryAction={
            <Button href="/app" variant="secondary">
              Service Hub
            </Button>
          }
        />
        <JobsMarketplace />
      </Stack>
    </Container>
  );
}
