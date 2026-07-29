import "server-only";

import {
  createPublicClient,
  getAddress,
  http,
  labelhash,
  numberToHex,
  pad,
  parseAbi,
  zeroAddress,
} from "viem";
import { sepolia } from "viem/chains";

import {
  EnsUpbitNameResolutionService,
  ResolutionCache,
  type EnsResolutionProvider,
} from "./upbit-name-resolution";

const ensRpcUrl = process.env.UPBIT_NAMES_ETHEREUM_RPC_URL?.trim();
const giwaRpcUrl =
  process.env.UPBIT_NAMES_GIWA_RPC_URL?.trim() ?? "https://sepolia-rpc.giwa.io";
const upIdRegistryAddress = getAddress(
  process.env.UPBIT_NAMES_REGISTRY_ADDRESS?.trim() ??
    "0x091D00004f21eb2Fc30964A8a4995692d9b49628",
);
const configuredTtlSeconds = Number(
  process.env.UPBIT_NAMES_CACHE_TTL_SECONDS ?? "60",
);
const confirmedTtlMs =
  Number.isFinite(configuredTtlSeconds) && configuredTtlSeconds > 0
    ? Math.min(configuredTtlSeconds, 300) * 1_000
    : 60_000;

const ensClient = ensRpcUrl
  ? createPublicClient({
      chain: sepolia,
      transport: http(ensRpcUrl, { retryCount: 1, timeout: 8_000 }),
    })
  : null;

const giwaClient = createPublicClient({
  transport: http(giwaRpcUrl, { retryCount: 1, timeout: 8_000 }),
});

const upIdRegistryAbi = parseAbi([
  "function hasActiveName(address owner) view returns (bool)",
  "function ownedTokenId(address owner) view returns (uint256)",
  "function getLabel(bytes32 key) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
]);

const provider: EnsResolutionProvider = {
  async getAddress(name) {
    const label = name.slice(0, -".up.id".length);
    const tokenId = BigInt(labelhash(label));
    let registryOwner: `0x${string}`;

    try {
      registryOwner = await giwaClient.readContract({
        address: upIdRegistryAddress,
        abi: upIdRegistryAbi,
        functionName: "ownerOf",
        args: [tokenId],
      });
    } catch {
      return null;
    }

    if (registryOwner === zeroAddress) {
      return null;
    }

    // When an Ethereum Sepolia ENS RPC is configured, require its public
    // forward record to agree with the official GIWA registry.
    if (ensClient) {
      const ensAddress = await ensClient.getEnsAddress({ name });
      if (!ensAddress || getAddress(ensAddress) !== getAddress(registryOwner)) {
        return null;
      }
    }

    return registryOwner;
  },
  async getName(address) {
    const active = await giwaClient.readContract({
      address: upIdRegistryAddress,
      abi: upIdRegistryAbi,
      functionName: "hasActiveName",
      args: [address],
    });

    if (!active) {
      return null;
    }

    const tokenId = await giwaClient.readContract({
      address: upIdRegistryAddress,
      abi: upIdRegistryAbi,
      functionName: "ownedTokenId",
      args: [address],
    });
    const [label, owner] = await Promise.all([
      giwaClient.readContract({
        address: upIdRegistryAddress,
        abi: upIdRegistryAbi,
        functionName: "getLabel",
        args: [pad(numberToHex(tokenId), { size: 32 })],
      }),
      giwaClient.readContract({
        address: upIdRegistryAddress,
        abi: upIdRegistryAbi,
        functionName: "ownerOf",
        args: [tokenId],
      }),
    ]);

    if (!label || getAddress(owner) !== getAddress(address)) {
      return null;
    }

    return `${label}.up.id`;
  },
};

export const serverUpbitNameService = new EnsUpbitNameResolutionService(
  provider,
  new ResolutionCache({
    confirmedTtlMs,
    unresolvedTtlMs: Math.min(confirmedTtlMs, 10_000),
  }),
);
