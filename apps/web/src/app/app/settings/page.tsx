import { Container, PageHeader, Stack } from "@/components/layout";
import { NetworkIndicator, WalletPlaceholder } from "@/components/shared";
import { Alert, Button, Select } from "@/components/ui";
import { StepUpSecurity } from "@/components/deal-room";

import styles from "../app-pages.module.css";

export default function SettingsPage() {
  return (
    <Container>
      <Stack gap={8}>
        <PageHeader
          eyebrow="Application preferences"
          title="Settings"
          description="MVP connection and display preferences without an account profile."
          showTestnetBadge
        />
        <Alert
          title="No account authentication"
          description="AccordPay does not provide email, password, profile, or custodial-account functionality in this preview."
        />
        <div className={styles.settingsGrid}>
          <section className={styles.settingsSection}>
            <h2>Connected wallet</h2>
            <p>No wallet is connected and no identity is implied.</p>
            <div style={{ marginTop: "var(--space-5)" }}>
              <WalletPlaceholder />
            </div>
            <div style={{ marginTop: "var(--space-4)" }}>
              <Button variant="secondary" disabled>
                Disconnect wallet
              </Button>
            </div>
          </section>
          <section className={styles.settingsSection}>
            <h2>Network information</h2>
            <p>Static approved testnet configuration.</p>
            <div style={{ marginTop: "var(--space-5)" }}>
              <NetworkIndicator />
            </div>
            <dl className={styles.definition}>
              <div>
                <dt>Chain ID</dt>
                <dd>91342</dd>
              </div>
              <div>
                <dt>Native asset</dt>
                <dd>Test ETH</dd>
              </div>
              <div>
                <dt>Value</dt>
                <dd>No real monetary value</dd>
              </div>
            </dl>
          </section>
          <section className={styles.settingsSection}>
            <h2>Display preference preview</h2>
            <p>Light mode is the only MVP theme.</p>
            <Select
              label="Appearance"
              disabled
              defaultValue="light"
              options={[{ label: "Light", value: "light" }]}
            />
          </section>
          <section className={styles.settingsSection}>
            <h2>Notifications</h2>
            <p>
              Notification preferences are future scope. No delivery channel is
              active.
            </p>
            <Button variant="secondary" disabled>
              Configure notifications
            </Button>
          </section>
          <section className={styles.settingsSection}>
            <StepUpSecurity />
          </section>
        </div>
      </Stack>
    </Container>
  );
}
