"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./home.module.css";

export function AccordPayEntrance() {
  const router = useRouter();
  const [isEntering, setIsEntering] = useState(false);

  function enterAccordPay() {
    if (isEntering) return;
    setIsEntering(true);
    window.setTimeout(() => router.push("/app"), 600);
  }

  return (
    <main
      className={`${styles.entrance} ${isEntering ? styles.isEntering : ""}`}
    >
      <div className={styles.atmosphere} aria-hidden="true">
        <div className={styles.grid} />
        <div className={styles.portal}>
          <div className={styles.pillarLeft} />
          <div className={styles.pillarRight} />
          <div className={styles.beam} />
        </div>
        <div className={styles.floorGlow} />
        <div className={styles.floorMist} />
        <div className={styles.particles} />
        <div className={styles.visitor}>
          <span className={styles.visitorHead} />
          <span className={styles.visitorBody} />
        </div>
      </div>
      <section className={styles.centerpiece} aria-label="AccordPay entrance">
        <button
          className={styles.logoButton}
          type="button"
          onClick={enterAccordPay}
          aria-label="Enter AccordPay"
          disabled={isEntering}
        >
          <span className={styles.logoHalo} aria-hidden="true" />
          <Image
            className={styles.logo}
            src="/brand/logo-icon.svg"
            alt=""
            width={144}
            height={144}
            priority
          />
          <span className={styles.enterLabel}>Enter AccordPay</span>
        </button>
        <p className={styles.microcopy}>Secure every agreement on GIWA.</p>
      </section>
      <footer className={styles.branding}>
        <a
          href="https://x.com/GIWA_Accordpay"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow AccordPay on X at GIWA_Accordpay (opens in a new tab)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.24 2h3.68l-8.04 9.19L23.34 22h-7.41l-5.8-7.58L3.5 22H-.18l8.58-9.81L-.67 2h7.6l5.24 6.93L18.24 2Zm-1.29 18h2.04L5.82 3.9H3.63L16.95 20Z" />
          </svg>
          <span>@GIWA_Accordpay</span>
        </a>
      </footer>
    </main>
  );
}
