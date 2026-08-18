export const MAX_ESCROW_URI_LENGTH = 2_048;

export type EscrowUriValidation =
  | { valid: true; value: string; scheme: "https" | "ipfs" | "ar" }
  | { valid: false; value: string; error: string };

export function validateEscrowUri(input: string): EscrowUriValidation {
  const value = input.trim();
  if (!value) {
    return { valid: false, value, error: "Enter a public agreement URI." };
  }
  if (value.length > MAX_ESCROW_URI_LENGTH) {
    return {
      valid: false,
      value,
      error: `URI must not exceed ${MAX_ESCROW_URI_LENGTH.toLocaleString()} characters.`,
    };
  }

  const scheme = value.slice(0, value.indexOf(":")).toLowerCase();
  if (!["https", "ipfs", "ar"].includes(scheme)) {
    return {
      valid: false,
      value,
      error: "Use a valid HTTPS, IPFS, or Arweave URI.",
    };
  }

  try {
    const parsed = new URL(value);
    if (
      !parsed.hostname ||
      (parsed.protocol === "https:" && !parsed.pathname && !parsed.hostname)
    ) {
      throw new Error("Missing resource");
    }
  } catch {
    return {
      valid: false,
      value,
      error: "Enter a complete, well-formed public URI.",
    };
  }

  return {
    valid: true,
    value,
    scheme: scheme as "https" | "ipfs" | "ar",
  };
}

export function isSafeEscrowUri(input: string) {
  return validateEscrowUri(input).valid;
}
