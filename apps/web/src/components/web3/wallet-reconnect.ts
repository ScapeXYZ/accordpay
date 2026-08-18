export const WALLET_CONNECTOR_STORAGE_KEY =
  "accordpay:authorized-wallet-connector";

export type StoredWalletConnector = {
  uuid: string;
  rdns: string;
};

export function parseStoredWalletConnector(
  value: string | null,
): StoredWalletConnector | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as Partial<StoredWalletConnector>;
    return parsed.uuid && parsed.rdns
      ? { uuid: parsed.uuid, rdns: parsed.rdns }
      : undefined;
  } catch {
    return undefined;
  }
}

export function serializeWalletConnector(value: StoredWalletConnector) {
  return JSON.stringify(value);
}

export function matchesStoredConnector(
  stored: StoredWalletConnector,
  candidate: StoredWalletConnector,
) {
  return stored.uuid === candidate.uuid || stored.rdns === candidate.rdns;
}
