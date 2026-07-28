import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import styles from "./layout.module.css";

type Space = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;

export function Container({
  size = "content",
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  size?: "reading" | "content" | "wide";
}) {
  const sizeClass = {
    reading: styles.containerReading,
    content: "",
    wide: styles.containerWide,
  }[size];
  return (
    <div
      {...props}
      className={`${styles.container} ${sizeClass} ${className}`}
    />
  );
}

export function Stack({
  gap = 4,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { gap?: Space }) {
  return (
    <div
      {...props}
      className={`${styles.stack} ${className}`}
      style={
        {
          ...props.style,
          "--stack-gap": `var(--space-${gap})`,
        } as CSSProperties
      }
    />
  );
}

export function Inline({
  gap = 3,
  align = "center",
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  gap?: Space;
  align?: "start" | "center" | "end";
}) {
  return (
    <div
      {...props}
      className={`${styles.inline} ${className}`}
      style={
        {
          ...props.style,
          "--inline-gap": `var(--space-${gap})`,
          "--inline-align": align,
        } as CSSProperties
      }
    />
  );
}

export function Grid({
  columns = 1,
  gap = 4,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: Space;
}) {
  return (
    <div
      {...props}
      className={`${styles.grid} ${className}`}
      style={
        {
          ...props.style,
          "--grid-columns": columns,
          "--grid-gap": `var(--space-${gap})`,
        } as CSSProperties
      }
    />
  );
}

export function Divider(props: HTMLAttributes<HTMLHRElement>) {
  return (
    <hr {...props} className={`${styles.divider} ${props.className ?? ""}`} />
  );
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className={styles.visuallyHidden}>{children}</span>;
}
