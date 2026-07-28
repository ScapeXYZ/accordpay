import styles from "./ui.module.css";

export function Skeleton({
  variant = "text",
  label = "Loading content",
}: {
  variant?: "text" | "card" | "table-row";
  label?: string;
}) {
  const variantClass = {
    text: styles.skeletonText,
    card: styles.skeletonCard,
    "table-row": styles.skeletonRow,
  }[variant];

  return (
    <div
      className={`${styles.skeleton} ${variantClass}`}
      role="status"
      aria-label={label}
    />
  );
}
