"use client";

import { useQuery } from "@tanstack/react-query";
import { isAddress } from "viem";

import { browserUpbitNameService } from "@/services/names/browser-upbit-name-service";
import {
  isUpbitName,
  type NameResolutionResult,
} from "@/services/names/upbit-name-resolution";

const idleResult: NameResolutionResult = {
  status: "unavailable",
  message: "Enter a wallet address or username.up.id.",
};

export function useUpbitName(value: string, enabled = true) {
  const trimmed = value.trim();
  const direction = isAddress(trimmed)
    ? "reverse"
    : isUpbitName(trimmed)
      ? "forward"
      : null;
  const query = useQuery({
    queryKey: ["upbit-name", direction, trimmed.toLowerCase()],
    queryFn: () =>
      direction === "forward"
        ? browserUpbitNameService.resolveForward(trimmed)
        : browserUpbitNameService.resolveReverse(trimmed),
    enabled: enabled && direction !== null,
    staleTime: 60_000,
    retry: false,
  });

  return {
    result: query.data ?? idleResult,
    state:
      query.isFetching && !query.data
        ? ("resolving" as const)
        : query.data?.status,
    refresh: async () => {
      if (!direction) return idleResult;
      return direction === "forward"
        ? browserUpbitNameService.resolveForward(trimmed, true)
        : browserUpbitNameService.resolveReverse(trimmed, true);
    },
    refetch: query.refetch,
  };
}
