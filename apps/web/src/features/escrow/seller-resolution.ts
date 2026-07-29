import { getAddress, isAddress, zeroAddress, type Address } from "viem";

import {
  isUpbitName,
  normalizeUpbitName,
  type NameResolutionResult,
} from "../../services/names/upbit-name-resolution.ts";

export function prepareSellerAddress(
  input: string,
  resolution: NameResolutionResult,
  confirmedResolution: string,
): Address {
  const trimmed = input.trim();

  if (isAddress(trimmed)) {
    const address = getAddress(trimmed);
    if (address === zeroAddress) throw new Error("Seller cannot be zero.");
    return address;
  }

  if (!isUpbitName(trimmed) || resolution.status !== "confirmed") {
    throw new Error("Seller name is not confirmed.");
  }

  const confirmation = `${normalizeUpbitName(trimmed)}:${resolution.address}`;
  if (confirmedResolution !== confirmation) {
    throw new Error("Resolved seller address has not been confirmed.");
  }

  return resolution.address;
}
