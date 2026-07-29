"use client";

import { Container, Grid, Stack } from "@/components/layout";
import {
  BrandLockup,
  NetworkIndicator,
  WalletPlaceholder,
  WatermarkSurface,
} from "@/components/shared";
import { Button, Card } from "@/components/ui";
import {
  AppHeader,
  AppSidebar,
  AvatarPlaceholder,
  MobileNavigation,
  NotificationPanel,
} from "@/components/app-shell";

import styles from "./page.module.css";

export default function AppShellReviewPage() {
  return (
    <main className={styles.page}>
      <Container size="wide">
        <Stack gap={10}>
          <header className={styles.intro}>
            <p>Internal application-shell review — demonstration data only</p>
            <h1>Responsive shell states</h1>
          </header>
          <Review title="Expanded desktop sidebar">
            <div className={styles.sidebarFrame}>
              <AppSidebar collapsed={false} onToggle={() => undefined} />
            </div>
          </Review>
          <Review title="Collapsed desktop sidebar">
            <div className={`${styles.sidebarFrame} ${styles.collapsedFrame}`}>
              <AppSidebar collapsed onToggle={() => undefined} />
            </div>
          </Review>
          <Review title="Tablet header and navigation disclosure">
            <div className={styles.headerFrame}>
              <AppHeader menuOpen onMenuToggle={() => undefined} />
              <MobileNavigation menuOpen onNavigate={() => undefined} />
            </div>
          </Review>
          <Review title="Mobile header and bottom navigation">
            <div className={`${styles.headerFrame} ${styles.mobileFrame}`}>
              <AppHeader menuOpen={false} onMenuToggle={() => undefined} />
              <MobileNavigation menuOpen={false} onNavigate={() => undefined} />
            </div>
          </Review>
          <Review title="Header placeholders and context">
            <Card>
              <Grid columns={4} gap={4}>
                <NetworkIndicator />
                <NotificationPanel />
                <AvatarPlaceholder />
                <WalletPlaceholder />
              </Grid>
              <p className={styles.note}>
                Breadcrumbs and active navigation use visible labels and
                aria-current. No notification count, user profile, address, or
                balance is implied.
              </p>
            </Card>
          </Review>
          <Review title="Dashboard watermark examples">
            <Grid columns={2} gap={4}>
              <WatermarkSurface className={styles.watermarkPanel}>
                <div>
                  <strong>A3 icon watermark</strong>
                  <p>Quiet empty region only.</p>
                </div>
              </WatermarkSurface>
              <WatermarkSurface
                variant="lockup"
                opacity={0.02}
                position="bottom-right"
                className={styles.watermarkPanel}
              >
                <div>
                  <strong>Full AccordPay lockup watermark</strong>
                  <p>Large, quiet surface with live decorative text.</p>
                </div>
              </WatermarkSurface>
            </Grid>
          </Review>
          <Review title="Prohibited watermark placement guidance">
            <Card variant="tinted">
              <p className={styles.note}>
                Never place a watermark behind forms, wallet information,
                balances, alerts, dense tables, transaction values, contract
                addresses, or primary actions.
              </p>
            </Card>
          </Review>
          <Review title="Interactive card hover elevation">
            <Grid columns={2} gap={4}>
              <Card>
                <BrandLockup variant="compact" />
                <p className={styles.note}>Standard cards remain still.</p>
              </Card>
              <Card variant="interactive">
                <BrandLockup variant="compact" />
                <p className={styles.note}>
                  Hover: restrained 1px rise and neutral Level 2 shadow.
                </p>
                <Button variant="secondary">Focusable action</Button>
              </Card>
            </Grid>
          </Review>
        </Stack>
      </Container>
    </main>
  );
}

function Review({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.review}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
