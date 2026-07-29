import { Container, PageHeader, Stack } from "@/components/layout";
import { Alert, Button } from "@/components/ui";
import { EscrowReader } from "@/features/escrow";

export default async function AgreementsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <Container size="wide">
      <Stack gap={8}>
        <PageHeader
          eyebrow="Agreement workspace"
          title="Agreements"
          description="Read a deployed AccordPay escrow and perform only actions permitted to the connected role."
          showTestnetBadge
          primaryAction={<Button href="/app/create">Create escrow</Button>}
        />
        <Alert
          variant="info"
          title="Live GIWA Sepolia contract data"
          description="Escrows are read directly by numeric ID. Wallet-specific lists require event indexing and are not inferred or fabricated."
        />
        <EscrowReader key={id ?? "lookup"} initialId={id} />
      </Stack>
    </Container>
  );
}
