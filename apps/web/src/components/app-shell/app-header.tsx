"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { WalletControl } from "../web3";
import { Badge } from "../ui";
import { AvatarPlaceholder } from "./avatar-placeholder";
import { NotificationPanel } from "./notification-panel";
import styles from "./app-shell.module.css";

const titles: Record<string, string> = {
  "/app": "Dashboard",
  "/app/agreements": "Agreements",
  "/app/create": "Create Escrow",
  "/app/transactions": "Transactions",
  "/app/activity": "Activity",
  "/app/settings": "Settings",
};

export function AppHeader({
  menuOpen,
  onMenuToggle,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
}) {
  const pathname = usePathname();
  const title = titles[pathname] ?? "AccordPay";

  return (
    <header className={styles.header}>
      <div className={styles.mobileBrand}>
        <Image
          src="/brand/logo-icon.svg"
          alt=""
          width={32}
          height={32}
          aria-hidden="true"
          unoptimized
        />
        <strong>AccordPay</strong>
      </div>
      <button
        className={styles.menuButton}
        type="button"
        onClick={onMenuToggle}
        aria-expanded={menuOpen}
        aria-controls="application-mobile-menu"
      >
        <span aria-hidden="true">☰</span>
        <span>Menu</span>
      </button>
      <div className={styles.headerContext}>
        <nav aria-label="Breadcrumb">
          <Link href="/app">Application</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </nav>
      </div>
      <div className={styles.headerActions}>
        <Badge status="testnet">GIWA Sepolia</Badge>
        <NotificationPanel />
        <WalletControl compact />
        <AvatarPlaceholder />
      </div>
    </header>
  );
}
