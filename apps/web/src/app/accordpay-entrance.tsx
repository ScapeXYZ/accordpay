"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "@/components/app-shell/theme-model";
import s from "./home.module.css";
const addr = "0x0d6e2c12BD5916B1020A03f30EAf3b73f09dF798",
  explorer = "https://sepolia-explorer.giwa.io/address/" + addr,
  A = () => (
    <svg viewBox="0 0 24 24">
      <path d="M5 12h14m-5-5 5 5-5 5" />
    </svg>
  ),
  Brand = () => (
    <span className={s.brand}>
      <Image src="/brand/logo-icon.svg" alt="" width={30} height={30} />
      <b>AccordPay</b>
    </span>
  );
const facts = [
    ["Verified contract source", "Published on GIWA Explorer"],
    ["Atomic funding", "Agreement and deposit in one transaction"],
    ["Canonical wallet identity", "UP ID and Dojang shown independently"],
    ["0% MVP protocol fee", "No testnet fee collected"],
  ],
  work = [
    [
      "01",
      "Define the agreement",
      "Set the seller, delivery deadline, Test ETH amount, and a public metadata reference.",
    ],
    [
      "02",
      "Fund in one transaction",
      "Creation and funding happen atomically. The contract records the agreement and locks the exact deposit.",
    ],
    [
      "03",
      "Settle with clear roles",
      "The seller marks delivery. The buyer releases funds, or either party can use documented refund and dispute paths.",
    ],
  ],
  protect = [
    [
      "For buyers",
      "Release after delivery",
      "Funds remain in escrow until delivery is marked and the buyer authorizes release, or another permitted terminal path completes.",
    ],
    [
      "For sellers",
      "Funded before work begins",
      "Every on-chain agreement is funded when created, so there is no unfunded Created state to mistake for a deposit.",
    ],
    [
      "For both parties",
      "Exact, inspectable state",
      "Status, parties, amount, deadline, and transaction evidence remain readable from GIWA Sepolia.",
    ],
  ];
function Section({
  id,
  eye,
  title,
  copy,
  items,
}: {
  id: string;
  eye: string;
  title: string;
  copy: string;
  items: string[][];
}) {
  return (
    <section className={s.section} id={id}>
      <div data-r className={s.intro}>
        <p className={s.eye}>{eye}</p>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <div className={s.cards}>
        {items.map((x) => (
          <article data-r className={s.card} key={x[0]}>
            <span>{x[0]}</span>
            <h3>{x[1]}</h3>
            <p>{x[2]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MotionShowcase() {
  return (
    <section className={s.motion}>
      <div className={s.motionIntro}>
        <p className={s.eye}>AccordPay in motion</p>
        <h2>
          From agreement to settlement,
          <br />
          <em>without losing context.</em>
        </h2>
        <p>
          One workflow keeps identity, escrow state, delivery, and settlement
          connected.
        </p>
      </div>
      <div className={s.stage} aria-label="Illustrative AccordPay lifecycle">
        <small className={s.preview}>
          ● Product preview · Illustrative lifecycle
        </small>
        <div className={s.buyer}>
          <small>BUYER</small>
          <b>buyer.up</b>
          <code>0x7748...FB</code>
        </div>
        <div className={s.seller}>
          <small>SELLER</small>
          <b>seller.up</b>
          <code>0x91C2...4A</code>
        </div>
        <i className={s.motionLine} />
        <article className={s.motionWindow}>
          <header>
            <span>Agreement #AP-001</span>
            <b className={s.motionStatus} />
          </header>
          <div className={s.escrow}>
            <small>ACCORDPAY ESCROW</small>
            <strong>0.05 Test ETH</strong>
            <span>FUNDED</span>
            <i />
          </div>
          <p>Funds protected onchain</p>
          <dl>
            <div>
              <dt>Network</dt>
              <dd>GIWA Sepolia</dd>
            </div>
            <div>
              <dt>Protocol fee</dt>
              <dd>0 ETH</dd>
            </div>
          </dl>
        </article>
        <aside className={s.chat}>
          <small>ACCORD CHAT · DEMO</small>
          <p>
            <b>Seller</b>Delivery completed.
          </p>
          <p>
            <b>Buyer</b>Reviewing delivery.
          </p>
          <span>Delivery marked</span>
        </aside>
        <button className={s.release} tabIndex={-1}>
          Confirm &amp; Release <A />
        </button>
        <div className={s.context}>
          <code>0x7748...FB</code>
          <b>buyer.up</b>
          <span>✓ Dojang Verified</span>
          <p>Canonical wallet remains the onchain identity.</p>
        </div>
        <div className={s.settled}>
          <b>RELEASED</b>
          <span>Settlement complete</span>
          <small>GIWA Sepolia</small>
        </div>
      </div>
    </section>
  );
}

function TrustFlow() {
  return (
    <section className={s.trust}>
      <div>
        <p className={s.eye}>Verifiable infrastructure</p>
        <h2>Trust, without hiding the source.</h2>
        <p>
          Identity context, agreement state, and verified contract evidence stay
          connected to the canonical wallet.
        </p>
      </div>
      <div className={s.flow}>
        {[
          "UP ID",
          "Canonical Wallet",
          "Dojang Verification",
          "AccordPay Agreement",
          "Escrow Contract",
          "GIWA Explorer",
        ].map((x, i) => (
          <div key={x}>
            <span>0{i + 1}</span>
            <b>{x}</b>
          </div>
        ))}
        <i />
      </div>
    </section>
  );
}

export function AccordPayEntrance() {
  const [dark, setDark] = useState(false),
    [menu, setMenu] = useState(false);
  useEffect(() => {
    const timer = setTimeout(
      () => setDark(document.documentElement.dataset.theme === "dark"),
      0,
    );
    const o = new IntersectionObserver((es) =>
      es.forEach((e) => e.isIntersecting && e.target.classList.add(s.show)),
    );
    document.querySelectorAll("[data-r]").forEach((n) => o.observe(n));
    return () => {
      clearTimeout(timer);
      o.disconnect();
    };
  }, []);
  function theme() {
    const d = !dark;
    setDark(d);
    document.documentElement.dataset.theme = d ? "dark" : "light";
    document.documentElement.style.colorScheme = d ? "dark" : "light";
    localStorage.setItem(THEME_STORAGE_KEY, d ? "dark" : "light");
  }
  return (
    <div className={s.page}>
      <header>
        <nav className={s.nav}>
          <Link href="/">
            <Brand />
          </Link>
          <div className={menu ? s.open : ""}>
            <a href="#how-it-works">How it works</a>
            <a href="#protection">Protection</a>
            <a href="#infrastructure">Infrastructure</a>
          </div>
          <aside>
            <button
              className={s.themeButton}
              onClick={theme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.4 15.2A8.5 8.5 0 0 1 8.8 3.6 8.5 8.5 0 1 0 20.4 15.2Z" />
                </svg>
              )}
            </button>
            <Link className={s.primary} href="/app">
              Launch App
            </Link>
            <button
              className={s.menu}
              onClick={() => setMenu(!menu)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
          </aside>
        </nav>
      </header>
      <main>
        <section className={s.hero}>
          <div className={s.heroGrid}>
            <div>
              <div className={s.badges}>
                <span>● GIWA Sepolia testnet</span>
                <span>Built on GIWA</span>
              </div>
              <p className={s.eye}>Verified escrow infrastructure</p>
              <h1>
                Secure every
                <br />
                <em>agreement.</em>
              </h1>
              <p className={s.lead}>
                AccordPay gives buyers and sellers a clear, programmable escrow
                workflow for funded agreements, delivery, release, refunds, and
                disputes on GIWA Sepolia.
              </p>
              <div className={s.actions}>
                <Link className={s.primary} href="/app">
                  Launch App <A />
                </Link>
                <Link className={s.secondary} href="/app/agreements">
                  View Agreements
                </Link>
              </div>
              <small>
                GIWA Sepolia Test ETH has no monetary value. Contract
                source-verified; not independently audited.
              </small>
            </div>
            <div className={s.demo}>
              <header>
                <span>● Product preview</span>
                <span>Agreement lifecycle</span>
              </header>
              <div className={s.parties}>
                <div>
                  <small>Buyer</small>
                  <b>buyer.up</b>
                  <code>0x8C2A...19F0</code>
                </div>
                <strong>0.05 Test ETH</strong>
                <div>
                  <small>Seller</small>
                  <b>seller.up</b>
                  <code>0x3F91...72B4</code>
                </div>
              </div>
              <article>
                <header>
                  Agreement #AP-001 <b className={s.state} />
                </header>
                <div className={s.lock}>
                  ◇ <b className={s.lockText} />
                </div>
                <dl>
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
              </article>
              <footer>
                <span>✓ UP ID</span>
                <span>✓ Dojang Verified</span>
                <small>Canonical wallet remains onchain identity.</small>
              </footer>
            </div>
          </div>
        </section>
        <section className={s.facts}>
          {facts.map((x, i) => (
            <div key={x[0]}>
              <span>0{i + 1}</span>
              <b>{x[0]}</b>
              <small>{x[1]}</small>
            </div>
          ))}
        </section>
        <MotionShowcase />
        <Section
          id="how-it-works"
          eye="How AccordPay works"
          title="A deliberate path from agreement to settlement."
          copy="Each stage has a defined actor, contract state, and transaction outcome—without hiding the network or financial conditions."
          items={work}
        />
        <Section
          id="protection"
          eye="Balanced protection"
          title="Designed around the agreement, not speculation."
          copy="AccordPay avoids trading imagery and vanity metrics. The product focuses on the parties, their obligations, and the next permitted action."
          items={protect}
        />
        <section className={`${s.section} ${s.infra}`} id="infrastructure">
          <div data-r>
            <p className={s.eye}>GIWA-native infrastructure</p>
            <h2>Identity context without replacing wallet ownership.</h2>
            <p>
              AccordPay resolves confirmed Upbit Web3 Names / UP ID and reads
              GIWA Dojang verification on-chain. The wallet address remains the
              canonical identity stored by the escrow contract.
            </p>
            <Link className={s.text} href="/app">
              Open the workspace <A />
            </Link>
          </div>
          <article data-r className={s.contract}>
            <p className={s.eye}>Verified escrow smart contract</p>
            <h3>AccordPayEscrow</h3>
            <code>{addr}</code>
            <dl>
              <div>
                <dt>Network</dt>
                <dd>GIWA Sepolia · Chain ID 91342</dd>
              </div>
              <div>
                <dt>Native asset</dt>
                <dd>Test ETH</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>Verified on GIWA Explorer</dd>
              </div>
              <div>
                <dt>Audit</dt>
                <dd>Not independently audited</dd>
              </div>
            </dl>
            <a
              className={s.secondary}
              href={explorer}
              target="_blank"
              rel="noopener noreferrer"
            >
              View verified contract
            </a>
          </article>
        </section>
        <section className={`${s.section} ${s.transparent}`}>
          <div data-r>
            <div>
              <p className={s.eye}>Transparent by design</p>
              <h2>Testnet infrastructure with explicit limitations.</h2>
            </div>
            <ul>
              {[
                "No owner withdrawal path for active escrow funds",
                "Role-aware lifecycle actions and terminal states",
                "Clear transaction confirmation and failure states",
                "No claim of audit or financial guarantee",
              ].map((x) => (
                <li key={x}>✓ {x}</li>
              ))}
            </ul>
          </div>
        </section>
        <TrustFlow />
        <section className={`${s.section} ${s.cta}`}>
          <div data-r>
            <p className={s.eye}>Agreement infrastructure</p>
            <h2>
              Start with a clear,
              <br />
              funded agreement.
            </h2>
            <p>
              Connect a compatible wallet inside the application and review
              every Test ETH condition before signing.
            </p>
            <div className={s.actions}>
              <Link className={s.primary} href="/app">
                Launch App
              </Link>
              <Link className={s.secondary} href="/app/agreements">
                View Agreements
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className={s.footer}>
        <div>
          <Brand />
          <p>
            Independent product built on GIWA.
            <br />
            GIWA Sepolia Test ETH has no monetary value.
            <br />
            Contract not independently audited.
          </p>
        </div>
        <nav>
          <Link href="/app">Launch App</Link>
          <Link href="/app/create">Create Escrow</Link>
          <Link href="/app/agreements">Agreements</Link>
          <a href={explorer} target="_blank" rel="noopener noreferrer">
            Verified Contract
          </a>
          <a
            className={s.xLink}
            href="https://x.com/GIWA_Accordpay"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 4l14 16M19 4L5 20" />
            </svg>
            @GIWA_Accordpay
          </a>
        </nav>
      </footer>
    </div>
  );
}
