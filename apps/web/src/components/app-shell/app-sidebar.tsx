"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { applicationNavigation } from "./navigation-config";
import styles from "./app-shell.module.css";

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
      aria-label="Application sidebar"
    >
      <div className={styles.sidebarBrand}>
        <Image
          src="/brand/logo-icon.svg"
          alt=""
          width={32}
          height={32}
          aria-hidden="true"
          unoptimized
        />
        {!collapsed && <strong>AccordPay</strong>}
      </div>
      <button
        type="button"
        className={styles.collapseButton}
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <span aria-hidden="true">{collapsed ? "›" : "‹"}</span>
      </button>
      <nav className={styles.sidebarNav} aria-label="Application">
        {applicationNavigation.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              href={item.href}
              key={item.href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={active ? styles.activeNav : undefined}
            >
              <span className={styles.navGlyph} aria-hidden="true">
                {item.label.slice(0, 1)}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className={styles.sidebarNetwork}>
        <span aria-hidden="true" />
        {!collapsed && (
          <div>
            <strong>GIWA Sepolia</strong>
            <small>Testnet · 91342</small>
          </div>
        )}
      </div>
    </aside>
  );
}
