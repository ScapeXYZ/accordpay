import { Container, PageHeader, Stack } from "@/components/layout";
import { Alert, Button, Input, Select, Textarea } from "@/components/ui";

import styles from "../app-pages.module.css";

export default function CreatePreviewPage() {
  return (
    <Container>
      <Stack gap={8}>
        <PageHeader
          eyebrow="Agreement workspace"
          title="Create Escrow"
          description="Preview of the future atomic escrow creation and funding flow."
          showTestnetBadge
        />
        <Alert
          variant="warning"
          title="Demonstration-only form"
          description="Wallet integration and escrow contracts are not active. This form cannot submit data."
        />
        <ol className={styles.steps}>
          {["1. Agreement", "2. Payment", "3. Review", "4. Confirmation"].map(
            (step) => (
              <li key={step}>{step}</li>
            ),
          )}
        </ol>
        <section className={styles.formPanel}>
          <Stack gap={6}>
            <div className={styles.formGrid}>
              <Input
                label="Seller wallet address"
                placeholder="Enter a GIWA-compatible address"
                required
              />
              <Input
                label="Agreement title"
                placeholder="Describe the agreement briefly"
                required
              />
              <Textarea
                className={styles.fullSpan}
                label="Description"
                helperText="Demonstration input; nothing is stored."
                required
              />
              <Input label="Delivery deadline" type="datetime-local" required />
              <Input label="Amount" type="number" suffix="Test ETH" required />
              <Select
                label="Asset"
                disabled
                defaultValue="eth"
                options={[{ label: "Test ETH", value: "eth" }]}
              />
            </div>
            <dl className={styles.paymentSummary}>
              <div>
                <dt>Escrow amount</dt>
                <dd>Not entered</dd>
              </div>
              <div>
                <dt>Protocol fee</dt>
                <dd>0 ETH</dd>
              </div>
              <div>
                <dt>Total deposit</dt>
                <dd>Not available</dd>
              </div>
            </dl>
            <Button disabled>Create escrow — integration unavailable</Button>
          </Stack>
        </section>
      </Stack>
    </Container>
  );
}
