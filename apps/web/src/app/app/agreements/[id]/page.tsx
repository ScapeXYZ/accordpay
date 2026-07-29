import { Container, PageHeader, Stack } from "@/components/layout";
import { Alert, Button } from "@/components/ui";
import { EscrowReader } from "@/features/escrow";

export default async function EscrowDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Container size="wide">
      <Stack gap={8}>
        <PageHeader
          eyebrow="Live agreement"
          title={`Escrow ${id}`}
          description="On-chain escrow state read directly from the deployed AccordPay contract on GIWA Sepolia."
          breadcrumbs={[
            { label: "Agreements", href: "/app/agreements" },
            { label: `Escrow ${id}` },
          ]}
          showTestnetBadge
          secondaryAction={
            <Button variant="secondary" href="/app/agreements">
              All agreements
            </Button>
          }
        />
        <Alert
          variant="warning"
          title="GIWA Sepolia · unaudited contract"
          description="Test ETH has no monetary value. Confirm the escrow ID, wallet role, and contract action before signing."
        />
        <EscrowReader key={id} initialId={id} showTotal={false} />
      </Stack>
    </Container>
  );
}
