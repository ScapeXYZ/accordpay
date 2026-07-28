import type { ReactNode } from "react";

import { Badge } from "../ui";
import styles from "./layout.module.css";

type Breadcrumb = {
  label: string;
  href?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs = [],
  primaryAction,
  secondaryAction,
  showTestnetBadge = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: readonly Breadcrumb[];
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  showTestnetBadge?: boolean;
}) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderContent}>
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className={styles.breadcrumbs}>
              {breadcrumbs.map((item, index) => (
                <li key={`${item.label}-${index}`}>
                  {item.href && index < breadcrumbs.length - 1 ? (
                    <a href={item.href}>{item.label}</a>
                  ) : (
                    <span
                      aria-current={
                        index === breadcrumbs.length - 1 ? "page" : undefined
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{title}</h1>
          {showTestnetBadge && (
            <Badge status="testnet">GIWA Sepolia testnet</Badge>
          )}
        </div>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className={styles.actions}>
          {secondaryAction}
          {primaryAction}
        </div>
      )}
    </header>
  );
}
