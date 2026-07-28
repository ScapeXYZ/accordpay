"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { applicationNavigation, mobilePrimaryHrefs } from "./navigation-config";
import styles from "./app-shell.module.css";

export function MobileNavigation({
  menuOpen,
  onNavigate,
}: {
  menuOpen: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const primary = applicationNavigation.filter((item) =>
    mobilePrimaryHrefs.includes(
      item.href as (typeof mobilePrimaryHrefs)[number],
    ),
  );

  return (
    <>
      {menuOpen && (
        <nav
          id="application-mobile-menu"
          className={styles.mobileMenu}
          aria-label="All application destinations"
        >
          {applicationNavigation.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              onClick={onNavigate}
              aria-current={
                pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(item.href))
                  ? "page"
                  : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      <nav className={styles.bottomNav} aria-label="Primary mobile navigation">
        {primary.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/app" && pathname.startsWith(item.href));
          return (
            <Link
              href={item.href}
              key={item.href}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.navGlyph} aria-hidden="true">
                {item.label.slice(0, 1)}
              </span>
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
