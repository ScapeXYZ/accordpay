import type { Address } from "viem";

import {
  normalizeVerificationAddress,
  VerificationServiceError,
  type AddressVerificationResult,
  type AddressVerificationService,
} from "./address-verification.ts";

export interface DojangContractReader {
  isVerified(address: Address): Promise<boolean>;
}

export class DojangVerificationService implements AddressVerificationService {
  private readonly reader: DojangContractReader;
  private readonly now: () => Date;

  constructor(
    reader: DojangContractReader,
    now: () => Date = () => new Date(),
  ) {
    this.reader = reader;
    this.now = now;
  }

  async verifyAddress(
    address: string,
    options?: { signal?: AbortSignal },
  ): Promise<AddressVerificationResult> {
    const normalizedAddress = normalizeVerificationAddress(address);

    if (options?.signal?.aborted) {
      throw options.signal.reason;
    }

    let verified: boolean;
    try {
      verified = await this.reader.isVerified(normalizedAddress);
    } catch (error) {
      if (options?.signal?.aborted) throw error;
      throw new VerificationServiceError(
        "GIWA Dojang verification is temporarily unavailable.",
        "UPSTREAM_ERROR",
        { cause: error },
      );
    }

    return {
      address: normalizedAddress,
      verified,
      source: "dojang",
      checkedAt: this.now().toISOString(),
    };
  }
}
