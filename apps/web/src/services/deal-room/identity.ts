export const RESERVED_IDENTITY_NAMES = new Set([
  "accordpay support",
  "support",
  "designated testnet resolver",
  "accordpay resolver",
  "administrator",
  "admin",
]);

export function validateDisplayName(value: string) {
  const name = value.trim();
  if (name.length < 2 || name.length > 48) {
    return { valid: false as const, error: "Use a 2–48 character name." };
  }
  if (RESERVED_IDENTITY_NAMES.has(name.toLowerCase())) {
    return {
      valid: false as const,
      error: "This protected identity label cannot be used as a display name.",
    };
  }
  return { valid: true as const, value: name };
}

export function shortenIdentityAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function bestIdentity(input: {
  confirmedName?: string;
  displayName?: string | null;
  address: string;
}) {
  if (input.confirmedName) {
    return { primary: input.confirmedName, verified: true as const };
  }
  if (
    input.displayName &&
    !RESERVED_IDENTITY_NAMES.has(input.displayName.toLowerCase())
  ) {
    return { primary: input.displayName, verified: false as const };
  }
  return {
    primary: shortenIdentityAddress(input.address),
    verified: false as const,
  };
}
