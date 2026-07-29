"use client";

import { useState } from "react";
import { getAddress, isAddress } from "viem";

import { useAddressVerification } from "@/hooks/use-address-verification";
import { useUpbitName } from "@/hooks/use-upbit-name";

import { VerifiedBadge } from "@/components/verification";
import styles from "./web3-identity.module.css";

export function Web3Identity({
  address,
  label,
}: {
  address: string;
  label?: string;
}) {
  const canonical = isAddress(address) ? getAddress(address) : address;
  const name = useUpbitName(canonical, isAddress(canonical));
  const verification = useAddressVerification(canonical);
  const [expanded, setExpanded] = useState(false);
  const confirmedName =
    name.result.status === "confirmed" ? name.result.name : null;
  const short = `${canonical.slice(0, 6)}…${canonical.slice(-4)}`;

  async function copyAddress() {
    await navigator.clipboard.writeText(canonical);
    setExpanded(true);
  }

  return (
    <div className={styles.identity}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <div className={styles.primaryLine}>
        <span className={styles.name}>{confirmedName ?? short}</span>
        <VerifiedBadge {...verification} />
      </div>
      <div className={styles.addressLine}>
        <button
          className={styles.addressButton}
          onClick={copyAddress}
          title={canonical}
          type="button"
        >
          {expanded || !confirmedName ? canonical : short}
        </button>
        <button
          className={styles.refresh}
          onClick={() => void name.refetch()}
          type="button"
        >
          Refresh name
        </button>
      </div>
      <span className={styles.state}>
        {name.state === "resolving"
          ? "Resolving"
          : name.result.status === "confirmed"
            ? "Name confirmed"
            : name.result.status === "not-found"
              ? "No name found"
              : name.result.status === "mismatch"
                ? "Name/address mismatch"
                : "Resolution unavailable"}
      </span>
    </div>
  );
}
