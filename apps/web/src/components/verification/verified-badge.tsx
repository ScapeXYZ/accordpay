import { Spinner } from "@/components/ui";
import type { AddressVerificationState } from "@/hooks/use-address-verification";

import styles from "./verification.module.css";

const labels: Record<AddressVerificationState["status"], string> = {
  idle: "Not checked",
  checking: "Checking Dojang",
  verified: "✓ Dojang verified",
  "not-verified": "Dojang not verified",
  unavailable: "Verification unavailable",
};

export function VerifiedBadge({ status, message }: AddressVerificationState) {
  return (
    <span
      className={`${styles.badge} ${styles[status]}`}
      title={message}
      aria-label={`${labels[status]}. ${message}`}
    >
      {status === "checking" && (
        <Spinner size="small" label="Checking GIWA Dojang verification" />
      )}
      {labels[status]}
    </span>
  );
}
