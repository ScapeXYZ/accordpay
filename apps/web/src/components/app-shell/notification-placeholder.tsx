import styles from "./app-shell.module.css";

export function NotificationPlaceholder() {
  return (
    <button
      className={styles.iconButton}
      type="button"
      aria-label="Notifications placeholder; notifications are not active"
      title="Notifications are not active"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </svg>
    </button>
  );
}
