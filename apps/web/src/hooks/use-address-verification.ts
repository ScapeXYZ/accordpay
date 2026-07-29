"use client";

import { useQuery } from "@tanstack/react-query";
import { getAddress, isAddress } from "viem";

import type { AddressVerificationService } from "@/services/verification/address-verification";
import { addressVerificationClient } from "@/services/verification/browser-verification-service";

export type AddressVerificationState =
  | { status: "idle"; message: string }
  | { status: "checking"; message: string }
  | { status: "verified"; message: string }
  | { status: "not-verified"; message: string }
  | { status: "unavailable"; message: string };

export function useAddressVerification(
  address: string,
  service: AddressVerificationService = addressVerificationClient,
): AddressVerificationState {
  const trimmedAddress = address.trim();
  const valid = isAddress(trimmedAddress);
  const normalizedAddress = valid ? getAddress(trimmedAddress) : undefined;
  const query = useQuery({
    queryKey: ["dojang-address-verification", normalizedAddress],
    queryFn: ({ signal }) =>
      service.verifyAddress(normalizedAddress!, { signal }),
    enabled: normalizedAddress !== undefined,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (!trimmedAddress) {
    return { status: "idle", message: "Enter an address to verify it." };
  }
  if (!valid) {
    return {
      status: "idle",
      message: "Verification starts after a valid address is entered.",
    };
  }
  if (query.isFetching) {
    return {
      status: "checking",
      message: "Checking GIWA Dojang verification.",
    };
  }
  if (query.error) {
    return {
      status: "unavailable",
      message:
        query.error instanceof Error
          ? query.error.message
          : "GIWA Dojang verification is temporarily unavailable.",
    };
  }
  if (query.data?.verified) {
    return {
      status: "verified",
      message: "Dojang verified",
    };
  }
  if (query.data) {
    return {
      status: "not-verified",
      message: "Dojang not verified",
    };
  }
  return { status: "idle", message: "Waiting to verify this address." };
}
