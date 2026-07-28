import type { ReactNode } from "react";

import { WatermarkSurface } from "./watermark-surface";
import styles from "./shared.module.css";

export function EmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  title: string;
  description: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}) {
  return (
    <WatermarkSurface position="bottom-right" className={styles.emptyState}>
      <div className={styles.emptyContent}>
        <h3>{title}</h3>
        <p>{description}</p>
        {(primaryAction || secondaryAction) && (
          <div className={styles.emptyActions}>
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </WatermarkSurface>
  );
}
