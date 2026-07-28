import type { ReactNode } from "react";

import styles from "./ui.module.css";

export function Alert({
  variant = "info",
  title,
  description,
  action,
}: {
  variant?: "info" | "success" | "warning" | "error";
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const variantClass = {
    info: styles.alertInfo,
    success: styles.alertSuccess,
    warning: styles.alertWarning,
    error: styles.alertError,
  }[variant];

  return (
    <div
      className={`${styles.alert} ${variantClass}`}
      role={variant === "error" ? "alert" : "status"}
    >
      <span className={styles.alertMarker} aria-hidden="true" />
      <div>
        <h3 className={styles.alertTitle}>{title}</h3>
        <p className={styles.alertDescription}>{description}</p>
      </div>
      {action}
    </div>
  );
}
