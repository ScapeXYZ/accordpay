import { Container } from "@/components/layout";
import { BrandLockup, WatermarkSurface } from "@/components/shared";
import { Badge, Button, Card } from "@/components/ui";
import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";

import styles from "./home.module.css";

const flow = [
  {
    number: "01",
    title: "Define the agreement",
    copy: "Set the seller, delivery deadline, Test ETH amount, and a public metadata reference.",
  },
  {
    number: "02",
    title: "Fund in one transaction",
    copy: "Creation and funding happen atomically. The contract records the agreement and locks the exact deposit.",
  },
  {
    number: "03",
    title: "Settle with clear roles",
    copy: "The seller marks delivery. The buyer releases funds, or either party can use the documented refund and dispute paths.",
  },
] as const;

const protections = [
  {
    eyebrow: "For buyers",
    title: "Release after delivery",
    copy: "Funds remain in the escrow contract until delivery is marked and the buyer authorizes release, or another permitted terminal path completes.",
  },
  {
    eyebrow: "For sellers",
    title: "Funded before work begins",
    copy: "Every on-chain agreement is funded when it is created, so there is no unfunded Created state to mistake for a deposit.",
  },
  {
    eyebrow: "For both parties",
    title: "Exact, inspectable state",
    copy: "Agreement status, parties, amount, deadline, and transaction evidence remain readable from GIWA Sepolia.",
  },
] as const;

export default function Home() {
  const explorerContractUrl = `${giwaSepolia.blockExplorers.default.url}/address/${accordPayEscrowContract.address}`;

  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>

      <header className={styles.header}>
        <Container size="wide" className={styles.headerInner}>
          <Link
            className={styles.brandLink}
            href="/"
            aria-label="AccordPay home"
          >
            <BrandLockup variant="compact" />
          </Link>
          <nav className={styles.navigation} aria-label="Primary navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#protection">Protection</a>
            <a href="#infrastructure">Infrastructure</a>
          </nav>
          <Button href="/app">Launch App</Button>
        </Container>
      </header>

      <section className={styles.hero} id="main-content">
        <Container size="wide">
          <WatermarkSurface
            className={styles.heroSurface}
            position="top-right"
            opacity={0.03}
          >
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <div className={styles.heroLabels}>
                  <Badge status="testnet">GIWA Sepolia testnet</Badge>
                  <span>Built on GIWA</span>
                </div>
                <p className={styles.eyebrow}>Verified escrow infrastructure</p>
                <h1>Secure every agreement.</h1>
                <p className={styles.heroLead}>
                  AccordPay gives buyers and sellers a clear, programmable
                  escrow workflow for funded agreements, delivery, release,
                  refunds, and disputes on GIWA Sepolia.
                </p>
                <div className={styles.heroActions}>
                  <Button href="/app/create">Create Escrow</Button>
                  <Button href="/app/agreements" variant="secondary">
                    View Agreements
                  </Button>
                </div>
                <p className={styles.testnetNote}>
                  GIWA Sepolia Test ETH has no monetary value. The AccordPay
                  contract has not been independently audited.
                </p>
              </div>

              <Card variant="elevated" className={styles.agreementPreview}>
                <div className={styles.previewHeader}>
                  <div>
                    <span>Agreement lifecycle</span>
                    <strong>Controlled settlement</strong>
                  </div>
                  <Badge status="funded">Funded</Badge>
                </div>
                <dl className={styles.previewDetails}>
                  <div>
                    <dt>Network</dt>
                    <dd>GIWA Sepolia</dd>
                  </div>
                  <div>
                    <dt>Asset</dt>
                    <dd>Test ETH</dd>
                  </div>
                  <div>
                    <dt>Protocol fee</dt>
                    <dd>0 ETH</dd>
                  </div>
                </dl>
                <ol className={styles.previewTimeline}>
                  <li className={styles.complete}>Created and funded</li>
                  <li>Delivery marked</li>
                  <li>Buyer release</li>
                </ol>
                <p>
                  Preview only. Live agreement data appears inside the
                  application after an escrow is selected.
                </p>
              </Card>
            </div>
          </WatermarkSurface>
        </Container>
      </section>

      <section className={styles.trustStrip} aria-label="Platform disclosures">
        <Container size="wide" className={styles.trustGrid}>
          <div>
            <strong>Verified contract source</strong>
            <span>Published on GIWA Explorer</span>
          </div>
          <div>
            <strong>Atomic funding</strong>
            <span>Agreement and deposit in one transaction</span>
          </div>
          <div>
            <strong>Canonical wallet identity</strong>
            <span>UP ID and Dojang shown independently</span>
          </div>
          <div>
            <strong>0% MVP protocol fee</strong>
            <span>No testnet fee collected</span>
          </div>
        </Container>
      </section>

      <section className={styles.section} id="how-it-works">
        <Container size="wide">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>How AccordPay works</p>
            <h2>A deliberate path from agreement to settlement.</h2>
            <p>
              Each stage has a defined actor, contract state, and transaction
              outcome—without hiding the network or financial conditions.
            </p>
          </div>
          <div className={styles.flowGrid}>
            {flow.map((step) => (
              <Card key={step.number} className={styles.flowCard}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className={`${styles.section} ${styles.tinted}`} id="protection">
        <Container size="wide">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Balanced protection</p>
            <h2>Designed around the agreement, not speculation.</h2>
            <p>
              AccordPay avoids trading imagery and vanity metrics. The product
              focuses on the parties, their obligations, and the next permitted
              action.
            </p>
          </div>
          <div className={styles.protectionGrid}>
            {protections.map((item) => (
              <Card key={item.eyebrow} variant="interactive">
                <span className={styles.cardEyebrow}>{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.section} id="infrastructure">
        <Container size="wide">
          <div className={styles.infrastructureGrid}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>GIWA-native infrastructure</p>
              <h2>Identity context without replacing wallet ownership.</h2>
              <p>
                AccordPay resolves confirmed Upbit Web3 Names and reads GIWA
                Dojang verification on-chain. The wallet address remains the
                canonical identity stored by the escrow contract.
              </p>
              <Button href="/app" variant="secondary">
                Open the workspace
              </Button>
            </div>
            <Card variant="tinted" className={styles.contractCard}>
              <span className={styles.cardEyebrow}>
                Verified escrow smart contract
              </span>
              <h3>AccordPayEscrow</h3>
              <code>{accordPayEscrowContract.address}</code>
              <ul>
                <li>Network: GIWA Sepolia · Chain ID 91342</li>
                <li>Native asset: Test ETH</li>
                <li>Source verified on GIWA Explorer</li>
                <li>Not independently audited</li>
              </ul>
              <Button
                href={explorerContractUrl}
                target="_blank"
                variant="ghost"
              >
                View verified contract
              </Button>
            </Card>
          </div>
        </Container>
      </section>

      <section className={styles.securitySection}>
        <Container size="wide">
          <WatermarkSurface
            className={styles.securitySurface}
            variant="lockup"
            position="bottom-right"
            opacity={0.02}
          >
            <div className={styles.securityContent}>
              <div>
                <p className={styles.eyebrow}>Transparent by design</p>
                <h2>Testnet infrastructure with explicit limitations.</h2>
              </div>
              <ul>
                <li>No owner withdrawal path for active escrow funds</li>
                <li>Role-aware lifecycle actions and terminal states</li>
                <li>Clear transaction confirmation and failure states</li>
                <li>No claim of audit or financial guarantee</li>
              </ul>
            </div>
          </WatermarkSurface>
        </Container>
      </section>

      <section className={styles.finalCta}>
        <Container size="wide" className={styles.finalCtaInner}>
          <div>
            <p className={styles.eyebrow}>Agreement infrastructure</p>
            <h2>Start with a clear, funded agreement.</h2>
            <p>
              Connect a compatible wallet inside the application and review
              every Test ETH condition before signing.
            </p>
          </div>
          <div className={styles.heroActions}>
            <Button href="/app/create">Create Escrow</Button>
            <Button href="/app/agreements" variant="secondary">
              View Agreements
            </Button>
          </div>
        </Container>
      </section>

      <footer className={styles.footer}>
        <Container size="wide" className={styles.footerInner}>
          <BrandLockup variant="compact" />
          <p>
            Independent product built on GIWA. GIWA Sepolia Test ETH has no
            monetary value. Contract not independently audited.
          </p>
          <nav aria-label="Footer navigation">
            <Link href="/app">Launch App</Link>
            <Link href="/app/create">Create Escrow</Link>
            <Link href="/app/agreements">Agreements</Link>
          </nav>
        </Container>
      </footer>
    </main>
  );
}
import Link from "next/link";
