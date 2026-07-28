import type { HTMLAttributes, ReactNode } from "react";

import styles from "./ui.module.css";

export function Card({
  variant = "standard",
  padding = true,
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: "standard" | "interactive" | "elevated" | "tinted";
  padding?: boolean;
  children: ReactNode;
}) {
  const variants = {
    standard: "",
    interactive: styles.cardInteractive,
    elevated: styles.cardElevated,
    tinted: styles.cardTinted,
  };

  return (
    <div
      {...props}
      className={`${styles.card} ${variants[variant]} ${padding ? styles.cardPadding : ""} ${className}`}
    >
      {children}
    </div>
  );
}
