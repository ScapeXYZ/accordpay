import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";

import styles from "./shared.module.css";

export function WatermarkSurface({
  children,
  position = "top-right",
  opacity = 0.03,
  variant = "icon",
  className = "",
}: {
  children: ReactNode;
  position?: "top-right" | "bottom-right" | "centered";
  opacity?: number;
  variant?: "icon" | "lockup";
  className?: string;
}) {
  const safeOpacity = Math.min(0.05, Math.max(0.02, opacity));
  const positionClass = {
    "top-right": styles.topRight,
    "bottom-right": styles.bottomRight,
    centered: styles.centered,
  }[position];

  return (
    <div
      className={`${styles.watermarkSurface} ${className}`}
      style={{ "--watermark-opacity": safeOpacity } as CSSProperties}
    >
      {variant === "lockup" ? (
        <div
          className={`${styles.watermarkLockup} ${positionClass}`}
          aria-hidden="true"
        >
          <Image
            src="/brand/logo-icon-light.svg"
            alt=""
            width={96}
            height={96}
            unoptimized
          />
          <span>AccordPay</span>
        </div>
      ) : (
        <Image
          className={`${styles.watermark} ${positionClass}`}
          src="/brand/logo-icon-light.svg"
          alt=""
          width={288}
          height={288}
          aria-hidden="true"
          unoptimized
        />
      )}
      <div className={styles.watermarkContent}>{children}</div>
    </div>
  );
}
