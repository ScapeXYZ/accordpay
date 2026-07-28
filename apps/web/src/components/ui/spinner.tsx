import styles from "./ui.module.css";

export function Spinner({
  size = "medium",
  label = "Loading",
}: {
  size?: "small" | "medium" | "large";
  label?: string;
}) {
  return (
    <span
      className={`${styles.spinner} ${styles[`spinner${size[0].toUpperCase()}${size.slice(1)}`]}`}
      role="status"
    >
      <span className={styles.visuallyHidden}>{label}</span>
    </span>
  );
}
