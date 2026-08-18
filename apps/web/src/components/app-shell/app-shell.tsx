"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { MobileNavigation } from "./mobile-navigation";
import styles from "./app-shell.module.css";
import { AccordChatLauncher } from "@/components/deal-room";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ""}`}
    >
      <a className={styles.skipLink} href="#application-content">
        Skip to content
      </a>
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />
      <div className={styles.shellBody}>
        <AppHeader
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((value) => !value)}
        />
        <MobileNavigation
          menuOpen={menuOpen}
          onNavigate={() => setMenuOpen(false)}
        />
        <main id="application-content" className={styles.main} tabIndex={-1}>
          {children}
        </main>
        <AccordChatLauncher />
      </div>
    </div>
  );
}
