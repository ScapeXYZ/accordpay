import { getAddress, isAddress, type Address } from "viem";
import { normalize } from "viem/ens";

export const UPBIT_NAME_SUFFIX = ".up.id";

export type NameResolutionStatus =
  "confirmed" | "not-found" | "unavailable" | "mismatch";

export type NameResolutionResult =
  | {
      status: "confirmed";
      address: Address;
      name: string;
    }
  | {
      status: "not-found";
      address?: Address;
      name?: string;
    }
  | {
      status: "unavailable";
      address?: Address;
      name?: string;
      message: string;
    }
  | {
      status: "mismatch";
      address: Address;
      name: string;
      reverseName?: string;
      forwardAddress?: Address;
    };

export interface EnsResolutionProvider {
  getAddress(name: string): Promise<Address | null>;
  getName(address: Address): Promise<string | null>;
}

export interface UpbitNameResolutionService {
  resolveForward(
    name: string,
    bypassCache?: boolean,
  ): Promise<NameResolutionResult>;
  resolveReverse(
    address: string,
    bypassCache?: boolean,
  ): Promise<NameResolutionResult>;
}

type CacheEntry = {
  expiresAt: number;
  result: NameResolutionResult;
};

export type ResolutionCacheOptions = {
  confirmedTtlMs?: number;
  unresolvedTtlMs?: number;
  now?: () => number;
};

export class ResolutionCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly confirmedTtlMs: number;
  private readonly unresolvedTtlMs: number;
  private readonly now: () => number;

  constructor(options: ResolutionCacheOptions = {}) {
    this.confirmedTtlMs = options.confirmedTtlMs ?? 60_000;
    this.unresolvedTtlMs = options.unresolvedTtlMs ?? 10_000;
    this.now = options.now ?? Date.now;
  }

  get(key: string): NameResolutionResult | undefined {
    const entry = this.entries.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.result;
  }

  set(key: string, result: NameResolutionResult): void {
    if (result.status === "unavailable") {
      return;
    }

    const ttl =
      result.status === "confirmed"
        ? this.confirmedTtlMs
        : this.unresolvedTtlMs;
    this.entries.set(key, { expiresAt: this.now() + ttl, result });
  }
}

export function normalizeUpbitName(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Enter an Upbit Web3 Name.");
  }

  let normalized: string;

  try {
    normalized = normalize(trimmed);
  } catch {
    throw new Error("Enter a valid ENS-compatible name.");
  }

  const labels = normalized.split(".");

  if (
    labels.length !== 3 ||
    !labels[0] ||
    labels[1] !== "up" ||
    labels[2] !== "id"
  ) {
    throw new Error("Upbit Web3 Names must use the username.up.id format.");
  }

  return normalized;
}

export function isUpbitName(value: string): boolean {
  try {
    normalizeUpbitName(value);
    return true;
  } catch {
    return false;
  }
}

function sameAddress(left: string, right: string): boolean {
  return getAddress(left) === getAddress(right);
}

export class EnsUpbitNameResolutionService implements UpbitNameResolutionService {
  private readonly provider: EnsResolutionProvider;
  private readonly cache: ResolutionCache;

  constructor(provider: EnsResolutionProvider, cache = new ResolutionCache()) {
    this.provider = provider;
    this.cache = cache;
  }

  async resolveForward(
    input: string,
    bypassCache = false,
  ): Promise<NameResolutionResult> {
    let name: string;

    try {
      name = normalizeUpbitName(input);
    } catch (error) {
      return {
        status: "unavailable",
        name: input.trim() || undefined,
        message:
          error instanceof Error
            ? error.message
            : "The name format is invalid.",
      };
    }

    const cacheKey = `forward:${name}`;
    const cached = bypassCache ? undefined : this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const resolvedAddress = await this.provider.getAddress(name);

      if (!resolvedAddress) {
        const result: NameResolutionResult = { status: "not-found", name };
        this.cache.set(cacheKey, result);
        return result;
      }

      const address = getAddress(resolvedAddress);
      const reverseName = await this.provider.getName(address);

      if (!reverseName) {
        const result: NameResolutionResult = {
          status: "mismatch",
          address,
          name,
        };
        this.cache.set(cacheKey, result);
        return result;
      }

      let normalizedReverseName: string;

      try {
        normalizedReverseName = normalizeUpbitName(reverseName);
      } catch {
        const result: NameResolutionResult = {
          status: "mismatch",
          address,
          name,
          reverseName,
        };
        this.cache.set(cacheKey, result);
        return result;
      }

      if (normalizedReverseName !== name) {
        const result: NameResolutionResult = {
          status: "mismatch",
          address,
          name,
          reverseName: normalizedReverseName,
        };
        this.cache.set(cacheKey, result);
        return result;
      }

      const result: NameResolutionResult = {
        status: "confirmed",
        address,
        name,
      };
      this.cache.set(cacheKey, result);
      return result;
    } catch {
      return {
        status: "unavailable",
        name,
        message: "Name resolution is temporarily unavailable.",
      };
    }
  }

  async resolveReverse(
    input: string,
    bypassCache = false,
  ): Promise<NameResolutionResult> {
    if (!isAddress(input)) {
      return {
        status: "unavailable",
        message: "Enter a valid wallet address.",
      };
    }

    const address = getAddress(input);
    const cacheKey = `reverse:${address.toLowerCase()}`;
    const cached = bypassCache ? undefined : this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const reverseName = await this.provider.getName(address);

      if (!reverseName) {
        const result: NameResolutionResult = { status: "not-found", address };
        this.cache.set(cacheKey, result);
        return result;
      }

      let name: string;

      try {
        name = normalizeUpbitName(reverseName);
      } catch {
        const result: NameResolutionResult = {
          status: "mismatch",
          address,
          name: reverseName,
        };
        this.cache.set(cacheKey, result);
        return result;
      }

      const forwardAddress = await this.provider.getAddress(name);

      if (!forwardAddress || !sameAddress(forwardAddress, address)) {
        const result: NameResolutionResult = {
          status: "mismatch",
          address,
          name,
          forwardAddress: forwardAddress
            ? getAddress(forwardAddress)
            : undefined,
        };
        this.cache.set(cacheKey, result);
        return result;
      }

      const result: NameResolutionResult = {
        status: "confirmed",
        address,
        name,
      };
      this.cache.set(cacheKey, result);
      return result;
    } catch {
      return {
        status: "unavailable",
        address,
        message: "Name resolution is temporarily unavailable.",
      };
    }
  }
}
