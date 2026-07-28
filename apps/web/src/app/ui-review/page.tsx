import type { Metadata } from "next";

import {
  Container,
  Divider,
  Grid,
  Inline,
  PageHeader,
  Stack,
  VisuallyHidden,
} from "@/components/layout";
import {
  BrandLockup,
  EmptyState,
  NetworkIndicator,
  WalletPlaceholder,
  WatermarkSurface,
} from "@/components/shared";
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmationDialog,
  Input,
  Select,
  Skeleton,
  Spinner,
  Textarea,
} from "@/components/ui";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "UI Component Review | AccordPay",
  description: "Private review surface for AccordPay product UI components.",
  robots: {
    index: false,
    follow: false,
  },
};

const statuses = [
  "created",
  "funded",
  "delivered",
  "completed",
  "refunded",
  "disputed",
  "cancelled",
  "pending",
  "testnet",
] as const;

export default function UiReviewPage() {
  return (
    <main className={styles.page}>
      <Container size="wide">
        <Stack gap={12}>
          <header className={styles.intro}>
            <p>Internal component review — demonstration data only</p>
            <h1>AccordPay UI foundation</h1>
            <span>
              Static examples below do not represent live wallets, balances,
              agreements, or blockchain activity.
            </span>
          </header>

          <ReviewSection
            number="01"
            title="Brand and product context"
            description="Approved identity, network attribution, and disconnected-wallet presentation."
          >
            <Grid columns={2} gap={6}>
              <Card>
                <Stack gap={6}>
                  <BrandLockup />
                  <BrandLockup variant="compact" />
                  <NetworkIndicator />
                  <WalletPlaceholder />
                </Stack>
              </Card>
              <div className={styles.darkDemo}>
                <BrandLockup surface="dark" />
                <p>Deep-pine surface example</p>
              </div>
            </Grid>
          </ReviewSection>

          <ReviewSection
            number="02"
            title="Buttons"
            description="Action hierarchy across default, disabled, loading, button, and safe-link rendering."
          >
            <Card>
              <Inline gap={3}>
                <Button>Primary action</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button disabled>Disabled</Button>
                <Button loading loadingText="Confirming">
                  Confirm
                </Button>
                <Button href="#forms" variant="secondary">
                  Link action
                </Button>
              </Inline>
            </Card>
          </ReviewSection>

          <ReviewSection
            number="03"
            title="Form controls"
            description="Native and labelled controls with helper, error, affix, disabled, and read-only states."
          >
            <Grid columns={2} gap={6}>
              <Input
                label="Agreement title"
                helperText="Use a recognizable reference for both parties."
                placeholder="Website delivery"
                required
              />
              <Input
                label="Escrow amount"
                type="number"
                prefix="Ξ"
                suffix="Test ETH"
                defaultValue="1.25"
                readOnly
              />
              <Input
                label="Search escrows"
                type="search"
                helperText="Demo search field."
                placeholder="ACP-000001"
              />
              <Input
                label="Delivery deadline"
                type="datetime-local"
                error="Choose a future date and time."
                defaultValue="2026-07-01T09:00"
              />
              <Input
                label="Seller address"
                error="Enter a valid seller wallet address."
                defaultValue="0x123"
              />
              <Input label="Network" defaultValue="GIWA Sepolia" disabled />
              <Textarea
                label="Agreement description"
                helperText="Describe the expected delivery."
                maxLength={500}
                defaultValue="Demonstration agreement content only."
                showCharacterCount
              />
              <Textarea
                label="Delivery notes"
                error="Delivery notes are required for this demonstration."
                disabled
              />
              <Select
                label="Agreement role"
                helperText="Native select control."
                placeholder="Choose a role"
                defaultValue=""
                options={[
                  { label: "Buyer", value: "buyer" },
                  { label: "Seller", value: "seller" },
                ]}
              />
              <Select
                label="Supported asset"
                disabled
                defaultValue="eth"
                options={[{ label: "Test ETH", value: "eth" }]}
              />
            </Grid>
          </ReviewSection>

          <ReviewSection
            number="04"
            title="Cards and badges"
            description="Restrained surfaces and explicit text-labelled agreement states."
          >
            <Grid columns={4} gap={4}>
              <Card>
                <CardExample title="Standard card" />
              </Card>
              <Card variant="interactive">
                <CardExample title="Interactive card" />
              </Card>
              <Card variant="elevated">
                <CardExample title="Elevated card" />
              </Card>
              <Card variant="tinted">
                <CardExample title="Tinted card" />
              </Card>
            </Grid>
            <Card>
              <Inline gap={3}>
                {statuses.map((status) => (
                  <Badge status={status} key={status} />
                ))}
              </Inline>
            </Card>
          </ReviewSection>

          <ReviewSection
            number="05"
            title="Alerts"
            description="System feedback combines semantic colour with explicit titles and descriptions."
          >
            <Stack gap={4}>
              <Alert
                title="Network information"
                description="This demonstration is configured for GIWA Sepolia."
              />
              <Alert
                variant="success"
                title="Transaction confirmed"
                description="Demonstration state only. No transaction was submitted."
              />
              <Alert
                variant="warning"
                title="Awaiting seller delivery"
                description="The displayed agreement is demonstration data."
                action={
                  <Button variant="ghost" href="#dialogs">
                    Review
                  </Button>
                }
              />
              <Alert
                variant="error"
                title="Transaction failed"
                description="No funds moved in this demonstration."
              />
            </Stack>
          </ReviewSection>

          <ReviewSection
            number="06"
            title="Loading and empty states"
            description="Motion is restrained, reduced-motion aware, and never implies a result before confirmation."
          >
            <Grid columns={2} gap={6}>
              <Card>
                <Stack gap={5}>
                  <Inline>
                    <Spinner size="small" label="Small loading example" />
                    <Spinner label="Medium loading example" />
                    <Spinner size="large" label="Large loading example" />
                  </Inline>
                  <Skeleton />
                  <Skeleton variant="table-row" />
                  <Skeleton variant="card" />
                </Stack>
              </Card>
              <Card padding={false}>
                <EmptyState
                  title="No demonstration escrows"
                  description="Create Escrow is not implemented. This example shows the approved empty-state structure."
                  primaryAction={<Button disabled>Create escrow</Button>}
                  secondaryAction={
                    <Button variant="secondary" href="#watermarks">
                      Review watermark
                    </Button>
                  }
                />
              </Card>
            </Grid>
          </ReviewSection>

          <ReviewSection
            number="07"
            title="Confirmation dialog"
            description="Native modal-dialog behavior provides Escape handling, focus containment, inert background, and trigger-focus restoration."
          >
            <Card>
              <Inline>
                <ConfirmationDialog
                  triggerLabel="Open confirmation"
                  title="Confirm demonstration action?"
                  description="This review action does not submit a transaction or change product data."
                  confirmLabel="Confirm"
                />
                <ConfirmationDialog
                  destructive
                  triggerLabel="Open destructive dialog"
                  title="Cancel demonstration agreement?"
                  description="This is component-review content only. No agreement exists."
                  confirmLabel="Cancel agreement"
                />
              </Inline>
            </Card>
          </ReviewSection>

          <ReviewSection
            number="08"
            title="Page header"
            description="Responsive hierarchy for breadcrumbs, context, testnet disclosure, and actions."
          >
            <Card>
              <PageHeader
                eyebrow="Agreement workspace"
                title="Demonstration escrow"
                description="Clearly labelled example content; not a live agreement."
                breadcrumbs={[
                  { label: "Escrows", href: "#page-header" },
                  { label: "ACP-000001" },
                ]}
                showTestnetBadge
                secondaryAction={
                  <Button variant="secondary">Secondary action</Button>
                }
                primaryAction={<Button>Primary action</Button>}
              />
            </Card>
          </ReviewSection>

          <ReviewSection
            number="09"
            title="Watermark surfaces"
            description="Decorative A3 artwork is clamped to 2–5% opacity and remains outside semantic content."
          >
            <Grid columns={3} gap={4}>
              {(["top-right", "bottom-right", "centered"] as const).map(
                (position) => (
                  <WatermarkSurface
                    position={position}
                    className={styles.watermarkDemo}
                    key={position}
                  >
                    <div>
                      <strong>{position.replace("-", " ")}</strong>
                      <p>
                        Approved decorative use on quiet, spacious surfaces.
                      </p>
                    </div>
                  </WatermarkSurface>
                ),
              )}
            </Grid>
            <Alert
              variant="warning"
              title="Prohibited watermark placements"
              description="Do not place the watermark behind forms, dense tables, transaction amounts, alerts, or other high-attention financial content."
            />
          </ReviewSection>

          <ReviewSection
            number="10"
            title="Layout primitives"
            description="Simple container, stack, inline, grid, divider, and visually hidden utilities."
          >
            <Card>
              <Stack gap={6}>
                <Inline gap={3}>
                  <Badge status="testnet" />
                  <span>Inline aligns related content.</span>
                </Inline>
                <Divider />
                <Grid columns={3}>
                  <div className={styles.primitiveCell}>Grid one</div>
                  <div className={styles.primitiveCell}>Grid two</div>
                  <div className={styles.primitiveCell}>Grid three</div>
                </Grid>
                <VisuallyHidden>
                  This text is available to assistive technology.
                </VisuallyHidden>
              </Stack>
            </Card>
          </ReviewSection>
        </Stack>
      </Container>
    </main>
  );
}

function ReviewSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <header>
        <span>{number}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      <Stack gap={4}>{children}</Stack>
    </section>
  );
}

function CardExample({ title }: { title: string }) {
  return (
    <Stack gap={3}>
      <Badge status="funded" />
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardCopy}>
        ACP-000001 · 1.25 Test ETH · Demonstration data
      </p>
    </Stack>
  );
}
