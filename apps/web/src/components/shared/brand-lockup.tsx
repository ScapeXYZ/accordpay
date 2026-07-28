import Image from "next/image";

import styles from "./shared.module.css";

export function BrandLockup({
  surface = "light",
  variant = "full",
  tagline = "Secure every agreement.",
}: {
  surface?: "light" | "dark";
  variant?: "compact" | "full";
  tagline?: string;
}) {
  const dark = surface === "dark";
  const compact = variant === "compact";

  return (
    <div
      className={`${styles.brandLockup} ${dark ? styles.brandDark : ""} ${compact ? styles.brandCompact : ""}`}
    >
      <Image
        src={dark ? "/brand/logo-icon-dark.svg" : "/brand/logo-icon.svg"}
        alt=""
        width={compact ? 28 : 50}
        height={compact ? 28 : 50}
        aria-hidden="true"
        unoptimized
      />
      <span className={styles.brandText}>
        <span className={styles.brandName}>AccordPay</span>
        {!compact && tagline && (
          <span className={styles.tagline}>{tagline}</span>
        )}
      </span>
    </div>
  );
}
