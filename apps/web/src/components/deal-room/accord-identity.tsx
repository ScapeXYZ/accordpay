"use client";

import { useUpbitName } from "@/hooks/use-upbit-name";
import {
  bestIdentity,
  shortenIdentityAddress,
} from "@/services/deal-room/identity";

export function AccordIdentity({
  address,
  displayName,
  role,
}: {
  address: `0x${string}`;
  displayName?: string | null;
  role:
    "Buyer" | "Seller" | "AccordPay Support" | "Designated Testnet Resolver";
}) {
  const identity = useUpbitName(address);
  const confirmedName =
    identity.result.status === "confirmed" ? identity.result.name : undefined;
  const best = bestIdentity({ confirmedName, displayName, address });
  return (
    <span>
      <strong>{best.primary}</strong>
      {best.verified ? <span> · Confirmed UP ID</span> : null}
      <span> · {role}</span>
      <small title={address}>{shortenIdentityAddress(address)}</small>
    </span>
  );
}
