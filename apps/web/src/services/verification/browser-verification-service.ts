import {
  normalizeVerificationAddress,
  VerificationServiceError,
  type AddressVerificationResult,
  type AddressVerificationService,
} from "./address-verification";

export class AccordPayVerificationClient implements AddressVerificationService {
  async verifyAddress(
    address: string,
    options?: { signal?: AbortSignal },
  ): Promise<AddressVerificationResult> {
    const normalizedAddress = normalizeVerificationAddress(address);
    const response = await fetch(
      `/api/verification/address?address=${encodeURIComponent(normalizedAddress)}`,
      {
        cache: "no-store",
        signal: options?.signal,
      },
    );
    let payload: {
      result?: AddressVerificationResult;
      error?: string;
      code?: string;
    };
    try {
      payload = (await response.json()) as typeof payload;
    } catch (error) {
      throw new VerificationServiceError(
        "Address verification returned an invalid response.",
        "INVALID_RESPONSE",
        { cause: error },
      );
    }

    if (!response.ok || !payload.result) {
      throw new VerificationServiceError(
        payload.error ?? "Address verification is temporarily unavailable.",
        payload.code === "NOT_CONFIGURED" ? "NOT_CONFIGURED" : "UPSTREAM_ERROR",
      );
    }
    return payload.result;
  }
}

export const addressVerificationClient = new AccordPayVerificationClient();
