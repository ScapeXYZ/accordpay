import type { Metadata } from "next";
import Image from "next/image";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Brand Guidelines | AccordPay",
  description:
    "The official AccordPay identity, colour, typography, and product-interface system.",
  robots: {
    index: false,
    follow: false,
  },
};

const colours = [
  {
    group: "Primary",
    name: "Pine 800",
    hex: "#0F493A",
    rgb: "15, 73, 58",
    variable: "--color-pine-800",
  },
  {
    group: "Primary",
    name: "Pine 600",
    hex: "#18745C",
    rgb: "24, 116, 92",
    variable: "--color-pine-600",
  },
  {
    group: "Secondary",
    name: "Pine 100",
    hex: "#DDEFE8",
    rgb: "221, 239, 232",
    variable: "--color-pine-100",
  },
  {
    group: "Secondary",
    name: "Pine 50",
    hex: "#F0F8F5",
    rgb: "240, 248, 245",
    variable: "--color-pine-50",
  },
  {
    group: "Success",
    name: "Success 700",
    hex: "#197044",
    rgb: "25, 112, 68",
    variable: "--color-success-700",
  },
  {
    group: "Success",
    name: "Success 50",
    hex: "#ECF8F1",
    rgb: "236, 248, 241",
    variable: "--color-success-50",
  },
  {
    group: "Warning",
    name: "Warning 700",
    hex: "#8A5600",
    rgb: "138, 86, 0",
    variable: "--color-warning-700",
  },
  {
    group: "Warning",
    name: "Warning 50",
    hex: "#FFF7E6",
    rgb: "255, 247, 230",
    variable: "--color-warning-50",
  },
  {
    group: "Error",
    name: "Error 700",
    hex: "#A33434",
    rgb: "163, 52, 52",
    variable: "--color-error-700",
  },
  {
    group: "Error",
    name: "Error 50",
    hex: "#FFF0F0",
    rgb: "255, 240, 240",
    variable: "--color-error-50",
  },
  {
    group: "Neutral",
    name: "Ink 950",
    hex: "#101815",
    rgb: "16, 24, 21",
    variable: "--color-ink-950",
  },
  {
    group: "Neutral",
    name: "Ink 700",
    hex: "#34433E",
    rgb: "52, 67, 62",
    variable: "--color-ink-700",
  },
  {
    group: "Neutral",
    name: "Ink 600",
    hex: "#52615C",
    rgb: "82, 97, 92",
    variable: "--color-ink-600",
  },
  {
    group: "Neutral",
    name: "Ink 500",
    hex: "#6C7975",
    rgb: "108, 121, 117",
    variable: "--color-ink-500",
  },
  {
    group: "Neutral",
    name: "Ink 300",
    hex: "#A9B3AF",
    rgb: "169, 179, 175",
    variable: "--color-ink-300",
  },
  {
    group: "Neutral",
    name: "Ink 200",
    hex: "#CDD5D2",
    rgb: "205, 213, 210",
    variable: "--color-ink-200",
  },
  {
    group: "Neutral",
    name: "Ink 100",
    hex: "#E5EAE8",
    rgb: "229, 234, 232",
    variable: "--color-ink-100",
  },
  {
    group: "Background",
    name: "Canvas",
    hex: "#F4F6F5",
    rgb: "244, 246, 245",
    variable: "--color-ink-50",
  },
  {
    group: "Background",
    name: "Surface",
    hex: "#FFFFFF",
    rgb: "255, 255, 255",
    variable: "--color-white",
  },
] as const;

const typeScale = [
  ["Display", "48px", "56px", "650", "Product-level statements"],
  ["Heading 1", "36px", "44px", "650", "Primary page title"],
  ["Heading 2", "28px", "36px", "650", "Major section"],
  ["Heading 3", "22px", "30px", "600", "Card and subsection"],
  ["Body large", "18px", "28px", "400", "Introductory copy"],
  ["Body", "16px", "24px", "400", "Default interface copy"],
  ["Body small", "14px", "20px", "400", "Supporting information"],
  ["Label", "14px", "20px", "600", "Controls and fields"],
  ["Caption", "12px", "16px", "500", "Metadata and status"],
] as const;

const spacing = [
  ["1", "4px", "Optical correction"],
  ["2", "8px", "Tight relationships"],
  ["3", "12px", "Compact controls"],
  ["4", "16px", "Default component gap"],
  ["5", "20px", "Control groups"],
  ["6", "24px", "Card padding"],
  ["8", "32px", "Related sections"],
  ["10", "40px", "Page regions"],
  ["12", "48px", "Standard sections"],
  ["16", "64px", "Large rhythm"],
  ["20", "80px", "Major separation"],
  ["24", "96px", "Editorial space"],
] as const;

const radii = [
  ["None", "0", "Tables and edge-aligned structures"],
  ["Small", "6px", "Tags and compact controls"],
  ["Medium", "10px", "Inputs and buttons"],
  ["Large", "14px", "Cards"],
  ["Extra large", "20px", "Major panels"],
  ["Full", "999px", "Pills and circles"],
] as const;

const navItems = [
  "Logo",
  "Colour",
  "Typography",
  "Components",
  "Foundations",
] as const;

function Watermark() {
  return (
    <Image
      className={styles.watermark}
      src="/brand/logo-icon-light.svg"
      alt=""
      width={320}
      height={320}
      aria-hidden="true"
      unoptimized
    />
  );
}

export default function BrandGuidelinesPage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <a
          className={styles.brand}
          href="#overview"
          aria-label="AccordPay brand guidelines"
        >
          <Image
            src="/brand/logo-icon.svg"
            alt=""
            width={28}
            height={28}
            aria-hidden="true"
            unoptimized
          />
          <span>AccordPay</span>
          <span className={styles.divider} aria-hidden="true" />
          <span className={styles.guideLabel}>Brand system</span>
        </a>
        <span className={styles.version}>Version 1.0 · July 2026</span>
      </header>

      <div className={styles.shell}>
        <aside className={styles.sidebar} aria-label="Guideline sections">
          <p className={styles.navLabel}>Foundations</p>
          <nav>
            {navItems.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}>
                {item}
              </a>
            ))}
          </nav>
          <div className={styles.sidebarNote}>
            <Image
              src="/brand/logo-icon-light.svg"
              alt=""
              width={28}
              height={28}
              aria-hidden="true"
              unoptimized
            />
            <p>Approved mark</p>
            <span>A3 — Controlled Release</span>
          </div>
        </aside>

        <div className={styles.content}>
          <section id="overview" className={`${styles.hero} ${styles.section}`}>
            <Watermark />
            <p className={styles.eyebrow}>AccordPay identity system</p>
            <h1>Clarity for every agreement.</h1>
            <p className={styles.lead}>
              A precise visual system for verified escrow and programmable
              commerce infrastructure. Calm enough for consequential decisions,
              distinctive enough to be remembered.
            </p>
            <div className={styles.heroMark}>
              <Image
                src="/brand/logo-icon.svg"
                alt="AccordPay A3 — Controlled Release logo"
                width={136}
                height={136}
                priority
                unoptimized
              />
              <div>
                <strong>A3 — Controlled Release</strong>
                <span>Approved July 28, 2026</span>
              </div>
            </div>
          </section>

          <section id="logo" className={styles.section}>
            <Watermark />
            <SectionHeading
              number="01"
              title="Logo"
              copy="Two independent paths frame protected value and resolve through a controlled release channel. The icon remains separate from the accessible live-text product name."
            />

            <div className={styles.logoGrid}>
              <LogoPanel
                label="Horizontal lockup"
                className={styles.lightPanel}
              >
                <div className={styles.horizontalLockup}>
                  <Image
                    src="/brand/logo-icon.svg"
                    alt=""
                    width={56}
                    height={56}
                    aria-hidden="true"
                    unoptimized
                  />
                  <span>AccordPay</span>
                </div>
              </LogoPanel>
              <LogoPanel label="Vertical lockup" className={styles.lightPanel}>
                <div className={styles.verticalLockup}>
                  <Image
                    src="/brand/logo-icon.svg"
                    alt=""
                    width={72}
                    height={72}
                    aria-hidden="true"
                    unoptimized
                  />
                  <span>AccordPay</span>
                </div>
              </LogoPanel>
              <LogoPanel label="Icon only" className={styles.lightPanel}>
                <Image
                  src="/brand/logo-icon.svg"
                  alt="AccordPay icon"
                  width={88}
                  height={88}
                  unoptimized
                />
              </LogoPanel>
              <LogoPanel label="Monochrome" className={styles.lightPanel}>
                <Image
                  src="/brand/logo-monochrome.svg"
                  alt="AccordPay monochrome icon"
                  width={88}
                  height={88}
                  unoptimized
                />
              </LogoPanel>
              <LogoPanel
                label="Dark-surface version"
                className={styles.darkPanel}
              >
                <Image
                  src="/brand/logo-icon-dark.svg"
                  alt="AccordPay inverse icon"
                  width={88}
                  height={88}
                  unoptimized
                />
              </LogoPanel>
              <LogoPanel
                label="Light-surface version"
                className={styles.softPanel}
              >
                <Image
                  src="/brand/logo-icon-light.svg"
                  alt="AccordPay deep-pine icon"
                  width={88}
                  height={88}
                  unoptimized
                />
              </LogoPanel>
            </div>

            <div className={styles.twoColumn}>
              <div className={styles.specBlock}>
                <p className={styles.overline}>Minimum size</p>
                <div className={styles.minimumSizes}>
                  {[16, 24, 32, 48].map((size) => (
                    <figure key={size}>
                      <Image
                        src="/brand/favicon.svg"
                        alt={`AccordPay favicon at ${size} pixels`}
                        width={size}
                        height={size}
                        unoptimized
                      />
                      <figcaption>{size}px</figcaption>
                    </figure>
                  ))}
                </div>
                <p className={styles.supporting}>
                  Use the icon alone below 120px lockup width. The favicon is
                  approved down to 16px.
                </p>
              </div>
              <div className={styles.specBlock}>
                <p className={styles.overline}>Safe spacing</p>
                <div className={styles.safeArea}>
                  <span className={styles.safeLabel}>1×</span>
                  <div>
                    <Image
                      src="/brand/logo-icon.svg"
                      alt="AccordPay icon with minimum safe area"
                      width={80}
                      height={80}
                      unoptimized
                    />
                  </div>
                </div>
                <p className={styles.supporting}>
                  Keep at least one central-channel width clear around the icon.
                </p>
              </div>
            </div>

            <h3 className={styles.subheading}>Incorrect usage</h3>
            <div className={styles.misuseGrid}>
              <Misuse label="Do not stretch" kind="stretch" />
              <Misuse label="Do not rotate" kind="rotate" />
              <Misuse label="Do not recolour" kind="recolour" />
              <Misuse label="Do not add effects" kind="effect" />
            </div>
          </section>

          <section id="colour" className={styles.section}>
            <Watermark />
            <SectionHeading
              number="02"
              title="Colour"
              copy="Pine creates recognition. Ink neutrals carry the interface. Semantic colours appear only when they communicate real system state."
            />
            <div className={styles.colourGrid}>
              {colours.map((colour) => (
                <article className={styles.colourCard} key={colour.name}>
                  <div
                    className={styles.swatch}
                    style={{ backgroundColor: colour.hex }}
                    aria-label={`${colour.name} colour sample`}
                  />
                  <div className={styles.colourInfo}>
                    <span>{colour.group}</span>
                    <strong>{colour.name}</strong>
                    <dl>
                      <div>
                        <dt>HEX</dt>
                        <dd>{colour.hex}</dd>
                      </div>
                      <div>
                        <dt>RGB</dt>
                        <dd>{colour.rgb}</dd>
                      </div>
                      <div>
                        <dt>CSS</dt>
                        <dd>{colour.variable}</dd>
                      </div>
                    </dl>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="typography" className={styles.section}>
            <Watermark />
            <SectionHeading
              number="03"
              title="Typography"
              copy="Inter is the preferred interface family, backed by resilient system sans-serifs. Financial values use tabular numerals."
            />
            <div className={styles.typeSpecimen}>
              <span>Display · 48/56 · 650</span>
              <p>Secure every agreement.</p>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Style</th>
                    <th>Size</th>
                    <th>Line height</th>
                    <th>Weight</th>
                    <th>Use</th>
                  </tr>
                </thead>
                <tbody>
                  {typeScale.map(([name, size, line, weight, use]) => (
                    <tr key={name}>
                      <td>
                        <strong>{name}</strong>
                      </td>
                      <td>{size}</td>
                      <td>{line}</td>
                      <td>{weight}</td>
                      <td>{use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.weightRow}>
              {[
                ["Regular", "400"],
                ["Medium", "500"],
                ["Semibold", "600"],
                ["Bold", "700"],
              ].map(([name, weight]) => (
                <div key={name}>
                  <span style={{ fontWeight: Number(weight) }}>Aa</span>
                  <strong>{name}</strong>
                  <small>{weight}</small>
                </div>
              ))}
            </div>
          </section>

          <section id="components" className={styles.section}>
            <Watermark />
            <SectionHeading
              number="04"
              title="Product components"
              copy="Every state is explicit, accessible, and proportionate to its financial consequence."
            />

            <ComponentGroup title="Buttons">
              <div className={styles.componentRow}>
                <button className={styles.primaryButton}>Create escrow</button>
                <button className={styles.secondaryButton}>
                  View agreement
                </button>
                <button className={styles.ghostButton}>Cancel</button>
                <button className={styles.dangerButton}>Raise dispute</button>
                <button className={styles.primaryButton} disabled>
                  Disabled
                </button>
                <button className={styles.loadingButton} aria-busy="true">
                  <span className={styles.spinner} aria-hidden="true" />
                  Confirming
                </button>
              </div>
            </ComponentGroup>

            <ComponentGroup title="Inputs">
              <div className={styles.inputGrid}>
                <label className={styles.field}>
                  <span>Agreement title</span>
                  <input defaultValue="Website delivery" readOnly />
                  <small>Use a recognizable reference.</small>
                </label>
                <label className={`${styles.field} ${styles.focusField}`}>
                  <span>Escrow amount</span>
                  <input defaultValue="1.25 ETH" readOnly />
                  <small>Focus state</small>
                </label>
                <label className={`${styles.field} ${styles.errorField}`}>
                  <span>Seller address</span>
                  <input defaultValue="0x123" readOnly aria-invalid="true" />
                  <small>Enter a valid seller address.</small>
                </label>
                <label className={styles.field}>
                  <span>Network</span>
                  <input defaultValue="GIWA Sepolia" disabled />
                  <small>Disabled state</small>
                </label>
              </div>
            </ComponentGroup>

            <ComponentGroup title="Cards">
              <div className={styles.cardGrid}>
                <article className={styles.productCard}>
                  <div className={styles.cardTopline}>
                    <Badge tone="warning">Pending</Badge>
                    <span>ACP-000184</span>
                  </div>
                  <h4>Escrow card</h4>
                  <strong className={styles.amount}>1.25 ETH</strong>
                  <p>Awaiting seller delivery</p>
                  <button className={styles.secondaryButton}>
                    View escrow
                  </button>
                </article>
                <article className={styles.productCard}>
                  <div className={styles.cardTopline}>
                    <Badge tone="success">Funded</Badge>
                    <span>Due Aug 14</span>
                  </div>
                  <h4>Agreement card</h4>
                  <p>
                    Product design and development according to the approved
                    delivery terms.
                  </p>
                  <dl className={styles.miniDefinition}>
                    <div>
                      <dt>Buyer</dt>
                      <dd>0x7A…91C2</dd>
                    </div>
                    <div>
                      <dt>Seller</dt>
                      <dd>0x22…B8F4</dd>
                    </div>
                  </dl>
                </article>
                <article
                  className={`${styles.productCard} ${styles.paymentCard}`}
                >
                  <p className={styles.overline}>Payment summary</p>
                  <h4>Payment card</h4>
                  <dl className={styles.paymentList}>
                    <div>
                      <dt>Escrow amount</dt>
                      <dd>1.25 ETH</dd>
                    </div>
                    <div>
                      <dt>Protocol fee</dt>
                      <dd>0 ETH</dd>
                    </div>
                    <div>
                      <dt>Total deposit</dt>
                      <dd>1.25 ETH</dd>
                    </div>
                  </dl>
                </article>
              </div>
            </ComponentGroup>

            <ComponentGroup title="Status badges">
              <div className={styles.componentRow}>
                <Badge tone="warning">Pending</Badge>
                <Badge tone="info">Funded</Badge>
                <Badge tone="success">Released</Badge>
                <Badge tone="success">Completed</Badge>
                <Badge tone="neutral">Cancelled</Badge>
                <Badge tone="error">Disputed</Badge>
              </div>
            </ComponentGroup>

            <ComponentGroup title="Iconography">
              <div className={styles.iconGuide}>
                {[16, 20, 24, 32].map((size) => (
                  <div key={size}>
                    <span
                      className={styles.sampleIcon}
                      style={{ width: size, height: size }}
                      aria-hidden="true"
                    />
                    <strong>{size}px</strong>
                  </div>
                ))}
                <div className={styles.iconRules}>
                  <p>
                    <strong>Stroke</strong> 1.75–2px
                  </p>
                  <p>
                    <strong>Joins</strong> Rounded
                  </p>
                  <p>
                    <strong>Corner radius</strong> 2px optical
                  </p>
                </div>
              </div>
            </ComponentGroup>
          </section>

          <section id="foundations" className={styles.section}>
            <Watermark />
            <SectionHeading
              number="05"
              title="Layout foundations"
              copy="A measured system of elevation, radius, spacing, and responsive grids keeps financial information stable and predictable."
            />

            <div className={styles.foundationGrid}>
              <div className={styles.foundationBlock}>
                <h3>Shadows</h3>
                <div className={styles.shadowSamples}>
                  {[0, 1, 2, 3].map((level) => (
                    <div className={styles[`shadow${level}`]} key={level}>
                      <span>Level {level}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.foundationBlock}>
                <h3>Border radius</h3>
                <div className={styles.tokenList}>
                  {radii.map(([name, value, use]) => (
                    <div key={name}>
                      <span
                        className={styles.radiusSample}
                        style={{ borderRadius: value }}
                      />
                      <strong>{name}</strong>
                      <code>{value}</code>
                      <small>{use}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.foundationBlock}>
              <h3>Spacing system</h3>
              <div className={styles.spacingList}>
                {spacing.map(([token, value, use]) => (
                  <div key={token}>
                    <code>{token}</code>
                    <span style={{ width: value }} />
                    <strong>{value}</strong>
                    <small>{use}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.foundationBlock}>
              <h3>Grid system</h3>
              <div
                className={styles.gridDemo}
                aria-label="Twelve-column desktop grid"
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <span key={index}>{index + 1}</span>
                ))}
              </div>
              <div className={styles.gridSpecs}>
                <span>
                  <strong>Mobile</strong> 4 columns · 16px gutter
                </span>
                <span>
                  <strong>Tablet</strong> 8 columns · 24px gutter
                </span>
                <span>
                  <strong>Desktop</strong> 12 columns · 32px gutter
                </span>
                <span>
                  <strong>Max width</strong> 1200px · 1440px workspace
                </span>
              </div>
            </div>
          </section>

          <footer className={styles.footer}>
            <div className={styles.brand}>
              <Image
                src="/brand/logo-icon-light.svg"
                alt=""
                width={24}
                height={24}
                aria-hidden="true"
                unoptimized
              />
              <span>AccordPay</span>
            </div>
            <p>Independent escrow infrastructure built on GIWA.</p>
          </footer>
        </div>
      </div>
    </main>
  );
}

function SectionHeading({
  number,
  title,
  copy,
}: {
  number: string;
  title: string;
  copy: string;
}) {
  return (
    <header className={styles.sectionHeading}>
      <span>{number}</span>
      <div>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
    </header>
  );
}

function LogoPanel({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <article className={`${styles.logoPanel} ${className}`}>
      <span>{label}</span>
      <div>{children}</div>
    </article>
  );
}

function Misuse({
  label,
  kind,
}: {
  label: string;
  kind: "stretch" | "rotate" | "recolour" | "effect";
}) {
  return (
    <article className={styles.misuse}>
      <div className={styles.misuseStage}>
        <Image
          className={styles[kind]}
          src="/brand/logo-icon.svg"
          alt=""
          width={64}
          height={64}
          aria-hidden="true"
          unoptimized
        />
        <span aria-hidden="true">×</span>
      </div>
      <p>{label}</p>
    </article>
  );
}

function ComponentGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.componentGroup}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "warning" | "info" | "success" | "neutral" | "error";
  children: React.ReactNode;
}) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
