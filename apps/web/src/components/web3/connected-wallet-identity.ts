import type { NameResolutionResult } from "@/services/names";

export type ConnectedWalletIdentityView = {
  primary: string;
  secondary?: string;
  status: "loading" | "confirmed" | "no-name" | "mismatch" | "unavailable";
  statusLabel: string;
};

export function shortenWalletAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function getConnectedWalletIdentityView(
  address: string,
  state: "resolving" | NameResolutionResult["status"] | undefined,
  result: NameResolutionResult,
): ConnectedWalletIdentityView {
  const shortened = shortenWalletAddress(address);

  if (state === "resolving") {
    return {
      primary: shortened,
      status: "loading",
      statusLabel: "Resolving UP ID",
    };
  }

  if (
    state === "confirmed" &&
    result.status === "confirmed" &&
    result.address.toLowerCase() === address.toLowerCase()
  ) {
    return {
      primary: result.name,
      secondary: shortened,
      status: "confirmed",
      statusLabel: "Name confirmed",
    };
  }

  if (state === "not-found") {
    return {
      primary: shortened,
      status: "no-name",
      statusLabel: "No active UP ID",
    };
  }

  if (state === "mismatch") {
    return {
      primary: shortened,
      status: "mismatch",
      statusLabel: "Name ownership mismatch",
    };
  }

  return {
    primary: shortened,
    status: "unavailable",
    statusLabel: "Name resolution unavailable",
  };
}
