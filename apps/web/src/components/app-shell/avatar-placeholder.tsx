import styles from "./app-shell.module.css";

export function AvatarPlaceholder() {
  return (
    <span
      className={styles.avatar}
      aria-label="Generic user placeholder; no profile exists"
      title="No user profile"
    >
      <span aria-hidden="true">—</span>
    </span>
  );
}
