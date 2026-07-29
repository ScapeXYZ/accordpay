import { getAddress, isAddress, type Address } from "viem";

export type AddressVerificationResult = {
  address: Address;
  verified: boolean;
  source: "dojang";
  checkedAt: string;
};

export interface AddressVerificationService {
  verifyAddress(
    address: string,
    options?: { signal?: AbortSignal },
  ): Promise<AddressVerificationResult>;
}

export type VerificationErrorCode =
  "INVALID_ADDRESS" | "NOT_CONFIGURED" | "UPSTREAM_ERROR" | "INVALID_RESPONSE";

export class VerificationServiceError extends Error {
  readonly code: VerificationErrorCode;

  constructor(
    message: string,
    code: VerificationErrorCode,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "VerificationServiceError";
    this.code = code;
  }
}

export function normalizeVerificationAddress(address: string): Address {
  const trimmed = address.trim();
  if (!isAddress(trimmed)) {
    throw new VerificationServiceError(
      "Enter a valid EVM wallet address.",
      "INVALID_ADDRESS",
    );
  }
  return getAddress(trimmed);
}
