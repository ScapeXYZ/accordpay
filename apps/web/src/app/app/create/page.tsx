import { Container, PageHeader, Stack } from "@/components/layout";
import { Alert } from "@/components/ui";
import { CreateEscrowForm } from "@/features/escrow";

import styles from "../app-pages.module.css";

export default function CreateEscrowPage() {
  return (
    <Container>
      <Stack gap={8}>
        <PageHeader
          eyebrow="Agreement workspace"
          title="Create Escrow"
          description="Create and fund a native Test ETH escrow atomically on GIWA Sepolia."
          showTestnetBadge
        />
        <Alert
          variant="warning"
          title="GIWA Sepolia testnet"
          description="Test ETH has no monetary value. The deployed AccordPay contract is verified but has not been independently audited."
        />
        <ol className={styles.steps}>
          {["1. Agreement", "2. Payment", "3. Wallet", "4. Confirmation"].map(
            (step) => (
              <li key={step}>{step}</li>
            ),
          )}
        </ol>
        <CreateEscrowForm />
      </Stack>
    </Container>
  );
}
