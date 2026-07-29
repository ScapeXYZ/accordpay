import type {
  NameResolutionResult,
  UpbitNameResolutionService,
} from "./upbit-name-resolution";

async function requestResolution(
  direction: "forward" | "reverse",
  value: string,
  bypassCache = false,
): Promise<NameResolutionResult> {
  const parameters = new URLSearchParams({
    direction,
    value,
  });

  if (bypassCache) {
    parameters.set("refresh", "true");
  }

  const response = await fetch(`/api/identity/upbit-name?${parameters}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      status: "unavailable",
      message: "Name resolution is temporarily unavailable.",
    };
  }

  return (await response.json()) as NameResolutionResult;
}

export const browserUpbitNameService: UpbitNameResolutionService = {
  resolveForward(name, bypassCache) {
    return requestResolution("forward", name, bypassCache);
  },
  resolveReverse(address, bypassCache) {
    return requestResolution("reverse", address, bypassCache);
  },
};
