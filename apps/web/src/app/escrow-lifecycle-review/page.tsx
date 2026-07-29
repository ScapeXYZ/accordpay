import { Container, PageHeader, Stack } from "@/components/layout";
import { LifecycleReview } from "@/features/escrow";

export default function EscrowLifecycleReviewPage() {
  return (
    <main>
      <Container size="wide">
        <Stack gap={8}>
          <PageHeader
            eyebrow="Internal validation"
            title="Escrow lifecycle review"
            description="Private live-data review of the deployed AccordPayEscrow contract on GIWA Sepolia."
            showTestnetBadge
          />
          <LifecycleReview />
        </Stack>
      </Container>
    </main>
  );
}
